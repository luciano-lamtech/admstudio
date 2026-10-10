import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clientes', '0002_status_sexo_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventoHistorico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('agendamento_id', models.BigIntegerField(blank=True, null=True)),
                ('tipo', models.CharField(choices=[('agendamento_criado', 'Agendamento criado'), ('agendamento_excluido', 'Agendamento excluído'), ('status_alterado', 'Status alterado'), ('profissional_alterado', 'Profissional alterado'), ('data_alterada', 'Horário alterado'), ('observacao_alterada', 'Observação alterada'), ('item_adicionado', 'Item adicionado'), ('item_removido', 'Item removido'), ('item_alterado', 'Item alterado')], max_length=30)),
                ('descricao', models.CharField(max_length=255)),
                ('usuario_id', models.BigIntegerField(blank=True, null=True)),
                ('usuario_nome', models.CharField(blank=True, max_length=150)),
                ('detalhes', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('cliente', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='eventos_historico', to='clientes.cliente')),
            ],
            options={'db_table': 'historico_eventos', 'ordering': ['-created_at', '-id']},
        ),
    ]
