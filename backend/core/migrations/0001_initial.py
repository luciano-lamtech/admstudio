from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Tenant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cnpj_cpf', models.CharField(db_index=True, max_length=18, unique=True)),
                ('razao_social', models.CharField(max_length=150)),
                ('nome_fantasia', models.CharField(blank=True, max_length=150)),
                ('tipo_negocio', models.CharField(choices=[('salao', 'Salão de Beleza'), ('barbearia', 'Barbearia'), ('clinica_estetica', 'Clínica de Estética'), ('outro', 'Outro')], default='salao', max_length=20)),
                ('db_name', models.CharField(max_length=100)),
                ('db_host', models.CharField(max_length=150)),
                ('db_user', models.CharField(max_length=100)),
                ('db_password', models.CharField(max_length=200)),
                ('db_port', models.CharField(default='3306', max_length=6)),
                ('is_active', models.BooleanField(default=True)),
                ('plano', models.CharField(default='basico', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Assinante',
                'verbose_name_plural': 'Assinantes',
                'db_table': 'tenants',
            },
        ),
    ]
