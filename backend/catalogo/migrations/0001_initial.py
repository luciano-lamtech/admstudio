from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ItemCatalogo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('servico', 'Serviço'), ('produto', 'Produto')], max_length=10)),
                ('nome', models.CharField(max_length=150)),
                ('descricao', models.TextField(blank=True)),
                ('categoria', models.CharField(blank=True, max_length=80)),
                ('preco', models.DecimalField(decimal_places=2, max_digits=10)),
                ('duracao_minutos', models.PositiveIntegerField(blank=True, help_text='Duração estimada do serviço, em minutos (usado na agenda).', null=True)),
                ('controla_estoque', models.BooleanField(default=False)),
                ('estoque_atual', models.IntegerField(default=0)),
                ('ativo', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'catalogo_itens',
                'ordering': ['nome'],
            },
        ),
    ]
