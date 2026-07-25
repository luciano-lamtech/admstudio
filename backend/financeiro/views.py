from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lancamento
from .serializers import LancamentoSerializer


class LancamentoViewSet(viewsets.ModelViewSet):
    """
    CRUD de lançamentos financeiros (receitas e despesas).
    Filtros: ?tipo=receita|despesa  ?status=pago|pendente
             ?data_inicio=YYYY-MM-DD  ?data_fim=YYYY-MM-DD
    """
    serializer_class = LancamentoSerializer

    def get_queryset(self):
        qs = Lancamento.objects.select_related('agendamento', 'agendamento__cliente')
        tipo = self.request.query_params.get('tipo')
        if tipo in ('receita', 'despesa'):
            qs = qs.filter(tipo=tipo)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        data_inicio = self.request.query_params.get('data_inicio')
        if data_inicio:
            qs = qs.filter(data__gte=data_inicio)
        data_fim = self.request.query_params.get('data_fim')
        if data_fim:
            qs = qs.filter(data__lte=data_fim)
        return qs

    @action(detail=True, methods=['post'])
    def receber(self, request, pk=None):
        """
        POST /api/financeiro/{id}/receber/
        body: { "forma_pagamento": "pix" }
        Dá baixa num lançamento pendente do Caixa, marcando como Pago.
        """
        lancamento = self.get_object()
        forma_pagamento = request.data.get('forma_pagamento', lancamento.forma_pagamento)
        lancamento.status = 'pago'
        lancamento.forma_pagamento = forma_pagamento
        lancamento.save()
        return Response(LancamentoSerializer(lancamento).data, status=status.HTTP_200_OK)
