from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
import re

from core.models import Tenant
from accounts.models import User, MenuItem
from accounts.serializers import UserSerializer, MenuItemSerializer
from .utils import register_tenant_connection
from .middleware import set_current_tenant_alias


class LoginView(APIView):
    """
    POST /api/auth/login/
    body: { "email": "...", "senha": "...", "id": "cnpj ou cpf" }

    Fluxo:
    1. Localiza o Tenant pelo CPF/CNPJ (campo "id") no banco central.
    2. Registra/abre a conexão dinâmica com o banco MySQL desse tenant.
    3. Autentica o usuário (email/senha) DENTRO do banco daquele tenant.
    4. Gera um JWT contendo o alias do banco do tenant (tenant_alias),
       para que as próximas requisições já saibam qual banco usar.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        senha = request.data.get('senha', '')
        cnpj_cpf = re.sub(r'\D', '', request.data.get('id', ''))

        if not (email and senha and cnpj_cpf):
            return Response({'detail': 'Informe email, senha e o CPF/CNPJ do assinante.'}, status=400)

        try:
            tenant = Tenant.objects.get(cnpj_cpf=cnpj_cpf, is_active=True)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Assinante não encontrado ou inativo. Verifique o CPF/CNPJ informado.'}, status=404)

        alias = register_tenant_connection(tenant)
        set_current_tenant_alias(alias)  # necessário para o db_router durante esta request

        try:
            user = User.objects.using(alias).select_related('role').get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'E-mail ou senha inválidos.'}, status=401)

        if not check_password(senha, user.password):
            return Response({'detail': 'E-mail ou senha inválidos.'}, status=401)

        refresh = RefreshToken.for_user(user)
        refresh['tenant_alias'] = alias
        refresh['tenant_cnpj'] = tenant.cnpj_cpf
        refresh['tenant_nome'] = tenant.nome_fantasia or tenant.razao_social
        refresh['role_nivel'] = user.role.nivel
        refresh.access_token['tenant_alias'] = alias
        refresh.access_token['tenant_cnpj'] = tenant.cnpj_cpf
        refresh.access_token['tenant_nome'] = tenant.nome_fantasia or tenant.razao_social
        refresh.access_token['role_nivel'] = user.role.nivel

        menu = MenuItem.objects.using(alias).filter(nivel_minimo__lte=user.role.nivel)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': UserSerializer(user).data,
            'tenant': {
                'cnpj_cpf': tenant.cnpj_cpf,
                'nome': tenant.nome_fantasia or tenant.razao_social,
                'tipo_negocio': tenant.tipo_negocio,
            },
            'menu': MenuItemSerializer(menu, many=True).data,
        })
