import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Profissional',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=150)),
                ('especialidade', models.CharField(blank=True, max_length=100)),
                ('telefone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('comissao_percentual', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('cor', models.CharField(default='#3b82f6', help_text='Cor usada para identificar o profissional na agenda (hex, ex: #3b82f6)', max_length=7)),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(blank=True, help_text='Vincule a um usuário do sistema se este profissional também acessa o ADMSTUDIO.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='perfil_profissional', to='accounts.user')),
            ],
            options={
                'db_table': 'profissionais',
                'ordering': ['nome'],
            },
        ),
    ]
