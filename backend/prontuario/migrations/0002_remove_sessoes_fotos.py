from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('prontuario', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(name='FotoSessao'),
        migrations.DeleteModel(name='Sessao'),
    ]
