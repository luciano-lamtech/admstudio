from decimal import Decimal

from django.db import models

from clientes.models import Cliente
from accounts.models import User
from catalogo.models import ItemCatalogo


class Agendamento(models.Model):
    STATUS_CHOICES = (
        ('agendado', 'Agendado'),
        ('confirmado', 'Confirmado'),
        ('em_atendimento', 'Em Atendimento'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
    )

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='agendamentos')
    profissional = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name='agendamentos', null=True, blank=True,
    )
    data_hora = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='agendado')
    observacoes = models.TextField(blank=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agendamentos'
        ordering = ['-data_hora']

    def __str__(self):
        return f'{self.cliente.nome} - {self.data_hora:%d/%m/%Y %H:%M}'

    def recalcular_total(self):
        total = sum((item.subtotal for item in self.itens.all()), Decimal('0'))
        self.valor_total = total
        self.save(update_fields=['valor_total'])


class AgendamentoItem(models.Model):
    """Cada linha de serviço/produto lançado num agendamento (futura Ordem de Serviço)."""
    agendamento = models.ForeignKey(Agendamento, on_delete=models.CASCADE, related_name='itens')
    item_catalogo = models.ForeignKey(ItemCatalogo, on_delete=models.PROTECT, related_name='agendamento_itens')
    quantidade = models.PositiveIntegerField(default=1)
    # Preço "congelado" no momento do agendamento — não muda se o preço do
    # catálogo for reajustado depois.
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'agendamento_itens'

    def save(self, *args, **kwargs):
        self.subtotal = (self.preco_unitario or Decimal('0')) * self.quantidade
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.item_catalogo.nome} x{self.quantidade}'
