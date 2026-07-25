from django.core.management.base import BaseCommand

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias
from accounts.models import MenuItem


class Command(BaseCommand):
    """
    Remove um item de menu (pela rota) de TODOS os tenants cadastrados.
    Use quando um item sai do menu lateral padrão (accounts/menu_defaults.py)
    — por exemplo, quando ele passa a ser acessado só via card de outra tela.

    Exemplo:
        python manage.py remove_menu_item --rota /financeiro
    """
    help = 'Remove um item de menu (pela rota) de todos os tenants cadastrados.'

    def add_arguments(self, parser):
        parser.add_argument('--rota', required=True, help='Rota do item de menu a remover (ex: /financeiro)')

    def handle(self, *args, **options):
        rota = options['rota']
        tenants = Tenant.objects.filter(is_active=True)
        total_removidos = 0

        for tenant in tenants:
            nome = tenant.nome_fantasia or tenant.razao_social
            try:
                alias = register_tenant_connection(tenant)
                set_current_tenant_alias(alias)
                removidos, _ = MenuItem.objects.using(alias).filter(rota=rota).delete()
                if removidos:
                    total_removidos += removidos
                    self.stdout.write(self.style.SUCCESS(f'→ {nome}: item removido'))
                else:
                    self.stdout.write(f'→ {nome}: item não existia (ok)')
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'→ {nome}: ERRO — {exc}'))
            finally:
                set_current_tenant_alias(None)

        self.stdout.write(self.style.SUCCESS(f'\nConcluído: {total_removidos} item(ns) removido(s) no total.'))
