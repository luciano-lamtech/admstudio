from django.db import models


class Tenant(models.Model):
    """
    Cadastro central de assinantes (clientes do SaaS ADMSTUDIO).
    Cada assinante possui um banco de dados MySQL próprio, identificado
    aqui pelo CPF/CNPJ informado na tela de login.
    """
    TIPO_CHOICES = (
        ('salao', 'Salão de Beleza'),
        ('barbearia', 'Barbearia'),
        ('clinica_estetica', 'Clínica de Estética'),
        ('outro', 'Outro'),
    )

    cnpj_cpf = models.CharField(max_length=18, unique=True, db_index=True)
    razao_social = models.CharField(max_length=150)
    nome_fantasia = models.CharField(max_length=150, blank=True)
    tipo_negocio = models.CharField(max_length=20, choices=TIPO_CHOICES, default='salao')

    # Credenciais do banco MySQL exclusivo desse assinante
    db_name = models.CharField(max_length=100)
    db_host = models.CharField(max_length=150)
    db_user = models.CharField(max_length=100)
    db_password = models.CharField(max_length=200)
    db_port = models.CharField(max_length=6, default='3306')

    is_active = models.BooleanField(default=True)
    plano = models.CharField(max_length=50, default='basico')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        verbose_name = 'Assinante'
        verbose_name_plural = 'Assinantes'

    def __str__(self):
        return f"{self.nome_fantasia or self.razao_social} ({self.cnpj_cpf})"

    @property
    def alias(self):
        """Alias único usado para registrar a conexão dinâmica desse tenant."""
        return f"tenant_{self.cnpj_cpf.replace('.', '').replace('/', '').replace('-', '')}"
