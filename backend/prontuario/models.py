from django.db import models

from clientes.models import Cliente
from agendamentos.models import Agendamento
from profissionais.models import Profissional


class Anamnese(models.Model):
    """Ficha de anamnese do cliente. Contém dados de saúde: exige consentimento (LGPD)."""
    cliente = models.OneToOneField(Cliente, on_delete=models.CASCADE, related_name='anamnese')
    alergias = models.TextField(blank=True)
    medicamentos = models.TextField(blank=True)
    condicoes_saude = models.TextField(blank=True)
    gestante = models.BooleanField(default=False)
    tipo_pele = models.CharField(max_length=60, blank=True)
    historico_procedimentos = models.TextField(blank=True)
    observacoes = models.TextField(blank=True)
    consentimento_lgpd = models.BooleanField(default=False)
    consentimento_em = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'prontuario_anamneses'


class Sessao(models.Model):
    """Atendimento registrado no prontuário (uma entrada por visita)."""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='sessoes_prontuario')
    agendamento = models.ForeignKey(
        Agendamento, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessoes_prontuario',
    )
    profissional = models.ForeignKey(
        Profissional, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessoes_prontuario',
    )
    data = models.DateField()
    procedimento = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    observacoes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prontuario_sessoes'
        ordering = ['-data', '-id']


class FotoSessao(models.Model):
    """Foto antes/depois de um atendimento. Fica no próprio banco do assinante."""
    TIPO_CHOICES = (('antes', 'Antes'), ('depois', 'Depois'))

    sessao = models.ForeignKey(Sessao, on_delete=models.CASCADE, related_name='fotos')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    content_type = models.CharField(max_length=30)
    imagem = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prontuario_fotos'
        ordering = ['id']
