from django.core.management.base import BaseCommand
from django.core.management import call_command

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias


class Command(BaseCommand):
    """
    Aplica as migrações pendentes dos apps de tenant (accounts, clientes,
    e os módulos futuros) em TODOS os assinantes já cadastrados no banco
    central.

    Use este comando toda vez que criar/alterar um model de um app de
    tenant e gerar uma nova migração — assim todos os clientes já
    existentes recebem a mudança de uma vez.

    Exemplo de uso (com os apps padrão: accounts e clientes):

        python manage.py migrate_all_tenants

    Se criar um novo módulo/app de tenant (ex: agendamentos), inclua-o
    explicitamente:

        python manage.py migrate_all_tenants --apps accounts clientes agendamentos
    """
    help = 'Aplica migrações pendentes dos apps de tenant em todos os assinantes cadastrados.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apps',
            nargs='+',
            default=['accounts', 'clientes'],
            help='Apps de tenant a migrar (padrão: accounts clientes).',
        )

    def handle(self, *args, **options):
        apps_to_migrate = options['apps']
        tenants = Tenant.objects.filter(is_active=True)
        total = tenants.count()

        if total == 0:
            self.stdout.write(self.style.WARNING('Nenhum tenant cadastrado.'))
            return

        self.stdout.write(f'Encontrados {total} tenant(s) ativo(s). Aplicando migrações: {", ".join(apps_to_migrate)}\n')

        tenants_com_erro = []

        for tenant in tenants:
            nome = tenant.nome_fantasia or tenant.razao_social
            self.stdout.write(f'→ {nome} ({tenant.cnpj_cpf})')
            try:
                alias = register_tenant_connection(tenant)
                set_current_tenant_alias(alias)
                for app in apps_to_migrate:
                    call_command('migrate', app, database=alias, interactive=False, verbosity=1)
                self.stdout.write(self.style.SUCCESS('  OK\n'))
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'  ERRO: {exc}\n'))
                tenants_com_erro.append(f'{nome} ({tenant.cnpj_cpf})')
            finally:
                set_current_tenant_alias(None)

        self.stdout.write('=' * 60)
        if tenants_com_erro:
            self.stdout.write(self.style.ERROR(
                f'Concluído com erro em {len(tenants_com_erro)} de {total} tenant(s):'
            ))
            for t in tenants_com_erro:
                self.stdout.write(self.style.ERROR(f'  - {t}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Todos os {total} tenant(s) migrados com sucesso!'))
