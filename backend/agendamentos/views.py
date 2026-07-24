from rest_framework import viewsets
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
