from decimal import Decimal

from django.db.models import Sum, Count
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Agendamento
from .serializers import AgendamentoSerializer


class AgendamentoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Agendamentos (com os itens de serviço/produto embutidos).
    Filtros: ?data=YYYY-MM-DD  ?status=agendado  ?cliente=<id>
    """
    serializer_class = AgendamentoSerializer

    def get_queryset(self):
        qs = Agendamento.objects.select_related('cliente', 'profissional').prefetch_related('itens__item_catalogo')
        data = self.request.query_params.get('data')
        if data:
            qs = qs.filter(data_hora__date=data)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            qs = qs.filter(cliente_id=cliente_id)
        return qs


class RelatorioComissaoView(APIView):
    """
    GET /api/agendamentos/relatorio-comissao/?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
    Relatório de comissão por profissional, calculado sobre os
    agendamentos CONCLUÍDOS dentro do período informado.
    """

    def get(self, request):
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        profissional_id = request.query_params.get('profissional')

        qs = Agendamento.objects.filter(status='concluido').exclude(profissional__isnull=True)
        if data_inicio:
            qs = qs.filter(data_hora__date__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_hora__date__lte=data_fim)
        if profissional_id:
            qs = qs.filter(profissional_id=profissional_id)

        agregado = (
            qs.values('profissional_id', 'profissional__nome', 'profissional__comissao_percentual')
            .annotate(total_atendimentos=Count('id'), total_faturado=Sum('valor_total'))
            .order_by('profissional__nome')
        )

        linhas = []
        total_geral_faturado = Decimal('0')
        total_geral_comissao = Decimal('0')

        for item in agregado:
            faturado = item['total_faturado'] or Decimal('0')
            percentual = item['profissional__comissao_percentual'] or Decimal('0')
            comissao = (faturado * percentual / Decimal('100')).quantize(Decimal('0.01'))
            linhas.append({
                'profissional_id': item['profissional_id'],
                'profissional_nome': item['profissional__nome'],
                'comissao_percentual': str(percentual),
                'total_atendimentos': item['total_atendimentos'],
                'total_faturado': str(faturado),
                'valor_comissao': str(comissao),
            })
            total_geral_faturado += faturado
            total_geral_comissao += comissao

        return Response({
            'periodo': {'data_inicio': data_inicio, 'data_fim': data_fim},
            'linhas': linhas,
            'total_geral_faturado': str(total_geral_faturado),
            'total_geral_comissao': str(total_geral_comissao),
        })
