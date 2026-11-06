"""
Endereço obrigatório do assinante.

O boleto da Efí usa o endereço do Pagador (core.Pagador), e o cadastro self-service cria
a unidade "Matriz" e o Pagador sem endereço. Esta tela obriga o preenchimento no primeiro
acesso: grava na unidade principal (Dados do Negócio) e no Pagador.

Fica no app `cobranca` (rota /api/assinatura/endereco/) porque essa rota continua liberada
mesmo com o teste vencido (ver authentication/jwt.py).
"""
import re

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import nivel_do_token
from core.models import Tenant
from negocio.models import UnidadeNegocio

NIVEL_GERENTE = 7
COMPLEMENTO_MAX = 60  # tamanho de Pagador.complemento e UnidadeNegocio.complemento

UFS = {
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
}

# campo da unidade -> (rótulo, tamanho máximo)
CAMPOS = {
    'cep': ('CEP', 9),
    'pais': ('País', 60),
    'endereco': ('Endereço', 150),   # 150 = tamanho de Pagador.rua
    'numero': ('Número', 10),
    'bairro': ('Bairro', 100),
    'cidade': ('Cidade', 100),
    'estado': ('UF', 2),
}

# campo da unidade -> campo equivalente no Pagador (o país não existe no Pagador)
PARA_PAGADOR = {
    'cep': 'cep', 'endereco': 'rua', 'numero': 'numero',
    'bairro': 'bairro', 'cidade': 'cidade', 'estado': 'uf',
}


def _vazio(valor):
    return not (valor or '').strip()


def _tenant_do_token(request):
    cnpj = request.auth.get('tenant_cnpj') if request.auth else None
    return Tenant.objects.filter(cnpj_cpf=cnpj).select_related('pagador').first()


def _unidade_principal():
    """Primeira unidade do assinante (a Matriz criada no cadastro)."""
    return UnidadeNegocio.objects.order_by('id').first()


def faltando_na_unidade(unidade):
    if unidade is None:
        return list(CAMPOS)
    return [c for c in CAMPOS if _vazio(getattr(unidade, c))]


def faltando_no_pagador(pagador):
    """Campos (nomes da unidade) que o Pagador ainda não tem. Sem pagador, nada a exigir."""
    if pagador is None:
        return []
    return [c for c, campo in PARA_PAGADOR.items() if _vazio(getattr(pagador, campo))]


def endereco_do_pagador_incompleto(pagador):
    return bool(faltando_no_pagador(pagador))


def _validar(dados):
    limpo, erros = {}, {}
    for campo, (rotulo, maximo) in CAMPOS.items():
        valor = str(dados.get(campo) or '').strip()
        if not valor:
            erros[campo] = [f'Preencha o campo {rotulo}.']
            continue
        if campo == 'cep':
            digitos = re.sub(r'\D', '', valor)
            if len(digitos) != 8:
                erros[campo] = ['CEP inválido: informe 8 dígitos.']
                continue
            valor = f'{digitos[:5]}-{digitos[5:]}'
        elif campo == 'estado':
            valor = valor.upper()
            if valor not in UFS:
                erros[campo] = ['UF inválida.']
                continue
        if len(valor) > maximo:
            erros[campo] = [f'{rotulo}: máximo de {maximo} caracteres.']
            continue
        limpo[campo] = valor
    return limpo, erros


class EnderecoView(APIView):
    """
    GET /api/assinatura/endereco/ — qualquer usuário logado.
        { completo, faltando, pode_editar, endereco }
    PUT /api/assinatura/endereco/ — Gerente ou superior. Grava na unidade principal
        (Dados do Negócio) e, se o Pagador estiver incompleto, no Pagador (boleto).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = _tenant_do_token(request)
        pagador = tenant.pagador if tenant is not None else None
        unidade = _unidade_principal()

        faltando = faltando_na_unidade(unidade)
        for campo in faltando_no_pagador(pagador):
            if campo not in faltando:
                faltando.append(campo)

        # Pré-preenche com o que já existir (unidade primeiro; Pagador para o que faltar).
        endereco = {c: (getattr(unidade, c, '') or '') if unidade else '' for c in CAMPOS}
        endereco['complemento'] = (unidade.complemento if unidade else '') or ''
        if pagador is not None:
            for campo, campo_pagador in PARA_PAGADOR.items():
                if _vazio(endereco[campo]):
                    endereco[campo] = getattr(pagador, campo_pagador) or ''
            if _vazio(endereco['complemento']):
                endereco['complemento'] = pagador.complemento or ''
        if _vazio(endereco['pais']):
            endereco['pais'] = 'Brasil'

        return Response({
            'completo': not faltando,
            'faltando': faltando,
            'pode_editar': nivel_do_token(request) >= NIVEL_GERENTE,
            'endereco': endereco,
        })

    def put(self, request):
        if nivel_do_token(request) < NIVEL_GERENTE:
            return Response({'detail': 'Seu perfil não pode alterar o endereço.'}, status=403)

        limpo, erros = _validar(request.data)
        # Complemento é opcional (apto, sala, bloco...), mas tem limite de tamanho.
        complemento = str(request.data.get('complemento') or '').strip()
        if len(complemento) > COMPLEMENTO_MAX:
            erros['complemento'] = [f'Complemento: máximo de {COMPLEMENTO_MAX} caracteres.']
        if erros:
            return Response(erros, status=400)
        limpo['complemento'] = complemento

        tenant = _tenant_do_token(request)

        unidade = _unidade_principal()
        if unidade is None:
            nome = tenant.razao_social if tenant is not None else 'Matriz'
            unidade = UnidadeNegocio(
                nome_empresa=nome, nome_unidade='Matriz',
                cnpj_cpf=tenant.cnpj_cpf if tenant is not None else '', status='ativo',
            )
        for campo, valor in limpo.items():
            setattr(unidade, campo, valor)  # inclui o complemento
        unidade.save()

        # O boleto usa o endereço do Pagador. Só preenche se estiver incompleto, para não
        # sobrescrever um endereço bom quando o mesmo pagador tem vários estabelecimentos.
        pagador = tenant.pagador if tenant is not None else None
        if pagador is not None and faltando_no_pagador(pagador):
            for campo, campo_pagador in PARA_PAGADOR.items():
                setattr(pagador, campo_pagador, limpo[campo])
            pagador.complemento = limpo['complemento']
            pagador.save(update_fields=list(PARA_PAGADOR.values()) + ['complemento'])

        return Response({'completo': True, 'faltando': []})
