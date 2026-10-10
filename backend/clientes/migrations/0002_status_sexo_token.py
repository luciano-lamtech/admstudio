from django.db import migrations, models


def converter_ativo_para_status(apps, schema_editor):
    """Clientes que estavam ativo=True viram 'ativo'; ativo=False viram 'inativo'."""
    Cliente = apps.get_model('clientes', 'Cliente')
    Cliente.objects.filter(ativo=False).update(status='inativo')
    Cliente.objects.filter(ativo=True).update(status='ativo')


class Migration(migrations.Migration):

    dependencies = [
        ('clientes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='status',
            field=models.CharField(choices=[('ativo', 'Ativo'), ('inativo', 'Inativo'), ('bloqueado', 'Bloqueado'), ('devedor', 'Devedor')], default='ativo', max_length=10),
        ),
        migrations.RunPython(converter_ativo_para_status, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='cliente',
            name='ativo',
        ),
        migrations.AddField(
            model_name='cliente',
            name='sexo',
            field=models.CharField(blank=True, choices=[('masculino', 'Masculino'), ('feminino', 'Feminino')], max_length=10),
        ),
        migrations.AddField(
            model_name='cliente',
            name='token',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
