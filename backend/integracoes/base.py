from datetime import timedelta
from zoneinfo import ZoneInfo

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.models import Tenant
from authentication.utils import register_tenant_connection
from authentication.middleware import set_current_tenant_alias

FUSO = ZoneInfo('America/Sao_Paulo')


class IntegracaoAPIView(APIView):
    """
    Base dos endpoints usados pelo n8n. A autenticação é feita pelo cabeçalho
    X-Integracao-Token, que identifica o assinante. O banco do assinante é
    registrado para a requisição, como no chatbot público.
    """
    permission_classes = [AllowAny]

    def dispatch(self, request, *args, **kwargs):
        set_current_tenant_alias(None)
        self.tenant = None
        token = request.headers.get('X-Integracao-Token', '').strip()
        if token:
            try:
                tenant = Tenant.objects.get(token_integracao=token, is_active=True)
                alias = register_tenant_connection(tenant)
                set_current_tenant_alias(alias)
                self.tenant = tenant
            except Tenant.DoesNotExist:
                pass
        try:
            return super().dispatch(request, *args, **kwargs)
        finally:
            set_current_tenant_alias(None)

    def checar_token(self):
        if not self.tenant:
            return Response({'detail': 'Token de integração inválido.'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def instancia_dict(self):
        inst = self.tenant.instancia_whatsapp
        if not inst or not inst.ativo:
            return None
        return {
            'url_base': inst.url_base.rstrip('/'),
            'nome_instancia': inst.nome_instancia,
            'api_key': inst.api_key,
            'intervalo_segundos': inst.intervalo_segundos,
        }
