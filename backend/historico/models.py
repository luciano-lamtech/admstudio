from django.db import models

from clientes.models import Cliente


class EventoHistorico(models.Model):
    """
    Log de tudo o que acontece com os agendamentos de um cliente.
    O agendamento é guardado só como número, para o histórico continuar
    existindo mesmo depois que o agendamento for excluído.
    """
    TIPO_CHOICES = (
        ('agendamento_criado', 'Agendamento criado'),
        ('agendamento_excluido', 'Agendamento excluído'),
        ('status_alterado', 'Status alterado'),
        ('profissional_alterado', 'Profissional alterado'),
        ('data_alterada', 'Horário alterado'),
        ('observacao_alterada', 'Observação alterada'),
        ('item_adicionado', 'Item adicionado'),
        ('item_removido', 'Item removido'),
        ('item_alterado', 'Item alterado'),
    )

    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, related_name='eventos_historico')
    agendamento_id = models.BigIntegerField(null=True, blank=True)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    descricao = models.CharField(max_length=255)
    usuario_id = models.BigIntegerField(null=True, blank=True)
    usuario_nome = models.CharField(max_length=150, blank=True)
    detalhes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historico_eventos'
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.descricao
