from django.db import models

from agendamentos.models import Agendamento


class Lancamento(models.Model):
    """Lançamento financeiro: uma Receita ou uma Despesa."""
    TIPO_CHOICES = (
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    )
    FORMA_PAGAMENTO_CHOICES = (
        ('dinheiro', 'Dinheiro'),
        ('pix', 'Pix'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
        ('outro', 'Outro'),
    )
    STATUS_CHOICES = (
        ('pago', 'Pago'),
        ('pendente', 'Pendente'),
    )

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.CharField(max_length=80, blank=True)
    descricao = models.CharField(max_length=200)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES, default='dinheiro')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pago')
    data = models.DateField()
    # Preenchido automaticamente quando a receita vem de um Agendamento concluído
    agendamento = models.ForeignKey(
        Agendamento, on_delete=models.SET_NULL, null=True, blank=True, related_name='lancamentos',
    )
    observacoes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financeiro_lancamentos'
        ordering = ['-data', '-id']

    def __str__(self):
        return f'[{self.get_tipo_display()}] {self.descricao} - R$ {self.valor}'
