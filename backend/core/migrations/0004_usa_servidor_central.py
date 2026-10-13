from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_integracao_whatsapp'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='usa_servidor_central',
            field=models.BooleanField(default=False, help_text='Marque para usar o mesmo servidor (host e porta) do banco central. Assim, trocar o servidor do central muda o dos assinantes marcados.'),
        ),
    ]
