import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalogo', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MovimentacaoEstoque',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('entrada', 'Entrada'), ('saida', 'Saída'), ('ajuste', 'Ajuste')], max_length=10)),
                ('quantidade', models.IntegerField()),
                ('estoque_resultante', models.IntegerField(default=0)),
                ('motivo', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('item_catalogo', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='movimentacoes', to='catalogo.itemcatalogo')),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='movimentacoes_estoque', to='accounts.user')),
            ],
            options={
                'db_table': 'estoque_movimentacoes',
                'ordering': ['-created_at'],
            },
        ),
    ]
