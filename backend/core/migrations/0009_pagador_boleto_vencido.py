from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_produto_preco'),
    ]

    operations = [
        migrations.AddField(
            model_name='pagador',
            name='link_boleto',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='pagador',
            name='linha_digitavel',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AlterField(
            model_name='pagador',
            name='status_cobranca',
            field=models.CharField(
                choices=[
                    ('teste', 'Período de teste'),
                    ('vencido', 'Período de teste - vencido'),
                    ('ativo', 'Em dia'),
                    ('devedor', 'Devedor'),
                    ('inativo', 'Inativo'),
                ],
                default='teste',
                max_length=10,
            ),
        ),
    ]
