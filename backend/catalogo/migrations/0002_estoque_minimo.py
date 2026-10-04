from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='itemcatalogo',
            name='estoque_minimo',
            field=models.IntegerField(default=0, help_text='Abaixo desse valor, o produto entra no alerta de estoque baixo.'),
        ),
    ]
