from accounts.permissions import criar_permissao
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MenuItem
from .serializers import MenuItemSerializer
Nivel7 = criar_permissao(7)
from rest_framework import viewsets
from .models import User, Role
from .serializers import UserManageSerializer, RoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    permission_classes = [Nivel7]

    """
    CRUD de Perfis de Acesso (Role).
    GET/POST /api/usuarios/roles/
    GET/PUT/PATCH/DELETE /api/usuarios/roles/{id}/
    """
    serializer_class = RoleSerializer
    queryset = Role.objects.all().order_by('-nivel')


class UsuarioManageViewSet(viewsets.ModelViewSet):
    permission_classes = [Nivel7]
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


class MenuView(APIView):
    """GET /api/usuarios/menu/ -> itens de menu liberados para o nível do usuário logado."""

    def get(self, request):
        from .permissions import nivel_do_token
        itens = MenuItem.objects.filter(nivel_minimo__lte=nivel_do_token(request)).order_by('ordem')
        return Response(MenuItemSerializer(itens, many=True).data)


class SenhaOperacaoView(APIView):
    """GET /api/usuarios/senha-operacao/ — código atual (muda a cada minuto). Gerente ou superior."""
    permission_classes = [Nivel7]

    def get(self, request):
        from .senha_operacao import senha_atual
        return Response(senha_atual())
