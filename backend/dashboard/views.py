from datetime import timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from clientes.models import Cliente
from agendamentos.models import Agendamento
from financeiro.models import Lancamento

FUSO = ZoneInfo('America/Sao_Paulo')

STATUS_CLIENTE = [
    ('ativo', 'Ativo'),
    ('inativo', 'Inativo'),
    ('bloqueado', 'Bloqueado'),
    ('devedor', 'Devedor'),
]


def _idade(nascimento, hoje):
    return hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))


def _pct(parte, total):
    return round(parte * 100 / total, 1) if total else 0


class DashboardResumoView(APIView):
    """
    GET /api/dashboard/resumo/
    Indicadores e séries dos cards e gráficos do dashboard.
    Datas calculadas no fuso de São Paulo.
    """

    def get(self, request):
        hoje = timezone.now().astimezone(FUSO).date()

        # ---- Clientes ----
        clientes = Cliente.objects.all()
        total_clientes = clientes.count()
        clientes_ativos = clientes.filter(status='ativo').count()

        por_status = [
            {'nome': label, 'total': clientes.filter(status=valor).count()}
            for valor, label in STATUS_CLIENTE
        ]

        # Perfil: sexo e idade, sobre o total de clientes cadastrados
        homens = mulheres = menores_18 = maiores_65 = 0
        for sexo, nascimento in clientes.values_list('sexo', 'data_nascimento'):
            if sexo == 'masculino':
                homens += 1
            elif sexo == 'feminino':
                mulheres += 1
            if nascimento:
                idade = _idade(nascimento, hoje)
                if idade < 18:
                    menores_18 += 1
                elif idade >= 65:
                    maiores_65 += 1

        perfil = {
            'total': total_clientes,
            'homens': _pct(homens, total_clientes),
            'mulheres': _pct(mulheres, total_clientes),
            'menores_18': _pct(menores_18, total_clientes),
            'maiores_65': _pct(maiores_65, total_clientes),
        }

        # ---- Agendamentos de hoje ----
        do_dia = Agendamento.objects.filter(data_hora__date=hoje)
        total_hoje = do_dia.count()
        agendamentos_hoje = do_dia.exclude(status='cancelado').count()
        finalizados_hoje = do_dia.filter(status__in=['concluido', 'cancelado']).count()
        atendimentos_pct = _pct(finalizados_hoje, total_hoje)

        # ---- Novos clientes, últimos 14 dias ----
        inicio = hoje - timedelta(days=13)
        agregado = (
            Cliente.objects.filter(created_at__date__gte=inicio)
            .annotate(dia=TruncDate('created_at'))
            .values('dia')
            .annotate(total=Count('id'))
        )
        contagem_por_dia = {item['dia']: item['total'] for item in agregado}
        serie = []
        for i in range(14):
            dia = inicio + timedelta(days=i)
            serie.append({'data': dia.strftime('%d/%m'), 'total': contagem_por_dia.get(dia, 0)})

        return Response({
            'total_clientes': total_clientes,
            'clientes_ativos': clientes_ativos,
            'por_status': por_status,
            'perfil_clientes': perfil,
            'agendamentos_hoje': agendamentos_hoje,
            'atendimentos_hoje': {
                'percentual': atendimentos_pct,
                'finalizados': finalizados_hoje,
                'total': total_hoje,
            },
            'serie_clientes_por_dia': serie,
            'tenant': request.auth.get('tenant_nome') if request.auth else None,
        })
