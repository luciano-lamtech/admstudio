from rest_framework import viewsets
from .models import User, Role
from .serializers import UserManageSerializer, RoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD de Perfis de Acesso (Role).
    GET/POST /api/usuarios/roles/
    GET/PUT/PATCH/DELETE /api/usuarios/roles/{id}/
    """
    serializer_class = RoleSerializer
    queryset = Role.objects.all().order_by('-nivel')


class UsuarioManageViewSet(viewsets.ModelViewSet):
    """
    CRUD de usuários do tenant (tela Usuários e Perfis de Acesso), e
    também usado para listar usuários em outras telas (ex: vincular um
    profissional a um usuário de login).
    GET/POST /api/usuarios/
    GET/PUT/PATCH/DELETE /api/usuarios/{id}/
    """
    serializer_class = UserManageSerializer

    def get_queryset(self):
        qs = User.objects.select_related('role').all().order_by('nome')
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs
