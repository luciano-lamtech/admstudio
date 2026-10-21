import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financeiro', '0003_cashback'),
        ('negocio', '0003_qrcode_pix_geral'),
    ]

    operations = [
        migrations.AddField(
            model_name='lancamento',
            name='unidade',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lancamentos', to='negocio.unidadenegocio'),
        ),
    ]
