from rest_framework.permissions import BasePermission


class PodeVerPerfilCliente(BasePermission):
    """Perfil do Cliente: todos leem; gravar exige nível 3 (Recepção) ou superior."""
    message = 'Seu perfil não tem permissão para alterar o perfil do cliente.'

    def has_permission(self, request, view):
        try:
            nivel = int(request.auth.get('role_nivel', 0))
        except Exception:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return nivel >= 1
        return nivel >= 3


class PodeVerProntuario(BasePermission):
    """Dados de saúde: só perfis de nível 3 ou superior (ex: Gerente, Administrador)."""
    message = 'Seu perfil não tem acesso ao prontuário.'

    def has_permission(self, request, view):
        try:
            return int(request.auth.get('role_nivel', 0)) >= 3
        except Exception:
            return False
