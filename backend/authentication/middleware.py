import threading

_thread_locals = threading.local()


def set_current_tenant_alias(alias):
    _thread_locals.tenant_alias = alias


def get_current_tenant_alias():
    return getattr(_thread_locals, 'tenant_alias', None)


class TenantMiddleware:
    """
    A cada requisição, lê os claims do token JWT (já validado pelo
    DRF/SimpleJWT) e garante que a conexão com o banco do tenant esteja
    registrada NESTE processo (o Gunicorn roda vários workers/processos,
    cada um com sua própria memória — a conexão registrada no login pode
    não existir ainda no processo que atende uma requisição posterior).
    Se não existir, registra agora sob demanda usando o CNPJ do token.
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
                from django.db import connections

                token = AccessToken(token_str)
                alias = token.get('tenant_alias')
                tenant_cnpj = token.get('tenant_cnpj')

                if alias and alias not in connections.databases and tenant_cnpj:
                    from core.models import Tenant
                    from .utils import register_tenant_connection
                    try:
                        tenant = Tenant.objects.get(cnpj_cpf=tenant_cnpj, is_active=True)
                        register_tenant_connection(tenant)
                    except Tenant.DoesNotExist:
                        alias = None

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
