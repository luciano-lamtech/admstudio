from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='UnidadeNegocio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome_empresa', models.CharField(max_length=150)),
                ('cnpj_cpf', models.CharField(blank=True, max_length=18)),
                ('nome_contato', models.CharField(blank=True, max_length=150)),
                ('telefone_contato', models.CharField(blank=True, help_text='Telefone / WhatsApp do contato', max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('telegram_id', models.CharField(blank=True, help_text='ID do Telegram para receber notificações', max_length=50)),
                ('endereco', models.CharField(blank=True, max_length=200)),
                ('numero', models.CharField(blank=True, max_length=10)),
                ('bairro', models.CharField(blank=True, max_length=100)),
                ('cidade', models.CharField(blank=True, max_length=100)),
                ('estado', models.CharField(blank=True, help_text='UF, ex: SP', max_length=2)),
                ('cep', models.CharField(blank=True, max_length=9)),
                ('pais', models.CharField(default='Brasil', max_length=60)),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'negocio_unidades',
                'ordering': ['nome_empresa'],
            },
        ),
    ]
