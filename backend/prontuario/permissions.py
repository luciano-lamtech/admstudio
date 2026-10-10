from rest_framework.permissions import BasePermission


class PodeVerProntuario(BasePermission):
    """Dados de saúde: só perfis de nível 3 ou superior (ex: Gerente, Administrador)."""
    message = 'Seu perfil não tem acesso ao prontuário.'

    def has_permission(self, request, view):
        try:
            return int(request.auth.get('role_nivel', 0)) >= 3
        except Exception:
            return False
