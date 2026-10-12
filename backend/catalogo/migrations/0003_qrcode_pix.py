from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0002_estoque_minimo'),
    ]

    operations = [
        migrations.AddField(
            model_name='itemcatalogo',
            name='qrcode_pix',
            field=models.TextField(blank=True, default=''),
        ),
    ]
