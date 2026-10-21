from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('financeiro', '0002_saldo_devedor'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lancamento',
            name='forma_pagamento',
            field=models.CharField(choices=[('dinheiro', 'Dinheiro'), ('pix', 'Pix'), ('cartao_credito', 'Cartão de Crédito'), ('cartao_debito', 'Cartão de Débito'), ('saldo_devedor', 'Saldo Devedor'), ('cashback', 'Cashback')], default='dinheiro', max_length=20),
        ),
    ]
