from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0004_nome_unidade'),
    ]

    operations = [
        migrations.AddField(
            model_name='unidadenegocio',
            name='complemento',
            field=models.CharField(blank=True, max_length=60),
        ),
    ]
