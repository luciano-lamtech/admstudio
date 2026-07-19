from django.core.management.base import BaseCommand
from django.core.management import call_command

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias
from accounts.models import Role, MenuItem, User


class Command(BaseCommand):
    """
    Provisiona um novo assinante (tenant) de ponta a ponta:
    1. Cria o registro do tenant no banco central.
    2. Roda as migrações das apps de negócio no banco MySQL do tenant.
    3. Cria os perfis de acesso (Roles) e o menu lateral padrão.
    4. Cria o primeiro usuário administrador.

    Exemplo de uso:

    python manage.py provision_tenant \
        --cnpj_cpf "12.345.678/0001-90" \
        --razao_social "Salão Bella Vitta LTDA" \
        --nome_fantasia "Bella Vitta" \
        --tipo_negocio salao \
        --db_name admstudio_bellavitta \
        --db_host meu-mysql-na-nuvem.com \
        --db_user usuario_mysql \
        --db_password senha_mysql \
        --admin_email admin@bellavitta.com \
        --admin_senha "SenhaForte123!" \
        --admin_nome "Maria Administradora"
    """
    help = 'Provisiona um novo assinante (tenant) completo: banco, roles, menu e usuário admin.'

    def add_arguments(self, parser):
        parser.add_argument('--cnpj_cpf', required=True)
        parser.add_argument('--razao_social', required=True)
        parser.add_argument('--nome_fantasia', default='')
        parser.add_argument('--tipo_negocio', default='salao',
                             choices=[c[0] for c in Tenant.TIPO_CHOICES])
        parser.add_argument('--db_name', required=True)
        parser.add_argument('--db_host', required=True)
        parser.add_argument('--db_user', required=True)
        parser.add_argument('--db_password', required=True)
        parser.add_argument('--db_port', default='3306')
        parser.add_argument('--admin_email', required=True)
        parser.add_argument('--admin_senha', required=True)
        parser.add_argument('--admin_nome', default='Administrador')

    def handle(self, *args, **options):
        cnpj_cpf = options['cnpj_cpf']

        tenant, created = Tenant.objects.get_or_create(
            cnpj_cpf=cnpj_cpf,
            defaults=dict(
                razao_social=options['razao_social'],
                nome_fantasia=options['nome_fantasia'],
                tipo_negocio=options['tipo_negocio'],
                db_name=options['db_name'],
                db_host=options['db_host'],
                db_user=options['db_user'],
                db_password=options['db_password'],
                db_port=options['db_port'],
            )
        )
        self.stdout.write(self.style.SUCCESS(
            f"Tenant {'criado' if created else 'já existia (reutilizando)'}: {tenant}"
        ))

        alias = register_tenant_connection(tenant)
        set_current_tenant_alias(alias)

        self.stdout.write('Rodando migrações no banco do tenant...')
        for app in ['accounts', 'dashboard', 'clientes']:
            call_command('migrate', app, database=alias, interactive=False, verbosity=1)

        # Perfis de acesso padrão
        role_admin, _ = Role.objects.using(alias).get_or_create(nome='Administrador', defaults={'nivel': 10})
        Role.objects.using(alias).get_or_create(nome='Gerente', defaults={'nivel': 7})
        Role.objects.using(alias).get_or_create(nome='Recepção', defaults={'nivel': 3})
        Role.objects.using(alias).get_or_create(nome='Profissional', defaults={'nivel': 1})

        # Menu lateral padrão
        MenuItem.objects.using(alias).get_or_create(
            rota='/dashboard',
            defaults=dict(label='Dashboard', icone='bi-speedometer2', ordem=1, nivel_minimo=1),
        )
        MenuItem.objects.using(alias).get_or_create(
            rota='/clientes',
            defaults=dict(label='Clientes', icone='bi-people', ordem=2, nivel_minimo=1),
        )

        # Usuário administrador
        email = options['admin_email'].lower()
        user, _ = User.objects.using(alias).get_or_create(
            email=email,
            defaults=dict(nome=options['admin_nome'], role=role_admin, is_staff=True, is_superuser=True),
        )
        user.role = role_admin
        user.nome = options['admin_nome']
        user.is_active = True
        user.set_password(options['admin_senha'])
        user.save(using=alias)

        set_current_tenant_alias(None)

        self.stdout.write(self.style.SUCCESS(
            f"\nTenant pronto para uso!\n"
            f"CPF/CNPJ (campo 'id' no login): {tenant.cnpj_cpf}\n"
            f"E-mail: {email}\n"
            f"Senha: a que você informou\n"
        ))
