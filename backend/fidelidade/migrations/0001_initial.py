import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clientes', '0002_status_sexo_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracaoFidelidade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ativo', models.BooleanField(default=False)),
                ('percentual', models.DecimalField(decimal_places=2, default=0, help_text='Percentual do valor recebido que vira crédito (ex: 5 = 5%).', max_digits=5)),
                ('validade_dias', models.PositiveSmallIntegerField(default=365, help_text='Dias de validade de cada crédito.')),
            ],
            options={'db_table': 'fidelidade_config'},
        ),
        migrations.CreateModel(
            name='MovimentoCashback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('credito', 'Crédito'), ('uso', 'Uso')], max_length=10)),
                ('valor', models.DecimalField(decimal_places=2, max_digits=10)),
                ('validade_ate', models.DateField(blank=True, null=True)),
                ('lancamento_id', models.BigIntegerField(blank=True, null=True)),
                ('descricao', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='movimentos_cashback', to='clientes.cliente')),
            ],
            options={'db_table': 'fidelidade_movimentos', 'ordering': ['-created_at', '-id']},
        ),
    ]
