from django.db import models
from accounts.models import User


class Especialidade(models.Model):
    """Cadastro de especialidades (Cabeleireiro, Manicure, Esteticista...)."""
    nome = models.CharField(max_length=100, unique=True)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'especialidades'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Profissional(models.Model):
    """
    Cadastro de profissionais que atendem (cabeleireiro, barbeiro,
    esteticista...). Pode, opcionalmente, ser vinculado a um usuário do
    sistema (accounts.User) para profissionais que também fazem login.
    """
    nome = models.CharField(max_length=150)
    especialidade = models.ForeignKey(
        Especialidade, on_delete=models.SET_NULL, null=True, blank=True, related_name='profissionais',
    )
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    comissao_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cor = models.CharField(
        max_length=7, default='#3b82f6',
        help_text='Cor usada para identificar o profissional na agenda (hex, ex: #3b82f6)',
    )
    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='perfil_profissional',
        help_text='Vincule a um usuário do sistema se este profissional também acessa o ADMSTUDIO.',
    )
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profissionais'
        ordering = ['nome']

    def __str__(self):
        return self.nome
