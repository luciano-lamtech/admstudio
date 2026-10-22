from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_senha_operacao'),
        ('negocio', '0003_qrcode_pix_geral'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='unidades',
            field=models.ManyToManyField(blank=True, related_name='usuarios_permitidos', to='negocio.unidadenegocio'),
        ),
    ]
