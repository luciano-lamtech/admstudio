"""
Cobrança do pagador (boleto). Um pagador pode ter vários CPFs/CNPJs (assinantes);
ele recebe um único boleto com o valor total.
"""
import re
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from authentication.utils import register_tenant_connection
from negocio.models import UnidadeNegocio
from . import efi

PRECO_BASE = Decimal('49.90')       # por CPF/CNPJ
PRECO_UNIDADE = Decimal('19.90')    # por unidade ativa além da primeira


def _digitos(texto):
    return re.sub(r'\D', '', texto or '')


def valor_pagador(pagador):
    total = Decimal('0')
    for tenant in pagador.tenants.all():
        total += PRECO_BASE
        alias = register_tenant_connection(tenant)
        ativas = UnidadeNegocio.objects.using(alias).filter(status='ativo').count()
        total += PRECO_UNIDADE * max(ativas - 1, 0)
    return total


def _cliente_efi(pagador):
    doc = _digitos(pagador.cpf_cnpj)
    cliente = {
        'name': pagador.nome,
        'email': pagador.email,
        'phone_number': _digitos(pagador.telefone),
        'address': {
            'street': pagador.rua,
            'number': pagador.numero,
            'neighborhood': pagador.bairro,
            'zipcode': _digitos(pagador.cep),
            'city': pagador.cidade,
            'complement': pagador.complemento,
            'state': pagador.uf,
        },
    }
    if len(doc) == 14:
        cliente['juridical_person'] = {'corporate_name': pagador.nome, 'cnpj': doc}
    else:
        cliente['cpf'] = doc
    return cliente


def cancelar_cobranca(pagador):
    if pagador.efi_assinatura_id:
        try:
            efi.chamar('PUT', f'/v1/subscription/{pagador.efi_assinatura_id}/cancel')
        except efi.EfiError:
            pass  # já cancelada ou expirada na Efí: segue para a nova cobrança
        pagador.efi_assinatura_id = ''
        pagador.save(update_fields=['efi_assinatura_id'])


def gerar_cobranca(pagador):
    """Cancela a cobrança anterior (se houver) e gera uma nova com o valor total atual."""
    total = valor_pagador(pagador)
    if total <= 0:
        raise ValueError('Nenhum assinante ativo para cobrar.')

    cancelar_cobranca(pagador)

    if not pagador.efi_plano_id:
        plano = efi.chamar('POST', '/v1/plan', {
            'name': f'ADMSTUDIO {pagador.nome}'[:100],
            'interval': 1,
            'repeats': None,
        })
        pagador.efi_plano_id = str(plano['plan_id'])

    assinatura = efi.chamar('POST', f'/v1/plan/{pagador.efi_plano_id}/subscription', {
        'items': [{'name': 'ADMSTUDIO - Mensalidade', 'value': int(total * 100), 'amount': 1}],
    })
    assinatura_id = str(assinatura['subscription_id'])

    vencimento = (timezone.now() + timedelta(days=10)).date().isoformat()
    boleto = efi.chamar('POST', f'/v1/subscription/{assinatura_id}/pay', {
        'payment': {
            'banking_billet': {
                'customer': _cliente_efi(pagador),
                'expire_at': vencimento,
                'message': 'Mensalidade ADMSTUDIO',
            },
        },
    })

    pagador.efi_assinatura_id = assinatura_id
    pagador.valor_atual = total
    pagador.forma_pagamento = 'boleto'
    pagador.status_cobranca = 'ativo'
    pagador.save(update_fields=['efi_plano_id', 'efi_assinatura_id', 'valor_atual',
                                'forma_pagamento', 'status_cobranca'])
    return boleto
