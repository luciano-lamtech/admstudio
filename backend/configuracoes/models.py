from django.db import models


class ConfiguracaoSistema(models.Model):
    """
    Preferências gerais do assinante (um único registro por banco de tenant).
    - fuso_horario: usado nas datas e horários do sistema (dashboard, agenda, chatbot...).
    - link_agendamento: link do robô de agendamento online. Vazio = usa o link padrão.
    """
    fuso_horario = models.CharField(max_length=64, default='America/Sao_Paulo')
    link_agendamento = models.URLField(max_length=300, blank=True, default='')
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'configuracao_sistema'

    def __str__(self):
        return f'Preferências do sistema ({self.fuso_horario})'

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
