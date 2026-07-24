import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clientes', '0001_initial'),
        ('accounts', '0001_initial'),
        ('catalogo', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Agendamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_hora', models.DateTimeField()),
                ('status', models.CharField(choices=[('agendado', 'Agendado'), ('confirmado', 'Confirmado'), ('em_atendimento', 'Em Atendimento'), ('concluido', 'Concluído'), ('cancelado', 'Cancelado')], default='agendado', max_length=20)),
                ('observacoes', models.TextField(blank=True)),
                ('valor_total', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='agendamentos', to='clientes.cliente')),
                ('profissional', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agendamentos', to='accounts.user')),
            ],
            options={
                'db_table': 'agendamentos',
                'ordering': ['-data_hora'],
            },
        ),
        migrations.CreateModel(
            name='AgendamentoItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantidade', models.PositiveIntegerField(default=1)),
                ('preco_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('agendamento', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='itens', to='agendamentos.agendamento')),
                ('item_catalogo', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='agendamento_itens', to='catalogo.itemcatalogo')),
            ],
            options={
                'db_table': 'agendamento_itens',
            },
        ),
    ]
