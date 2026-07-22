from django.core.management.base import BaseCommand

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias
from accounts.models import MenuItem
from accounts.menu_defaults import DEFAULT_MENU_ITEMS


class Command(BaseCommand):
    """
    Garante que todos os tenants já cadastrados tenham os itens de menu
    mais recentes (definidos em accounts/menu_defaults.py). Não remove
    itens existentes, só adiciona os que estiverem faltando — seguro
    para rodar quantas vezes quiser.

    Use este comando toda vez que adicionarmos um módulo novo com tela
    própria no menu lateral.
    """
    help = 'Sincroniza os itens de menu padrão em todos os tenants já cadastrados.'

    def handle(self, *args, **options):
        tenants = Tenant.objects.filter(is_active=True)
        total = tenants.count()

        if total == 0:
            self.stdout.write(self.style.WARNING('Nenhum tenant cadastrado.'))
            return

        self.stdout.write(f'Sincronizando menu em {total} tenant(s)...\n')

        for tenant in tenants:
            nome = tenant.nome_fantasia or tenant.razao_social
            try:
                alias = register_tenant_connection(tenant)
                set_current_tenant_alias(alias)
                criados = 0
                for item in DEFAULT_MENU_ITEMS:
                    _, created = MenuItem.objects.using(alias).get_or_create(
                        rota=item['rota'],
                        defaults={k: v for k, v in item.items() if k != 'rota'},
                    )
                    if created:
                        criados += 1
                self.stdout.write(self.style.SUCCESS(f'→ {nome}: {criados} item(ns) novo(s) adicionado(s)'))
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'→ {nome}: ERRO — {exc}'))
            finally:
                set_current_tenant_alias(None)
