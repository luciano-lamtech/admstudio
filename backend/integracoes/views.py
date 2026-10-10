from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status

from .base import IntegracaoAPIView, FUSO
from .mensagens import texto_lembrete, texto_confirmado, texto_cancelado, texto_automatico
from agendamentos.models import Agendamento


def _telefone_whatsapp(telefone):
    digitos = ''.join(c for c in (telefone or '') if c.isdigit()).lstrip('0')
    return digitos if digitos.startswith('55') else '55' + digitos


def _servicos_txt(ag):
    nomes = [i.item_catalogo.nome for i in ag.itens.all()]
    return ', '.join(nomes) if nomes else 'seu atendimento'


class LembretesAmanhaView(IntegracaoAPIView):
    """
    GET /api/integracoes/lembretes-amanha/
    Lista os agendamentos de AMANHÃ (fuso de São Paulo) que ainda não
    receberam lembrete, já com a mensagem pronta e os dados da instância
    da Evolution. O n8n envia um por vez, respeitando o intervalo.
    """
    def get(self, request):
        erro = self.checar_token()
        if erro:
            return erro

        instancia = self.instancia_dict()
        if not instancia:
            return Response({'detail': 'Este assinante não tem instância de WhatsApp ativa.'},
                            status=status.HTTP_409_CONFLICT)

        agora = timezone.now().astimezone(FUSO)
        inicio_amanha = datetime(agora.year, agora.month, agora.day, tzinfo=FUSO) + timedelta(days=1)
        inicio_depois = inicio_amanha + timedelta(days=1)

        qs = (
            Agendamento.objects.filter(
                status='agendado',
                lembrete_enviado_em__isnull=True,
                data_hora__gte=inicio_amanha,
                data_hora__lt=inicio_depois,
            )
            .select_related('cliente', 'profissional')
            .prefetch_related('itens__item_catalogo')
            .order_by('data_hora')
        )

        salao = self.tenant.nome_fantasia or self.tenant.razao_social
        itens = []
        for ag in qs:
            if not ag.cliente.telefone:
                continue
            local = ag.data_hora.astimezone(FUSO)
            itens.append({
                'agendamento_id': ag.id,
                'telefone': _telefone_whatsapp(ag.cliente.telefone),
                'cliente_nome': ag.cliente.nome,
                'salao': salao,
                'profissional': ag.profissional.nome if ag.profissional else None,
                'data': local.strftime('%d/%m/%Y'),
                'hora': local.strftime('%H:%M'),
                'servicos': _servicos_txt(ag),
                'mensagem': texto_lembrete(
                    ag.cliente.nome, salao,
                    ag.profissional.nome if ag.profissional else None,
                    local.strftime('%d/%m'), local.strftime('%H:%M'), _servicos_txt(ag),
                ),
                'instancia': instancia,
            })

        return Response({'total': len(itens), 'lembretes': itens})


class MarcarLembreteEnviadoView(IntegracaoAPIView):
    """
    POST /api/integracoes/lembrete-enviado/   body: {"agendamento_id": 123}
    O n8n chama depois de enviar com sucesso, para não mandar duas vezes.
    """
    def post(self, request):
        erro = self.checar_token()
        if erro:
            return erro
        ag_id = request.data.get('agendamento_id')
        try:
            ag = Agendamento.objects.get(pk=ag_id)
        except Agendamento.DoesNotExist:
            return Response({'detail': 'Agendamento não encontrado.'}, status=404)
        ag.lembrete_enviado_em = timezone.now()
        ag.save(update_fields=['lembrete_enviado_em'])
        return Response({'ok': True})


class RespostaClienteView(IntegracaoAPIView):
    """
    POST /api/integracoes/resposta/   body: {"telefone": "5516...", "texto": "1"}
    Recebe a resposta do cliente (vinda do webhook da Evolution, via n8n).
    - "1" confirma, "2" cancela, só para agendamentos com lembrete já enviado.
    - Qualquer outra coisa não altera nada e recebe a mensagem automática.
    Retorna o texto que o n8n deve devolver ao cliente.
    """
    def post(self, request):
        erro = self.checar_token()
        if erro:
            return erro

        salao = self.tenant.nome_fantasia or self.tenant.razao_social
        telefone = _telefone_whatsapp(request.data.get('telefone'))
        resposta = (request.data.get('texto') or '').strip().lower()
        telefone_base = telefone[2:] if telefone.startswith('55') else telefone

        agora = timezone.now()
        if len(telefone_base) < 8:
            return Response({'acao': 'nenhuma', 'mensagem': texto_automatico(salao)})
        ag = (
            Agendamento.objects.filter(
                cliente__telefone__endswith=telefone_base[-8:],
                status='agendado',
                lembrete_enviado_em__isnull=False,
                data_hora__gte=agora,
            )
            .select_related('cliente')
            .order_by('data_hora')
            .first()
        )

        if ag is None or resposta not in ('1', '2'):
            if ag is not None:
                ag.resposta_whatsapp = (request.data.get('texto') or '')[:200]
                ag.respondido_em = agora
                ag.save(update_fields=['resposta_whatsapp', 'respondido_em'])
            return Response({'acao': 'nenhuma', 'mensagem': texto_automatico(salao)})

        ag.resposta_whatsapp = resposta
        ag.respondido_em = agora
        if resposta == '1':
            ag.status = 'confirmado'
            ag.save(update_fields=['status', 'resposta_whatsapp', 'respondido_em'])
            return Response({'acao': 'confirmado', 'mensagem': texto_confirmado(salao)})

        ag.status = 'cancelado'
        ag.save(update_fields=['status', 'resposta_whatsapp', 'respondido_em'])
        return Response({'acao': 'cancelado', 'mensagem': texto_cancelado(salao)})
