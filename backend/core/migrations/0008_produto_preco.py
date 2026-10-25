from decimal import Decimal

from django.db import migrations, models


def cadastrar_precos_iniciais(apps, schema_editor):
    ProdutoPreco = apps.get_model('core', 'ProdutoPreco')
    ProdutoPreco.objects.get_or_create(
        codigo='assinatura_base',
        defaults={'nome': 'Assinatura (inclui 1 unidade)', 'valor': Decimal('49.90'), 'ordem': 1},
    )
    ProdutoPreco.objects.get_or_create(
        codigo='unidade_adicional',
        defaults={'nome': 'Nova unidade', 'valor': Decimal('19.90'), 'ordem': 2},
    )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_ciclo_cobranca'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProdutoPreco',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.SlugField(max_length=50, unique=True)),
                ('nome', models.CharField(max_length=100)),
                ('valor', models.DecimalField(decimal_places=2, max_digits=10)),
                ('ativo', models.BooleanField(default=True)),
                ('ordem', models.PositiveSmallIntegerField(default=0)),
            ],
            options={'db_table': 'produtos_precos', 'ordering': ['ordem', 'nome'], 'verbose_name': 'Produto e preço', 'verbose_name_plural': 'Produtos e preços'},
        ),
        migrations.RunPython(cadastrar_precos_iniciais, migrations.RunPython.noop),
    ]
