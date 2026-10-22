"""
Senha de operação: 6 dígitos que mudam a cada minuto (estilo TOTP, RFC 6238).
Calculada a partir de um segredo guardado no banco do assinante e do horário atual.
Aceita o código do minuto atual e o do minuto anterior, para tolerar digitação no fim do minuto.
"""
import hashlib
import hmac
import secrets
import struct
import time

from .models import ConfiguracaoSeguranca

PASSO = 60
DIGITOS = 6


def _segredo():
    cfg = ConfiguracaoSeguranca.objects.first()
    if cfg is None:
        cfg = ConfiguracaoSeguranca.objects.create(segredo=secrets.token_hex(20))
    elif not cfg.segredo:
        cfg.segredo = secrets.token_hex(20)
        cfg.save(update_fields=['segredo'])
    return cfg.segredo


def _codigo(segredo, contador):
    mensagem = struct.pack('>Q', contador)
    digest = hmac.new(segredo.encode(), mensagem, hashlib.sha256).digest()
    desloc = digest[-1] & 0x0F
    numero = struct.unpack('>I', digest[desloc:desloc + 4])[0] & 0x7FFFFFFF
    return str(numero % (10 ** DIGITOS)).zfill(DIGITOS)


def senha_atual():
    agora = int(time.time())
    return {
        'codigo': _codigo(_segredo(), agora // PASSO),
        'segundos_restantes': PASSO - (agora % PASSO),
    }


def validar(codigo):
    codigo = (codigo or '').strip()
    if len(codigo) != DIGITOS or not codigo.isdigit():
        return False
    agora_contador = int(time.time()) // PASSO
    segredo = _segredo()
    return any(
        hmac.compare_digest(codigo, _codigo(segredo, c)) for c in (agora_contador, agora_contador - 1)
    )
