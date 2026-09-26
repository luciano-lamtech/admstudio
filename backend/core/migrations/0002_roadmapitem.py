from django.db import migrations, models


ITENS_ROADMAP = [
    # (fase, titulo, descricao, ordem)
    ('fase_1', 'Usuários e Perfis de Acesso',
     'Tela real (hoje é só card em Gestão): listar/criar/editar usuários do tenant, atribuir Role, ativar/desativar acesso.',
     1),
    ('fase_1', 'Controle de estoque',
     'Entrada e saída de produtos do catálogo, histórico de movimentação, alerta de estoque baixo.',
     2),

    ('fase_2', 'Agenda visual',
     'Calendário por profissional/dia/semana (hoje o Agendamento é uma lista filtrada por data).',
     1),
    ('fase_2', 'Agendamento online para o cliente',
     'Link público onde o cliente escolhe serviço, profissional e horário sozinho.',
     2),
    ('fase_2', 'Notificações via WhatsApp',
     'Lembrete automático de agendamento, redução de falta (no-show).',
     3),

    ('fase_3', 'Prontuário do cliente',
     'Histórico de atendimentos, fotos antes/depois, anamnese, observações por sessão.',
     1),
    ('fase_3', 'Pacotes e planos',
     'Venda de pacotes de sessões (ex: "10x depilação") e assinaturas recorrentes de clientes.',
     2),
    ('fase_3', 'Programa de fidelidade / cashback', '', 3),
    ('fase_3', 'Suporte multi-unidade nas telas operacionais',
     'Seletor de unidade em Agendamentos, Clientes, Financeiro (hoje o cadastro de unidades existe em Configurações, mas as outras telas ainda não filtram por unidade).',
     4),

    ('fase_4', 'Cadastro de assinante self-service',
     'Formulário público de inscrição (hoje o provisionamento é manual, via comando).',
     1),
    ('fase_4', 'Cobrança automática',
     'Stripe / Mercado Pago / Asaas — integrar com o status "Em Análise → Ativo" das unidades.',
     2),
    ('fase_4', 'LGPD',
     'Exportação e exclusão de dados do titular mediante solicitação.',
     3),
    ('fase_4', 'Termos de Uso e Política de Privacidade', '', 4),
    ('fase_4', 'Central de ajuda / onboarding guiado',
     'Para novos assinantes.',
     5),
]


def popular_roadmap(apps, schema_editor):
    RoadmapItem = apps.get_model('core', 'RoadmapItem')
    for fase, titulo, descricao, ordem in ITENS_ROADMAP:
        RoadmapItem.objects.get_or_create(
            fase=fase, titulo=titulo,
            defaults={'descricao': descricao, 'ordem': ordem},
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RoadmapItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fase', models.CharField(choices=[('fase_1', 'Fase 1 — Fechar o que já foi iniciado'), ('fase_2', 'Fase 2 — Essenciais de mercado'), ('fase_3', 'Fase 3 — Diferenciais competitivos'), ('fase_4', 'Fase 4 — Preparação para comercializar')], max_length=10)),
                ('titulo', models.CharField(max_length=150)),
                ('descricao', models.TextField(blank=True)),
                ('concluido', models.BooleanField(default=False)),
                ('ordem', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Item do Roadmap',
                'verbose_name_plural': 'Roadmap de Evolução',
                'db_table': 'roadmap_itens',
                'ordering': ['fase', 'ordem'],
            },
        ),
        migrations.RunPython(popular_roadmap, migrations.RunPython.noop),
    ]
