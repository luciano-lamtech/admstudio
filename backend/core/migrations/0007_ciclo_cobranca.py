from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_pagador'),
    ]

    operations = [
        migrations.AddField(model_name='pagador', name='data_vencimento', field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name='pagador', name='aviso_teste_enviado', field=models.BooleanField(default=False)),
    ]
