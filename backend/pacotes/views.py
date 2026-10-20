from datetime import timedelta
from zoneinfo import ZoneInfo

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.permissions import criar_permissao
from clientes.models import Cliente
from financeiro.models import Lancamento
from .models import Pacote, ClientePacote, UsoPacote
from .serializers import PacoteSerializer

FUSO = ZoneInfo('America/Sao_Paulo')

# Catálogo de pacotes: leitura para todos; configurar a partir de Gerente (7)
PermissaoPacote = criar_permissao(1, 7)
# Vender: a partir de Recepção (3). Consultar e registrar uso: todos.
PermissaoVenda = criar_permissao(3)
PermissaoLeitura = criar_permissao(1)


def _hoje():
    return timezone.now().astimezone(FUSO).date()


def _dados(cp):
    usadas = cp.usos.count()
    saldo = cp.sessoes_total - usadas
    hoje = _hoje()
    if cp.status == 'cancelado':
        situacao = 'cancelado'
    elif saldo <= 0:
        situacao = 'esgotado'
    elif cp.validade_ate < hoje:
        situacao = 'vencido'
    else:
        situacao = 'ativo'
    return {
        'id': cp.id,
        'nome_pacote': cp.nome_pacote,
        'sessoes_total': cp.sessoes_total,
        'sessoes_usadas': usadas,
        'saldo': saldo,
        'preco_pago': str(cp.preco_pago),
        'comprado_em': cp.comprado_em,
        'validade_ate': cp.validade_ate,
        'situacao': situacao,
        'usos': [{'id': u.id, 'data': u.data, 'observacao': u.observacao} for u in cp.usos.all()],
    }


class PacoteViewSet(viewsets.ModelViewSet):
    """CRUD do catálogo de pacotes. Filtro: ?ativo=true"""
    permission_classes = [PermissaoPacote]
    serializer_class = PacoteSerializer

    def get_queryset(self):
        qs = Pacote.objects.select_related('servico').all()
        if self.request.query_params.get('ativo') == 'true':
            qs = qs.filter(ativo=True)
        return qs

    def perform_destroy(self, instance):
        if instance.vendas.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Este pacote já foi vendido. Desative-o em vez de excluir.')
        instance.delete()


class ClientePacotesView(APIView):
    """GET /api/pacotes/clientes/<id>/ -> pacotes do cliente, com saldo e situação."""
    permission_classes = [PermissaoLeitura]

    def get(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        cps = ClientePacote.objects.filter(cliente=cliente).prefetch_related('usos')
        return Response([_dados(cp) for cp in cps])


class VenderPacoteView(APIView):
    """
    POST /api/pacotes/vender/   body: {"cliente": id, "pacote": id}
    Cria o pacote do cliente e uma pendência de recebimento no Caixa.
    """
    permission_classes = [PermissaoVenda]

    def post(self, request):
        cliente = get_object_or_404(Cliente, pk=request.data.get('cliente'))
        pacote = get_object_or_404(Pacote, pk=request.data.get('pacote'), ativo=True)
        hoje = _hoje()
        cp = ClientePacote.objects.create(
            cliente=cliente,
            pacote=pacote,
            nome_pacote=pacote.nome,
            sessoes_total=pacote.sessoes,
            preco_pago=pacote.preco,
            comprado_em=hoje,
            validade_ate=hoje + timedelta(days=pacote.validade_dias),
        )
        Lancamento.objects.create(
            tipo='receita',
            categoria='Pacote',
            descricao=f'Pacote {pacote.nome} - {cliente.nome}'[:200],
            valor=pacote.preco,
            forma_pagamento='dinheiro',
            status='pendente',
            data=hoje,
        )
        return Response(_dados(cp), status=status.HTTP_201_CREATED)


class UsarPacoteView(APIView):
    """
    POST /api/pacotes/cliente-pacotes/<id>/usar/
    body (opcional): {"data": "YYYY-MM-DD", "observacao": "...", "agendamento": id}
    Registra uma sessão consumida, se houver saldo e o pacote estiver válido.
    """
    permission_classes = [PermissaoLeitura]

    def post(self, request, pk):
        cp = get_object_or_404(ClientePacote, pk=pk)
        dados = _dados(cp)
        if dados['situacao'] != 'ativo':
            return Response({'detail': f'Não é possível usar: pacote {dados["situacao"]}.'}, status=400)
        UsoPacote.objects.create(
            cliente_pacote=cp,
            data=request.data.get('data') or _hoje(),
            observacao=(request.data.get('observacao') or '')[:200],
            agendamento_id=request.data.get('agendamento') or None,
        )
        return Response(_dados(cp))
