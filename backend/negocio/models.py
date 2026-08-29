from django.db import models


class UnidadeNegocio(models.Model):
    """
    Dados de uma unidade/loja do assinante (Configurações → Dados do
    Negócio). Um mesmo assinante pode ter mais de uma unidade cadastrada
    aqui — cada linha representa um endereço/local de atendimento.
    """
    nome_empresa = models.CharField(max_length=150)
    cnpj_cpf = models.CharField(max_length=18, blank=True)

    nome_contato = models.CharField(max_length=150, blank=True)
    telefone_contato = models.CharField(max_length=20, blank=True, help_text='Telefone / WhatsApp do contato')
    email = models.EmailField(blank=True)
    telegram_id = models.CharField(max_length=50, blank=True, help_text='ID do Telegram para receber notificações')

    endereco = models.CharField(max_length=200, blank=True)
    numero = models.CharField(max_length=10, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True, help_text='UF, ex: SP')
    cep = models.CharField(max_length=9, blank=True)
    pais = models.CharField(max_length=60, default='Brasil')

    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'negocio_unidades'
        ordering = ['nome_empresa']

    def __str__(self):
        return f'{self.nome_empresa} - {self.cidade}/{self.estado}' if self.cidade else self.nome_empresa
