import logging

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import criar_permissao, nivel_do_token
from core.models import Pagador, Tenant
from . import efi
from .servico import garantir_boleto, resumo_pagador, sincronizar_pagador

logger = logging.getLogger(__name__)

PermissaoGerente = criar_permissao(7)


def _pagador_do_token(request):
    cnpj = request.auth.get('tenant_cnpj') if request.auth else None
    tenant = Tenant.objects.filter(cnpj_cpf=cnpj).select_related('pagador').first()
    return tenant.pagador if tenant is not None else None


def _resposta(pagador):
    dados = resumo_pagador(pagador)
    dados['sem_assinatura'] = False
    return Response(dados)


class AssinaturaView(APIView):
    """GET /api/assinatura/ — dados da assinatura do assinante logado (Gerente ou superior)."""
    permission_classes = [PermissaoGerente]

    def get(self, request):
        pagador = _pagador_do_token(request)
        if pagador is None:
            return Response({'sem_assinatura': True})
        return _resposta(pagador)


class SituacaoView(APIView):
    """
    GET /api/assinatura/situacao/ — qualquer usuário logado.
    Diz se o acesso está restrito (teste vencido / inativo) e por quê.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pagador = _pagador_do_token(request)
        if pagador is None:
            return Response({'bloqueado': False, 'status': None, 'gerente': nivel_do_token(request) >= 7})
        return Response({
            'bloqueado': pagador.bloqueado,
            'status': pagador.status_efetivo(),
            'gerente': nivel_do_token(request) >= 7,
        })


class GerarBoletoView(APIView):
    """POST /api/assinatura/gerar-boleto/ — reaproveita o boleto em aberto ou gera um novo."""
    permission_classes = [PermissaoGerente]

    def post(self, request):
        pagador = _pagador_do_token(request)
        if pagador is None:
            return Response({'detail': 'Nenhuma assinatura vinculada a este estabelecimento.'}, status=404)
        try:
            garantir_boleto(pagador)
        except (efi.EfiError, ValueError) as exc:
            logger.exception('Falha ao gerar boleto do pagador %s', pagador.pk)
            return Response({'detail': f'Não foi possível gerar o boleto agora. {exc}'}, status=502)
        except Exception:
            logger.exception('Erro inesperado ao gerar boleto do pagador %s', pagador.pk)
            return Response({'detail': 'Erro inesperado ao gerar o boleto. Veja o log do servidor (procure por "Erro inesperado ao gerar boleto").'}, status=500)
        pagador.refresh_from_db()
        return _resposta(pagador)


class VerificarPagamentoView(APIView):
    """POST /api/assinatura/verificar/ — "já paguei": consulta a Efí e libera se estiver pago."""
    permission_classes = [PermissaoGerente]

    def post(self, request):
        pagador = _pagador_do_token(request)
        if pagador is None:
            return Response({'detail': 'Nenhuma assinatura vinculada a este estabelecimento.'}, status=404)
        if pagador.efi_assinatura_id:
            try:
                sincronizar_pagador(pagador)
            except efi.EfiError as exc:
                logger.exception('Falha ao consultar pagamento do pagador %s', pagador.pk)
                return Response({'detail': f'Não foi possível consultar o pagamento agora. {exc}'}, status=502)
            except Exception:
                logger.exception('Erro inesperado ao consultar pagamento do pagador %s', pagador.pk)
                return Response({'detail': 'Erro inesperado ao consultar o pagamento. Veja o log do servidor.'}, status=500)
            pagador.refresh_from_db()
        return _resposta(pagador)


class WebhookEfiView(APIView):
    """
    POST /api/cobranca/webhook-efi/ — a Efí avisa aqui quando um boleto é pago.

    A Efí manda só um token (campo "notification"). Nada do que chega é confiado:
    o token é trocado, na própria Efí, pelos eventos reais, e o status do pagador
    é sempre recalculado consultando a assinatura na Efí (sincronizar_pagador).
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('notification')
        if not token:
            return Response({'detail': 'Notificação sem token.'}, status=400)

        try:
            eventos = efi.chamar('GET', f'/v1/notification/{token}')
        except efi.EfiError:
            logger.exception('Webhook Efí: não foi possível ler a notificação')
            return Response({'detail': 'Falha ao consultar a notificação.'}, status=502)  # a Efí tenta de novo

        eventos = eventos if isinstance(eventos, list) else []
        assinaturas = set()
        houve_pagamento = False
        for ev in eventos:
            atual = (ev.get('status') or {}).get('current')
            if atual not in ('paid', 'settled'):
                continue
            houve_pagamento = True
            sub = (ev.get('identifiers') or {}).get('subscription_id')
            if sub:
                assinaturas.add(str(sub))

        if not houve_pagamento:
            return Response({'ok': True, 'processados': 0})

        pagadores = Pagador.objects.exclude(efi_assinatura_id='')
        if assinaturas:
            pagadores = pagadores.filter(efi_assinatura_id__in=assinaturas)
        else:
            # evento sem o id da assinatura: confere quem está aguardando pagamento
            pagadores = pagadores.filter(status_cobranca__in=['teste', 'vencido', 'devedor', 'inativo'])

        processados = 0
        for pagador in pagadores:
            try:
                sincronizar_pagador(pagador)
                processados += 1
            except Exception:
                logger.exception('Webhook Efí: falha ao sincronizar o pagador %s', pagador.pk)
        return Response({'ok': True, 'processados': processados})
