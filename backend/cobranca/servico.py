"""
Cobrança do pagador (boleto) e ciclo de vida da assinatura.
Um pagador pode ter vários CPFs/CNPJs (assinantes) e recebe um único boleto com o valor total.
"""
import re
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from authentication.utils import register_tenant_connection
from core.models import Pagador
from negocio.models import UnidadeNegocio
from . import efi
from core.models import ProdutoPreco

DIAS_AVISO_ANTES_TESTE = 5          # e-mail avisando o fim do teste
DIAS_PARA_DEVEDOR = 1               # 1 dia de atraso: devedor
DIAS_PARA_INATIVO = 30              # 30 dias de atraso: inativo (login bloqueado)


def _hoje():
    return timezone.localdate()


def _digitos(texto):
    return re.sub(r'\D', '', texto or '')


def precos():
    """Valores vigentes, vindos da tabela ProdutoPreco (banco central)."""
    tabela = dict(ProdutoPreco.objects.filter(ativo=True).values_list('codigo', 'valor'))
    return {
        'assinatura_base': Decimal(str(tabela.get('assinatura_base', '49.90'))),
        'unidade_adicional': Decimal(str(tabela.get('unidade_adicional', '19.90'))),
    }


def calcular_tenant(tenant, p=None):
    """Valor mensal de um estabelecimento: base (com 1 unidade) + unidades extras não inativas."""
    p = p or precos()
    alias = register_tenant_connection(tenant)
    unidades = UnidadeNegocio.objects.using(alias).exclude(status='inativo').count()
    extras = max(unidades - 1, 0)
    return p['assinatura_base'] + p['unidade_adicional'] * extras, unidades


def valor_pagador(pagador):
    p = precos()
    total = Decimal('0')
    for tenant in pagador.tenants.all():
        valor, _ = calcular_tenant(tenant, p)
        total += valor
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

    vencimento = _hoje() + timedelta(days=10)
    boleto = efi.chamar('POST', f'/v1/subscription/{assinatura_id}/pay', {
        'payment': {
            'banking_billet': {
                'customer': _cliente_efi(pagador),
                'expire_at': vencimento.isoformat(),
                'message': 'Mensalidade ADMSTUDIO',
            },
        },
    })

    pagador.efi_assinatura_id = assinatura_id
    pagador.valor_atual = total
    pagador.forma_pagamento = 'boleto'
    pagador.status_cobranca = 'ativo'
    pagador.data_vencimento = vencimento
    pagador.save(update_fields=['efi_plano_id', 'efi_assinatura_id', 'valor_atual',
                                'forma_pagamento', 'status_cobranca', 'data_vencimento'])
    return boleto


def _enviar_email(pagador, assunto, texto):
    try:
        send_mail(assunto, texto, settings.DEFAULT_FROM_EMAIL, [pagador.email], fail_silently=False)
    except Exception:
        pass  # falha de e-mail não pode travar o ciclo de cobrança


def avisar_fim_teste(pagador):
    _enviar_email(
        pagador,
        'ADMSTUDIO - Seu teste termina em breve',
        f'Olá, {pagador.nome}!\n\n'
        f'Seu período de teste do ADMSTUDIO termina em {pagador.teste_ate:%d/%m/%Y}. '
        'A partir dessa data, a mensalidade passa a ser cobrada por boleto (com Pix), '
        'enviado por e-mail.\n\nQualquer dúvida, responda este e-mail.',
    )
    pagador.aviso_teste_enviado = True
    pagador.save(update_fields=['aviso_teste_enviado'])


def _avisar_mudanca(pagador, novo):
    textos = {
        'devedor': 'Identificamos um pagamento em atraso. Regularize o boleto para evitar o bloqueio do acesso.',
        'inativo': 'Sua assinatura está inativa por falta de pagamento e o acesso ao sistema foi bloqueado. '
                   'Regularize o boleto para reativar.',
        'ativo': 'Pagamento confirmado. Obrigado!',
    }
    if novo in textos:
        _enviar_email(pagador, f'ADMSTUDIO - Assinatura {dict(Pagador.STATUS_CHOICES).get(novo, novo)}',
                      f'Olá, {pagador.nome}!\n\n{textos[novo]}')


def sincronizar_pagador(pagador):
    """Consulta a Efí e atualiza o status: ativo, devedor (1 dia) ou inativo (30 dias)."""
    dados = efi.chamar('GET', f'/v1/subscription/{pagador.efi_assinatura_id}')
    historico = sorted(dados.get('history') or [], key=lambda h: str(h.get('created_at', '')))
    ultima = historico[-1] if historico else {}

    if ultima.get('status') == 'paid':
        novo = 'ativo'
        proximo = dados.get('next_expire_at')
        if proximo:
            pagador.data_vencimento = date.fromisoformat(proximo[:10])
    else:
        atraso = (_hoje() - pagador.data_vencimento).days if pagador.data_vencimento else 0
        if atraso >= DIAS_PARA_INATIVO:
            novo = 'inativo'
        elif atraso >= DIAS_PARA_DEVEDOR:
            novo = 'devedor'
        else:
            novo = 'ativo'

    anterior = pagador.status_cobranca
    pagador.status_cobranca = novo
    pagador.save(update_fields=['status_cobranca', 'data_vencimento'])
    if novo != anterior:
        _avisar_mudanca(pagador, novo)
    return novo


def executar_ciclo():
    """
    Roda uma vez por dia. Para cada pagador:
    - teste: avisa 5 dias antes do fim e gera o boleto no fim do teste;
    - demais: consulta a Efí e atualiza o status (em dia, devedor ou inativo).
    """
    hoje = _hoje()
    resultado = []
    for pagador in Pagador.objects.all():
        try:
            if pagador.status_cobranca == 'teste':
                if (pagador.teste_ate and not pagador.aviso_teste_enviado
                        and pagador.teste_ate - timedelta(days=DIAS_AVISO_ANTES_TESTE) <= hoje):
                    avisar_fim_teste(pagador)
                if pagador.teste_ate and pagador.teste_ate <= hoje and pagador.forma_pagamento == 'boleto':
                    gerar_cobranca(pagador)
                    resultado.append((pagador.nome, 'boleto gerado'))
                    continue
                resultado.append((pagador.nome, 'em teste'))
            elif pagador.efi_assinatura_id:
                novo = sincronizar_pagador(pagador)
                resultado.append((pagador.nome, novo))
            else:
                resultado.append((pagador.nome, 'sem cobrança gerada'))
        except Exception as exc:
            resultado.append((pagador.nome, f'erro: {exc}'))
    return resultado


def resumo_pagador(pagador):
    """Dados para a tela 'Minha assinatura': contas do pagador, valor total e preços vigentes."""
    p = precos()
    contas = []
    total = Decimal('0')
    for tenant in pagador.tenants.all():
        valor, unidades = calcular_tenant(tenant, p)
        total += valor
        contas.append({
            'nome': tenant.nome_fantasia or tenant.razao_social,
            'cnpj_cpf': tenant.cnpj_cpf,
            'unidades_ativas': unidades,
            'valor': str(valor),
        })
    return {
        'valor_total': str(total),
        'contas': contas,
        'precos': {k: str(v) for k, v in p.items()},
        'forma_pagamento': pagador.forma_pagamento,
        'status_cobranca': pagador.status_cobranca,
        'teste_ate': pagador.teste_ate,
        'valor_atual': str(pagador.valor_atual),
        'data_vencimento': pagador.data_vencimento,
    }


def atualizar_cobranca(tenant):
    """Chamado quando uma unidade é criada, ativada ou inativada: refaz o boleto com o novo valor."""
    if tenant is None or tenant.pagador_id is None:
        return None
    pagador = tenant.pagador
    if not pagador.efi_assinatura_id:
        return None  # ainda em teste: o valor será calculado quando o boleto for gerado
    return gerar_cobranca(pagador)


def vincular_ao_pagador(tenant, cpf_responsavel):
    """
    Liga o assinante ao pagador pelo CPF do responsável.
    Se o pagador já existe, o assinante herda a forma de pagamento dele
    e o boleto é refeito com o novo valor total.
    """
    doc = _digitos(cpf_responsavel)
    pagador, criado = Pagador.objects.get_or_create(
        cpf_cnpj=doc,
        defaults={'nome': tenant.nome_responsavel or tenant.razao_social,
                  'email': tenant.email_responsavel},
    )
    tenant.pagador = pagador
    tenant.save(update_fields=['pagador'])
    if not criado and pagador.efi_assinatura_id:
        gerar_cobranca(pagador)
    return pagador, criado
