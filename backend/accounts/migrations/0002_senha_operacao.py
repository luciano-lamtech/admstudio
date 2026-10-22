from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracaoSeguranca',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('segredo', models.CharField(blank=True, max_length=64)),
            ],
            options={'db_table': 'configuracao_seguranca'},
        ),
    ]
