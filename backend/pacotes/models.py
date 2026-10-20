from django.db import models

from catalogo.models import ItemCatalogo
from clientes.models import Cliente


class Pacote(models.Model):
    """Modelo de pacote à venda: ex. '10 sessões de depilação'."""
    nome = models.CharField(max_length=100)
    servico = models.ForeignKey(
        ItemCatalogo, on_delete=models.PROTECT, null=True, blank=True, related_name='pacotes',
        help_text='Serviço incluído no pacote (opcional).',
    )
    sessoes = models.PositiveSmallIntegerField(default=1)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    validade_dias = models.PositiveSmallIntegerField(default=180)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pacotes'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class ClientePacote(models.Model):
    """Pacote vendido a um cliente. Guarda os dados da venda (o pacote pode mudar depois)."""
    STATUS_CHOICES = (('ativo', 'Ativo'), ('cancelado', 'Cancelado'))

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pacotes_cliente')
    pacote = models.ForeignKey(Pacote, on_delete=models.PROTECT, related_name='vendas')
    nome_pacote = models.CharField(max_length=100)
    sessoes_total = models.PositiveSmallIntegerField()
    preco_pago = models.DecimalField(max_digits=10, decimal_places=2)
    comprado_em = models.DateField()
    validade_ate = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ativo')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cliente_pacotes'
        ordering = ['-comprado_em', '-id']


class UsoPacote(models.Model):
    """Cada sessão consumida do pacote."""
    cliente_pacote = models.ForeignKey(ClientePacote, on_delete=models.CASCADE, related_name='usos')
    data = models.DateField()
    agendamento_id = models.BigIntegerField(null=True, blank=True)
    observacao = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pacote_usos'
        ordering = ['-data', '-id']
