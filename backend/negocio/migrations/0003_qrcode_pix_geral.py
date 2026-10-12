from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0002_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='unidadenegocio',
            name='qrcode_pix_geral',
            field=models.TextField(blank=True, default=''),
        ),
    ]
