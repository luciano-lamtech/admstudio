from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import criar_permissao
from clientes.models import Cliente
from .models import ConfiguracaoFidelidade, MovimentoCashback
from .service import configuracao, saldo

PermissaoConfig = criar_permissao(1, 7)
PermissaoLeitura = criar_permissao(1)


class ConfiguracaoFidelidadeView(APIView):
    """GET/PUT /api/fidelidade/config/ — leitura para todos, alteração a partir de Gerente (7)."""
    permission_classes = [PermissaoConfig]

    def _dados(self, cfg):
        return {'ativo': cfg.ativo, 'percentual': str(cfg.percentual), 'validade_dias': cfg.validade_dias}

    def get(self, request):
        return Response(self._dados(configuracao()))

    def put(self, request):
        cfg = ConfiguracaoFidelidade.objects.first() or ConfiguracaoFidelidade()
        try:
            percentual = Decimal(str(request.data.get('percentual', cfg.percentual)))
            validade = int(request.data.get('validade_dias', cfg.validade_dias))
        except Exception:
            return Response({'detail': 'Valores inválidos.'}, status=400)
        if percentual < 0 or percentual > 100 or validade < 1:
            return Response({'detail': 'Percentual entre 0 e 100, e validade de pelo menos 1 dia.'}, status=400)
        cfg.ativo = bool(request.data.get('ativo', cfg.ativo))
        cfg.percentual = percentual
        cfg.validade_dias = validade
        cfg.save()
        return Response(self._dados(cfg))


class ClienteCashbackView(APIView):
    """GET /api/fidelidade/clientes/<id>/ — saldo atual e extrato do cliente."""
    permission_classes = [PermissaoLeitura]

    def get(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        movimentos = MovimentoCashback.objects.filter(cliente=cliente)[:200]
        return Response({
            'saldo': str(saldo(cliente)),
            'ativo': configuracao().ativo,
            'movimentos': [{
                'id': m.id,
                'tipo': m.tipo,
                'valor': str(m.valor),
                'validade_ate': m.validade_ate,
                'descricao': m.descricao,
                'data': m.created_at.date(),
            } for m in movimentos],
        })
