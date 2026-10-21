from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo

from django.db.models import Sum
from django.utils import timezone

from .models import ConfiguracaoFidelidade, MovimentoCashback

FUSO = ZoneInfo('America/Sao_Paulo')


def _hoje():
    return timezone.now().astimezone(FUSO).date()


def configuracao():
    return ConfiguracaoFidelidade.objects.first() or ConfiguracaoFidelidade()


def saldo(cliente):
    hoje = _hoje()
    creditos = MovimentoCashback.objects.filter(cliente=cliente, tipo='credito').filter(
        validade_ate__gte=hoje) | MovimentoCashback.objects.filter(cliente=cliente, tipo='credito', validade_ate__isnull=True)
    total_creditos = creditos.aggregate(t=Sum('valor'))['t'] or Decimal('0')
    total_usos = MovimentoCashback.objects.filter(cliente=cliente, tipo='uso').aggregate(t=Sum('valor'))['t'] or Decimal('0')
    return total_creditos - total_usos


def creditar(lancamento):
    """Gera o crédito quando um pagamento de atendimento é recebido."""
    if not lancamento.agendamento_id:
        return
    cfg = configuracao()
    if not cfg.ativo or cfg.percentual <= 0:
        return
    if MovimentoCashback.objects.filter(lancamento_id=lancamento.id, tipo='credito').exists():
        return
    valor = (Decimal(lancamento.valor) * cfg.percentual / Decimal('100')).quantize(Decimal('0.01'), ROUND_HALF_UP)
    if valor <= 0:
        return
    MovimentoCashback.objects.create(
        cliente=lancamento.agendamento.cliente,
        tipo='credito',
        valor=valor,
        validade_ate=_hoje() + timedelta(days=cfg.validade_dias),
        lancamento_id=lancamento.id,
        descricao=f'Cashback do atendimento de {lancamento.data:%d/%m/%Y}',
    )


def usar(cliente, valor, lancamento):
    """Abate o valor do saldo. Lança ValueError se o saldo não cobrir o valor inteiro."""
    disponivel = saldo(cliente)
    if Decimal(valor) > disponivel:
        raise ValueError(f'Saldo de cashback insuficiente (disponível: R$ {disponivel:.2f}).'.replace('.', ','))
    MovimentoCashback.objects.create(
        cliente=cliente,
        tipo='uso',
        valor=Decimal(valor),
        lancamento_id=lancamento.id,
        descricao=f'Uso no pagamento do atendimento de {lancamento.data:%d/%m/%Y}',
    )
