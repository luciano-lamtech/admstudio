from django.db import models


class Cliente(models.Model):
    """Cliente/cadastro do salão, barbearia ou clínica (módulo Clientes e Cadastros)."""

    STATUS_CHOICES = (
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
        ('bloqueado', 'Bloqueado'),
        ('devedor', 'Devedor'),
    )
    SEXO_CHOICES = (
        ('masculino', 'Masculino'),
        ('feminino', 'Feminino'),
    )

    nome = models.CharField(max_length=150)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)
    telefone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    sexo = models.CharField(max_length=10, choices=SEXO_CHOICES, blank=True)
    token = models.CharField(max_length=100, blank=True)
    endereco = models.CharField(max_length=200, blank=True)
    observacoes = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ativo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clientes'
        ordering = ['nome']

    def __str__(self):
        return self.nome
