import django.db.models.deletion
from django.db import migrations, models


def limpar_profissional_antigo(apps, schema_editor):
    """
    O campo 'profissional' apontava para accounts.User; agora passa a
    apontar para profissionais.Profissional (tabela nova e vazia). Os IDs
    antigos não correspondem a nada na tabela nova, então limpamos o
    vínculo antes de trocar a restrição de chave estrangeira — evita erro
    de integridade no banco. Quem já tinha profissional atribuído no
    agendamento vai precisar reatribuir depois (cadastrando o Profissional
    correspondente).
    """
    Agendamento = apps.get_model('agendamentos', 'Agendamento')
    Agendamento.objects.all().update(profissional_id=None)


class Migration(migrations.Migration):

    dependencies = [
        ('agendamentos', '0001_initial'),
        ('profissionais', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(limpar_profissional_antigo, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='agendamento',
            name='profissional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agendamentos', to='profissionais.profissional'),
        ),
    ]
