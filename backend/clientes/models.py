from django.db import models


class Cliente(models.Model):
    """Cliente/cadastro do salão, barbearia ou clínica (módulo Clientes e Cadastros)."""
    nome = models.CharField(max_length=150)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)
    telefone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    endereco = models.CharField(max_length=200, blank=True)
    observacoes = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clientes'
        ordering = ['nome']

    def __str__(self):
        return self.nome
