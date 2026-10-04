from django.db import models

from catalogo.models import ItemCatalogo
from accounts.models import User


class MovimentacaoEstoque(models.Model):
    """
    Registro de auditoria de cada entrada, saída ou ajuste de estoque de
    um produto do catálogo. Cada movimentação atualiza o estoque_atual
    do ItemCatalogo e guarda o resultado (estoque_resultante) para
    conferência histórica — por isso não é editável nem excluível,
    só criada e consultada.
    """
    TIPO_CHOICES = (
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
        ('ajuste', 'Ajuste'),
    )

    item_catalogo = models.ForeignKey(ItemCatalogo, on_delete=models.PROTECT, related_name='movimentacoes')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    # Entrada/Saída: quantidade movimentada. Ajuste: novo total absoluto.
    quantidade = models.IntegerField()
    estoque_resultante = models.IntegerField(default=0)
    motivo = models.CharField(max_length=200, blank=True)
    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimentacoes_estoque',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'estoque_movimentacoes'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.item_catalogo.nome} - {self.get_tipo_display()} ({self.quantidade})'
