from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_usa_servidor_central'),
    ]

    operations = [
        migrations.AddField(model_name='tenant', name='nome_responsavel', field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name='tenant', name='email_responsavel', field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name='tenant', name='telefone_responsavel', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='tenant', name='aceite_termos_em', field=models.DateTimeField(blank=True, null=True)),
    ]
