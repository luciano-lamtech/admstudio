from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agendamentos', '0002_profissional_para_novo_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='agendamento',
            name='lembrete_enviado_em',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='agendamento',
            name='resposta_whatsapp',
            field=models.CharField(blank=True, help_text='Última resposta recebida do cliente', max_length=200),
        ),
        migrations.AddField(
            model_name='agendamento',
            name='respondido_em',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
