from datetime import timedelta

from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from clientes.models import Cliente
from agendamentos.models import Agendamento
from financeiro.models import Lancamento


class DashboardResumoView(APIView):
    """
    GET /api/dashboard/resumo/
    Retorna indicadores gerais e séries para os gráficos do dashboard.
    O banco usado é resolvido automaticamente pelo TenantDatabaseRouter
    a partir do token JWT do usuário logado.
    """

    def get(self, request):
        total_clientes = Cliente.objects.count()
        clientes_ativos = Cliente.objects.filter(ativo=True).count()
        clientes_inativos = Cliente.objects.filter(ativo=False).count()

        hoje = timezone.now().date()

        agendamentos_hoje = Agendamento.objects.filter(
            data_hora__date=hoje,
        ).exclude(status='cancelado').count()

        faturamento_mes = Lancamento.objects.filter(
            tipo='receita', status='pago', data__year=hoje.year, data__month=hoje.month,
        ).aggregate(total=Sum('valor'))['total'] or 0

        # Série dos últimos 14 dias: quantos clientes foram cadastrados por dia
        inicio = hoje - timedelta(days=13)
        agregado = (
            Cliente.objects.filter(created_at__date__gte=inicio)
            .annotate(dia=TruncDate('created_at'))
            .values('dia')
            .annotate(total=Count('id'))
        )
        contagem_por_dia = {item['dia']: item['total'] for item in agregado}

        serie_clientes_por_dia = []
        for i in range(14):
            dia = inicio + timedelta(days=i)
            serie_clientes_por_dia.append({
                'data': dia.strftime('%d/%m'),
                'total': contagem_por_dia.get(dia, 0),
            })

        return Response({
            'total_clientes': total_clientes,
            'clientes_ativos': clientes_ativos,
            'clientes_inativos': clientes_inativos,
            'agendamentos_hoje': agendamentos_hoje,
            'faturamento_mes': f'{faturamento_mes:.2f}'.replace('.', ','),
            'serie_clientes_por_dia': serie_clientes_por_dia,
            'tenant': request.auth.get('tenant_nome') if request.auth else None,
        })
