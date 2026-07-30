import threading

_thread_locals = threading.local()


def set_current_tenant_alias(alias):
    _thread_locals.tenant_alias = alias


def get_current_tenant_alias():
    return getattr(_thread_locals, 'tenant_alias', None)


class TenantMiddleware:
    """
    A cada requisição, lê o claim 'tenant_alias' do token JWT (já
    validado pelo DRF/SimpleJWT) e disponibiliza o alias do banco do
    tenant para o TenantDatabaseRouter usar nas queries dessa requisição.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_current_tenant_alias(None)

        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token_str = auth_header.split(' ', 1)[1]
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                token = AccessToken(token_str)
                alias = token.get('tenant_alias')
                if alias:
                    set_current_tenant_alias(alias)
            except Exception:
                pass  # token inválido: segue sem tenant, view vai barrar via permissions

        response = self.get_response(request)
        set_current_tenant_alias(None)
        return response


class NoCacheAPIMiddleware:
    """
    Garante que nenhuma resposta da API (/api/...) seja armazenada em
    cache pelo navegador ou por qualquer proxy no caminho (ex: o proxy
    reverso do EasyPanel). Sem isso, telas de listagem podiam mostrar
    dados desatualizados até a página ser recarregada manualmente.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
        return response
