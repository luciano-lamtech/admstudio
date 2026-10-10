import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clientes', '0002_status_sexo_token'),
        ('agendamentos', '0003_lembrete_whatsapp'),
        ('profissionais', '0002_especialidade'),
    ]

    operations = [
        migrations.CreateModel(
            name='Anamnese',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alergias', models.TextField(blank=True)),
                ('medicamentos', models.TextField(blank=True)),
                ('condicoes_saude', models.TextField(blank=True)),
                ('gestante', models.BooleanField(default=False)),
                ('tipo_pele', models.CharField(blank=True, max_length=60)),
                ('historico_procedimentos', models.TextField(blank=True)),
                ('observacoes', models.TextField(blank=True)),
                ('consentimento_lgpd', models.BooleanField(default=False)),
                ('consentimento_em', models.DateTimeField(blank=True, null=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('cliente', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='anamnese', to='clientes.cliente')),
            ],
            options={'db_table': 'prontuario_anamneses'},
        ),
        migrations.CreateModel(
            name='Sessao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.DateField()),
                ('procedimento', models.CharField(max_length=150)),
                ('descricao', models.TextField(blank=True)),
                ('observacoes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('agendamento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sessoes_prontuario', to='agendamentos.agendamento')),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessoes_prontuario', to='clientes.cliente')),
                ('profissional', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sessoes_prontuario', to='profissionais.profissional')),
            ],
            options={'db_table': 'prontuario_sessoes', 'ordering': ['-data', '-id']},
        ),
        migrations.CreateModel(
            name='FotoSessao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('antes', 'Antes'), ('depois', 'Depois')], max_length=10)),
                ('content_type', models.CharField(max_length=30)),
                ('imagem', models.BinaryField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sessao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fotos', to='prontuario.sessao')),
            ],
            options={'db_table': 'prontuario_fotos', 'ordering': ['id']},
        ),
    ]
