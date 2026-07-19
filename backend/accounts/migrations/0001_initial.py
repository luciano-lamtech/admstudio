import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=50)),
                ('nivel', models.PositiveSmallIntegerField(help_text='Quanto maior, mais permissões (1=básico, 10=admin)')),
            ],
            options={
                'db_table': 'roles',
            },
        ),
        migrations.CreateModel(
            name='MenuItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=60)),
                ('icone', models.CharField(help_text='nome do ícone (ex: bi-house)', max_length=50)),
                ('rota', models.CharField(max_length=100)),
                ('ordem', models.PositiveSmallIntegerField(default=0)),
                ('nivel_minimo', models.PositiveSmallIntegerField(default=1)),
            ],
            options={
                'db_table': 'menu_items',
                'ordering': ['ordem'],
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('nome', models.CharField(max_length=150)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('is_superuser', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='usuarios', to='accounts.role')),
            ],
            options={
                'db_table': 'usuarios',
            },
        ),
    ]
