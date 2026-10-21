from django.db import models

from clientes.models import Cliente


class ConfiguracaoFidelidade(models.Model):
    """Configuração única do programa de cashback do assinante."""
    ativo = models.BooleanField(default=False)
    percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                     help_text='Percentual do valor recebido que vira crédito (ex: 5 = 5%).')
    validade_dias = models.PositiveSmallIntegerField(default=365,
                                                     help_text='Dias de validade de cada crédito.')

    class Meta:
        db_table = 'fidelidade_config'


class MovimentoCashback(models.Model):
    """Crédito gerado por um pagamento, ou uso do saldo num pagamento."""
    TIPO_CHOICES = (('credito', 'Crédito'), ('uso', 'Uso'))

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='movimentos_cashback')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    validade_ate = models.DateField(null=True, blank=True)
    lancamento_id = models.BigIntegerField(null=True, blank=True)
    descricao = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fidelidade_movimentos'
        ordering = ['-created_at', '-id']
