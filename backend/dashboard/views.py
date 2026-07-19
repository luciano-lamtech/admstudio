from rest_framework.views import APIView
from rest_framework.response import Response
from clientes.models import Cliente


class DashboardResumoView(APIView):
    """
    GET /api/dashboard/resumo/
    Retorna indicadores gerais para os cards do dashboard.
    O banco usado é resolvido automaticamente pelo TenantDatabaseRouter
    a partir do token JWT do usuário logado.
    """

    def get(self, request):
        total_clientes = Cliente.objects.count()

        return Response({
            'total_clientes': total_clientes,
            'agendamentos_hoje': 0,     # placeholder p/ próximo módulo (Agenda)
            'faturamento_mes': 0,        # placeholder p/ próximo módulo (Financeiro)
            'tenant': request.auth.get('tenant_nome') if request.auth else None,
        })
