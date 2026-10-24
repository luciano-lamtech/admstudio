import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_cadastro_self_service'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pagador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=150)),
                ('cpf_cnpj', models.CharField(max_length=18, unique=True)),
                ('email', models.EmailField(max_length=254)),
                ('telefone', models.CharField(blank=True, max_length=20)),
                ('rua', models.CharField(blank=True, max_length=150)),
                ('numero', models.CharField(blank=True, max_length=10)),
                ('complemento', models.CharField(blank=True, max_length=60)),
                ('bairro', models.CharField(blank=True, max_length=100)),
                ('cep', models.CharField(blank=True, max_length=9)),
                ('cidade', models.CharField(blank=True, max_length=100)),
                ('uf', models.CharField(blank=True, max_length=2)),
                ('forma_pagamento', models.CharField(choices=[('boleto', 'Boleto'), ('cartao', 'Cartão')], default='boleto', max_length=10)),
                ('status_cobranca', models.CharField(choices=[('teste', 'Período de teste'), ('ativo', 'Em dia'), ('devedor', 'Devedor'), ('inativo', 'Inativo')], default='teste', max_length=10)),
                ('teste_ate', models.DateField(blank=True, null=True)),
                ('valor_atual', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('efi_plano_id', models.CharField(blank=True, max_length=30)),
                ('efi_assinatura_id', models.CharField(blank=True, max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'pagadores', 'verbose_name': 'Pagador', 'verbose_name_plural': 'Pagadores'},
        ),
        migrations.AddField(
            model_name='tenant',
            name='pagador',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tenants', to='core.pagador'),
        ),
    ]
