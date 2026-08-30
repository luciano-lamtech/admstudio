from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='unidadenegocio',
            name='ativo',
        ),
        migrations.AddField(
            model_name='unidadenegocio',
            name='status',
            field=models.CharField(
                choices=[('em_analise', 'Em Análise'), ('ativo', 'Ativo'), ('inativo', 'Inativo')],
                default='em_analise',
                max_length=20,
            ),
        ),
    ]
