from rest_framework.permissions import BasePermission, SAFE_METHODS


def nivel_do_token(request):
    """Nível de acesso do usuário logado, lido do token (role_nivel)."""
    try:
        return int(request.auth.get('role_nivel', 0))
    except Exception:
        return 0


def criar_permissao(leitura, escrita=None, por_action=None):
    """
    Cria uma permissão por nível.
    - leitura: nível mínimo para GET/HEAD/OPTIONS
    - escrita: nível mínimo para POST/PUT/PATCH/DELETE (padrão = leitura)
    - por_action: níveis específicos por ação, ex: {'receber': 2}
    """
    escrita = leitura if escrita is None else escrita
    por_action = por_action or {}

    class NivelMinimo(BasePermission):
        message = 'Seu perfil não tem acesso a esta função.'

        def has_permission(self, request, view):
            if request.auth is None:
                return False
            action = getattr(view, 'action', None)
            if action in por_action:
                exigido = por_action[action]
            elif request.method in SAFE_METHODS:
                exigido = leitura
            else:
                exigido = escrita
            return nivel_do_token(request) >= exigido

    return NivelMinimo
