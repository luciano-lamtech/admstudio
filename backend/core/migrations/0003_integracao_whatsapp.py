import secrets

import django.db.models.deletion
from django.db import migrations, models


def gerar_tokens_existentes(apps, schema_editor):
    Tenant = apps.get_model('core', 'Tenant')
    for tenant in Tenant.objects.filter(token_integracao__isnull=True):
        tenant.token_integracao = secrets.token_urlsafe(32)
        tenant.save(update_fields=['token_integracao'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_roadmapitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='InstanciaWhatsApp',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(help_text='Nome de identificação, ex: Instância 01', max_length=100)),
                ('url_base', models.CharField(help_text='URL da Evolution API, ex: https://evolution.seudominio.com', max_length=200)),
                ('nome_instancia', models.CharField(help_text='Nome da instância criada na Evolution', max_length=100)),
                ('api_key', models.CharField(help_text='apikey da instância (ou global da Evolution)', max_length=200)),
                ('numero', models.CharField(blank=True, help_text='Número conectado (informativo)', max_length=20)),
                ('intervalo_segundos', models.PositiveSmallIntegerField(default=5, help_text='Intervalo mínimo entre envios por esta instância (evita bloqueio).')),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Instância WhatsApp',
                'verbose_name_plural': 'Instâncias WhatsApp',
                'db_table': 'instancias_whatsapp',
                'ordering': ['nome'],
            },
        ),
        migrations.AddField(
            model_name='tenant',
            name='token_integracao',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='tenant',
            name='instancia_whatsapp',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assinantes', to='core.instanciawhatsapp'),
        ),
        migrations.RunPython(gerar_tokens_existentes, migrations.RunPython.noop),
    ]
