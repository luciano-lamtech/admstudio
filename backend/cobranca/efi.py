"""
Cliente mínimo da API Cobranças da Efí (OAuth2 + JSON, só biblioteca padrão).
Documentação: https://dev.efipay.com.br/docs/api-cobrancas/credenciais
"""
import base64
import json
import time
import urllib.error
import urllib.request

from django.conf import settings

_token = {'valor': None, 'expira_em': 0.0}


class EfiError(Exception):
    pass


def _base():
    if settings.EFI_AMBIENTE == 'producao':
        return 'https://cobrancas.api.efipay.com.br'
    return 'https://cobrancas-h.api.efipay.com.br'


def _token_acesso():
    if _token['valor'] and time.time() < _token['expira_em'] - 30:
        return _token['valor']
    credencial = base64.b64encode(
        f'{settings.EFI_CLIENT_ID}:{settings.EFI_CLIENT_SECRET}'.encode()
    ).decode()
    req = urllib.request.Request(
        _base() + '/v1/authorize',
        data=json.dumps({'grant_type': 'client_credentials'}).encode(),
        method='POST',
    )
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Basic {credencial}')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            dados = json.loads(resp.read())
    except urllib.error.HTTPError:
        raise EfiError('Falha ao autenticar na Efí. Confira EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_AMBIENTE.')
    _token['valor'] = dados['access_token']
    _token['expira_em'] = time.time() + dados.get('expires_in', 600)
    return _token['valor']


def chamar(metodo, caminho, corpo=None):
    """Faz a chamada autenticada e devolve o campo 'data' da resposta."""
    req = urllib.request.Request(
        _base() + caminho,
        data=json.dumps(corpo).encode() if corpo is not None else None,
        method=metodo,
    )
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {_token_acesso()}')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            conteudo = resp.read()
    except urllib.error.HTTPError as exc:
        detalhe = exc.read().decode(errors='ignore')[:300]
        raise EfiError(f'Efí respondeu {exc.code} em {caminho}: {detalhe}')
    dados = json.loads(conteudo) if conteudo else {}
    return dados.get('data', dados)
