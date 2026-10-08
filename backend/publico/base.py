import re

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias


class TenantPublicAPIView(APIView):
    """
    Base para os endpoints PÚBLICOS do chatbot de agendamento (sem login).
    O tenant é resolvido pelo CNPJ/CPF que vem na própria URL (ex:
    /api/publico/12345678000190/servicos/), não por um token JWT — por
    isso registra a conexão do banco manualmente a cada requisição.
    """
    permission_classes = [AllowAny]

    def dispatch(self, request, *args, **kwargs):
        set_current_tenant_alias(None)
        self.tenant = None
        self.tenant_alias = None

        cnpj = re.sub(r'\D', '', kwargs.get('cnpj', ''))
        try:
            tenant = Tenant.objects.get(cnpj_cpf=cnpj, is_active=True)
            alias = register_tenant_connection(tenant)
            set_current_tenant_alias(alias)
            self.tenant = tenant
            self.tenant_alias = alias
        except Tenant.DoesNotExist:
            pass

        try:
            response = super().dispatch(request, *args, **kwargs)
        finally:
            set_current_tenant_alias(None)
        return response

    def checar_tenant(self):
        """Chame no início de cada view: retorna uma Response 404 se o
        tenant não foi encontrado, ou None se está tudo certo."""
        if not self.tenant:
            return Response({'detail': 'Assinante não encontrado ou inativo.'}, status=status.HTTP_404_NOT_FOUND)
        return None
