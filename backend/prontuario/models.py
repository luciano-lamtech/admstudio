from django.db import models

from clientes.models import Cliente


class Anamnese(models.Model):
    """
    Perfil do Cliente (antiga anamnese). Por enquanto usa os mesmos campos;
    serão ajustados depois. Contém dados de saúde: exige consentimento (LGPD).
    """
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
