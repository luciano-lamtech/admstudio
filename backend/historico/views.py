from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EventoHistorico


class HistoricoClienteView(APIView):
    """
    GET /api/historico/clientes/<id>/            -> últimos 500 eventos do cliente
    GET /api/historico/clientes/<id>/?agendamento=<n>  -> só de um agendamento
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, cliente_id):
        qs = EventoHistorico.objects.filter(cliente_id=cliente_id)
        agendamento = request.query_params.get('agendamento')
        if agendamento:
            qs = qs.filter(agendamento_id=agendamento)
        eventos = qs.order_by('-created_at', '-id')[:500]
        dados = [{
            'id': e.id,
            'tipo': e.tipo,
            'tipo_display': e.get_tipo_display(),
            'agendamento_id': e.agendamento_id,
            'descricao': e.descricao,
            'usuario_nome': e.usuario_nome,
            'created_at': e.created_at,
        } for e in eventos]
        return Response(dados)
