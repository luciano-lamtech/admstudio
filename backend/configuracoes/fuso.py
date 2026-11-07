"""
Fuso horário do assinante atual.

Use `fuso_atual()` no lugar de um fuso fixo. Ele lê a preferência do tenant da
requisição (banco do próprio assinante) e, se não houver tenant, ainda não
existir configuração ou algo falhar, devolve America/Sao_Paulo.

Há um cache curto (30 s) por assinante, porque algumas telas chamam isto
dentro de laços. Ao salvar as preferências o cache do processo é limpo; os
demais workers do Gunicorn passam a usar o novo fuso em até 30 segundos.
"""
import threading
import time
from zoneinfo import ZoneInfo

from authentication.middleware import get_current_tenant_alias

from .constants import FUSO_PADRAO, FUSOS_VALIDOS

_TTL_SEGUNDOS = 30
_cache = {}  # alias -> (expira_em, nome_do_fuso)
_lock = threading.Lock()


def limpar_cache(alias=None):
    with _lock:
        if alias is None:
            _cache.clear()
        else:
            _cache.pop(alias, None)


def nome_fuso_atual():
    alias = get_current_tenant_alias()
    if not alias:
        return FUSO_PADRAO

    agora = time.monotonic()
    with _lock:
        item = _cache.get(alias)
        if item and item[0] > agora:
            return item[1]

    nome = FUSO_PADRAO
    try:
        from .models import ConfiguracaoSistema
        valor = ConfiguracaoSistema.objects.filter(pk=1).values_list('fuso_horario', flat=True).first()
        if valor in FUSOS_VALIDOS:
            nome = valor
    except Exception:
        pass  # tabela ainda não migrada ou banco indisponível: usa o padrão

    with _lock:
        _cache[alias] = (agora + _TTL_SEGUNDOS, nome)
    return nome


def fuso_atual():
    return ZoneInfo(nome_fuso_atual())
