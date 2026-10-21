import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agendamentos', '0003_lembrete_whatsapp'),
        ('negocio', '0003_qrcode_pix_geral'),
    ]

    operations = [
        migrations.AddField(
            model_name='agendamento',
            name='unidade',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agendamentos', to='negocio.unidadenegocio'),
        ),
    ]
