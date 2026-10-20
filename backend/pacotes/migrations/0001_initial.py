import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalogo', '0001_initial'),
        ('clientes', '0002_status_sexo_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pacote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('sessoes', models.PositiveSmallIntegerField(default=1)),
                ('preco', models.DecimalField(decimal_places=2, max_digits=10)),
                ('validade_dias', models.PositiveSmallIntegerField(default=180)),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('servico', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='pacotes', to='catalogo.itemcatalogo')),
            ],
            options={'db_table': 'pacotes', 'ordering': ['nome']},
        ),
        migrations.CreateModel(
            name='ClientePacote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome_pacote', models.CharField(max_length=100)),
                ('sessoes_total', models.PositiveSmallIntegerField()),
                ('preco_pago', models.DecimalField(decimal_places=2, max_digits=10)),
                ('comprado_em', models.DateField()),
                ('validade_ate', models.DateField()),
                ('status', models.CharField(choices=[('ativo', 'Ativo'), ('cancelado', 'Cancelado')], default='ativo', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pacotes_cliente', to='clientes.cliente')),
                ('pacote', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='vendas', to='pacotes.pacote')),
            ],
            options={'db_table': 'cliente_pacotes', 'ordering': ['-comprado_em', '-id']},
        ),
        migrations.CreateModel(
            name='UsoPacote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.DateField()),
                ('agendamento_id', models.BigIntegerField(blank=True, null=True)),
                ('observacao', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cliente_pacote', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='usos', to='pacotes.clientepacote')),
            ],
            options={'db_table': 'pacote_usos', 'ordering': ['-data', '-id']},
        ),
    ]
