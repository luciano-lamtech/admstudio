from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Pagador
from cobranca.servico import gerar_cobranca


class Command(BaseCommand):
    """Gera o boleto dos pagadores cujo período de teste terminou. Rodar todo dia (cron no EasyPanel)."""
    help = 'Gera a cobrança dos pagadores com teste vencido.'

    def handle(self, *args, **opts):
        hoje = timezone.now().astimezone(ZoneInfo('America/Sao_Paulo')).date()
        pendentes = Pagador.objects.filter(status_cobranca='teste', teste_ate__lte=hoje, forma_pagamento='boleto')
        for pagador in pendentes:
            try:
                gerar_cobranca(pagador)
                self.stdout.write(f'{pagador.nome}: cobrança gerada')
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'{pagador.nome}: {exc}'))
