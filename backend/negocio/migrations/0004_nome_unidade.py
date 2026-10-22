from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0003_qrcode_pix_geral'),
    ]

    operations = [
        migrations.AddField(
            model_name='unidadenegocio',
            name='nome_unidade',
            field=models.CharField(blank=True, help_text='Nome que aparece nos filtros do sistema (ex: Loja Centro).', max_length=100),
        ),
    ]
