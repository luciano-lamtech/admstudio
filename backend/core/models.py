import re
import secrets

from django.db import models


class InstanciaWhatsApp(models.Model):
    """
    Instância da Evolution API disponível para envio de WhatsApp.
    Gerenciada no /admin/ pelo dono da plataforma. Cada assinante é
    vinculado a uma (ou nenhuma) instância, e você pode ter várias
    instâncias para distribuir a carga entre muitos clientes.
    """
    nome = models.CharField(max_length=100, help_text='Nome de identificação, ex: Instância 01')
    url_base = models.CharField(max_length=200, help_text='URL da Evolution API, ex: https://evolution.seudominio.com')
    nome_instancia = models.CharField(max_length=100, help_text='Nome da instância criada na Evolution')
    api_key = models.CharField(max_length=200, help_text='apikey da instância (ou global da Evolution)')
    numero = models.CharField(max_length=20, blank=True, help_text='Número conectado (informativo)')
    intervalo_segundos = models.PositiveSmallIntegerField(
        default=5, help_text='Intervalo mínimo entre envios por esta instância (evita bloqueio).',
    )
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'instancias_whatsapp'
        verbose_name = 'Instância WhatsApp'
        verbose_name_plural = 'Instâncias WhatsApp'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} ({self.nome_instancia})'


class ProdutoPreco(models.Model):
    """
    Tabela de preços da plataforma. Para mudar um valor, altere aqui no admin.
    O código é usado pelo sistema: não altere.
    """
    codigo = models.SlugField(max_length=50, unique=True)
    nome = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)
    ordem = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'produtos_precos'
        ordering = ['ordem', 'nome']
        verbose_name = 'Produto e preço'
        verbose_name_plural = 'Produtos e preços'

    def __str__(self):
        return f'{self.nome}: R$ {self.valor}'


class Pagador(models.Model):
    """
    Quem paga a mensalidade. Um pagador pode ter vários CPFs/CNPJs (assinantes)
    e recebe um único boleto com o valor total.
    """
    STATUS_CHOICES = (
        ('teste', 'Período de teste'),
        ('ativo', 'Em dia'),
        ('devedor', 'Devedor'),
        ('inativo', 'Inativo'),
    )
    FORMA_CHOICES = (('boleto', 'Boleto'), ('cartao', 'Cartão'))

    nome = models.CharField(max_length=150)
    cpf_cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=20, blank=True)
    rua = models.CharField(max_length=150, blank=True)
    numero = models.CharField(max_length=10, blank=True)
    complemento = models.CharField(max_length=60, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cep = models.CharField(max_length=9, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, blank=True)

    forma_pagamento = models.CharField(max_length=10, choices=FORMA_CHOICES, default='boleto')
    status_cobranca = models.CharField(max_length=10, choices=STATUS_CHOICES, default='teste')
    teste_ate = models.DateField(null=True, blank=True)
    data_vencimento = models.DateField(null=True, blank=True)
    aviso_teste_enviado = models.BooleanField(default=False)
    valor_atual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    efi_plano_id = models.CharField(max_length=30, blank=True)
    efi_assinatura_id = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pagadores'
        verbose_name = 'Pagador'
        verbose_name_plural = 'Pagadores'

    def save(self, *args, **kwargs):
        if self.pk is None and not self.teste_ate and self.status_cobranca == 'teste':
            from datetime import timedelta
            from django.utils import timezone
            self.teste_ate = timezone.now().date() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.nome} ({self.cpf_cnpj})'


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
    usa_servidor_central = models.BooleanField(
        default=False,
        help_text='Marque para usar o mesmo servidor (host e porta) do banco central. '
                  'Assim, trocar o servidor do central muda o dos assinantes marcados.',
    )
    db_port = models.CharField(max_length=6, default='3306')

    is_active = models.BooleanField(default=True)
    plano = models.CharField(max_length=50, default='basico')

    # Responsável que fez o cadastro (self-service) e aceite dos termos
    nome_responsavel = models.CharField(max_length=150, blank=True)
    email_responsavel = models.EmailField(blank=True)
    telefone_responsavel = models.CharField(max_length=20, blank=True)
    aceite_termos_em = models.DateTimeField(null=True, blank=True)

    # Quem paga a mensalidade deste assinante
    pagador = models.ForeignKey('core.Pagador', on_delete=models.SET_NULL, null=True, blank=True, related_name='tenants')

    # Integração (n8n): token que autentica o n8n em nome deste assinante
    token_integracao = models.CharField(max_length=64, unique=True, blank=True, null=True)
    # Instância da Evolution que envia os WhatsApp deste assinante
    instancia_whatsapp = models.ForeignKey(
        InstanciaWhatsApp, on_delete=models.SET_NULL, null=True, blank=True, related_name='assinantes',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        verbose_name = 'Assinante'
        verbose_name_plural = 'Assinantes'

    def gerar_novo_token(self):
        self.token_integracao = secrets.token_urlsafe(32)

    def save(self, *args, **kwargs):
        if not self.token_integracao:
            self.gerar_novo_token()
        # Garante que o CNPJ/CPF seja sempre salvo só com números,
        # independente de como foi digitado (com ou sem pontuação).
        if self.cnpj_cpf:
            self.cnpj_cpf = re.sub(r'\D', '', self.cnpj_cpf)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome_fantasia or self.razao_social} ({self.cnpj_cpf})"

    @property
    def alias(self):
        """Alias único usado para registrar a conexão dinâmica desse tenant."""
        return f"tenant_{self.cnpj_cpf}"


class RoadmapItem(models.Model):
    """
    Checklist de evolução do ADMSTUDIO como produto (roadmap interno da
    plataforma, não é uma funcionalidade de um tenant específico — por
    isso fica só aqui no banco central, visível no /admin/).
    """
    FASE_CHOICES = (
        ('fase_1', 'Fase 1 — Fechar o que já foi iniciado'),
        ('fase_2', 'Fase 2 — Essenciais de mercado'),
        ('fase_3', 'Fase 3 — Diferenciais competitivos'),
        ('fase_4', 'Fase 4 — Preparação para comercializar'),
    )

    fase = models.CharField(max_length=10, choices=FASE_CHOICES)
    titulo = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    concluido = models.BooleanField(default=False)
    ordem = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'roadmap_itens'
        verbose_name = 'Item do Roadmap'
        verbose_name_plural = 'Roadmap de Evolução'
        ordering = ['fase', 'ordem']

    def __str__(self):
        return self.titulo
