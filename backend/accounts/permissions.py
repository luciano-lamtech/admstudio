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


def unidades_permitidas(request):
    """
    None = sem restrição (todas as unidades).
    Lista de ids = só essas unidades (quando o usuário tem unidades escolhidas).
    """
    from django.db.models import Q  # noqa: F401  (usado por filtrar_por_unidade)
    from .models import User
    try:
        uid = request.auth.get('user_id') if request.auth else None
    except Exception:
        uid = None
    if not uid:
        return None
    usuario = User.objects.filter(pk=uid).first()
    if usuario is None:
        return None
    ids = list(usuario.unidades.values_list('id', flat=True))
    return ids or None


def filtrar_por_unidade(qs, request, campo='unidade'):
    """Restringe o queryset às unidades do usuário. Registros sem unidade continuam visíveis."""
    from django.db.models import Q
    permitidas = unidades_permitidas(request)
    if permitidas is None:
        return qs
    return qs.filter(Q(**{f'{campo}__in': permitidas}) | Q(**{f'{campo}__isnull': True}))


def unidade_permitida(request, unidade):
    """Confere se o usuário pode gravar um registro nesta unidade."""
    permitidas = unidades_permitidas(request)
    if permitidas is None:
        return True
    return unidade is not None and unidade.id in permitidas
