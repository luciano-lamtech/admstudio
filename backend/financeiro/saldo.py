"""
Regra do saldo devedor:
- Salvar uma pendência como "Saldo Devedor" deixa o registro no Caixa (pendente)
  e muda o cliente de Ativo para Devedor.
- Quitar um registro (receber com outra forma) libera o cliente para Ativo,
  somente se ele não tiver mais nenhum registro de Saldo Devedor pendente.
"""
from clientes.models import Cliente


def _cliente(lancamento):
    return lancamento.agendamento.cliente if lancamento.agendamento_id else None


def marcar_devedor(lancamento):
    cliente = _cliente(lancamento)
    if cliente and cliente.status == 'ativo':
        cliente.status = 'devedor'
        cliente.save(update_fields=['status'])


def liberar_se_quitado(lancamento):
    from .models import Lancamento
    cliente = _cliente(lancamento)
    if not cliente or cliente.status != 'devedor':
        return
    ainda_deve = Lancamento.objects.filter(
        agendamento__cliente=cliente, forma_pagamento='saldo_devedor', status='pendente',
    ).exists()
    if not ainda_deve:
        cliente.status = 'ativo'
        cliente.save(update_fields=['status'])
