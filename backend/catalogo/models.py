from django.db import models


class ItemCatalogo(models.Model):
    """
    Serviços e Produtos oferecidos pelo negócio (salão, barbearia, clínica).
    Modelo único para os dois, diferenciados pelo campo `tipo` — isso
    permite que o futuro módulo de Agendamento/Ordem de Serviço lance
    tanto serviços quanto produtos na mesma lista de itens.
    """
    TIPO_CHOICES = (
        ('servico', 'Serviço'),
        ('produto', 'Produto'),
    )

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    nome = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    categoria = models.CharField(max_length=80, blank=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)

    # Específico de Serviço
    duracao_minutos = models.PositiveIntegerField(
        blank=True, null=True,
        help_text='Duração estimada do serviço, em minutos (usado na agenda).',
    )

    # Específico de Produto
    controla_estoque = models.BooleanField(default=False)
    estoque_atual = models.IntegerField(default=0)

    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalogo_itens'
        ordering = ['nome']

    def __str__(self):
        return f'[{self.get_tipo_display()}] {self.nome}'
