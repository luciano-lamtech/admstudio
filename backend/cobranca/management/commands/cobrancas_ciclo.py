from django.core.management.base import BaseCommand

from cobranca.servico import executar_ciclo


class Command(BaseCommand):
    """
    Ciclo diário de cobrança: avisos de fim de teste, boletos, e status
    (em dia, devedor com 1 dia de atraso, inativo com 30 dias).
    Rodar uma vez por dia: python manage.py cobrancas_ciclo
    """
    help = 'Executa o ciclo diário de cobrança dos pagadores.'

    def handle(self, *args, **opts):
        for nome, situacao in executar_ciclo():
            self.stdout.write(f'{nome}: {situacao}')
