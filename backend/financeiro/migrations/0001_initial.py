import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('agendamentos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Lancamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('receita', 'Receita'), ('despesa', 'Despesa')], max_length=10)),
                ('categoria', models.CharField(blank=True, max_length=80)),
                ('descricao', models.CharField(max_length=200)),
                ('valor', models.DecimalField(decimal_places=2, max_digits=10)),
                ('forma_pagamento', models.CharField(choices=[('dinheiro', 'Dinheiro'), ('pix', 'Pix'), ('cartao_credito', 'Cartão de Crédito'), ('cartao_debito', 'Cartão de Débito'), ('outro', 'Outro')], default='dinheiro', max_length=20)),
                ('status', models.CharField(choices=[('pago', 'Pago'), ('pendente', 'Pendente')], default='pago', max_length=10)),
                ('data', models.DateField()),
                ('observacoes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agendamento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lancamentos', to='agendamentos.agendamento')),
            ],
            options={
                'db_table': 'financeiro_lancamentos',
                'ordering': ['-data', '-id'],
            },
        ),
    ]
