import logging
import re

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.utils import register_tenant_connection
from core.models import Tenant
from .recuperacao import enviar_link_redefinicao, usuario_pelo_link

logger = logging.getLogger(__name__)

MENSAGEM_NEUTRA = 'Se os dados estiverem corretos, enviamos um link de redefinição para o e-mail cadastrado.'


class EsqueciSenhaView(APIView):
    """POST /api/auth/esqueci-senha/  body: {id (CPF/CNPJ), email}. Resposta sempre igual."""
    permission_classes = [AllowAny]

    def post(self, request):
        cnpj = re.sub(r'\D', '', request.data.get('id') or '')
        email = (request.data.get('email') or '').strip().lower()
        tenant = Tenant.objects.filter(cnpj_cpf=cnpj, is_active=True).first()
        if tenant and email:
            try:
                alias = register_tenant_connection(tenant)
                from accounts.models import User
                user = User.objects.using(alias).filter(email=email, is_active=True).first()
                if user:
                    enviar_link_redefinicao(tenant, user)
            except Exception:
                logger.exception('Falha ao enviar link de redefinição de senha')
        return Response({'mensagem': MENSAGEM_NEUTRA})


class RedefinirSenhaView(APIView):
    """POST /api/auth/redefinir-senha/  body: {id, uid, token, nova_senha}"""
    permission_classes = [AllowAny]

    def post(self, request):
        cnpj = re.sub(r'\D', '', request.data.get('id') or '')
        nova = request.data.get('nova_senha') or ''
        user, alias = usuario_pelo_link(cnpj, request.data.get('uid') or '', request.data.get('token') or '')
        if user is None:
            return Response({'detail': 'Link inválido ou expirado. Solicite um novo.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if len(nova) < 8:
            return Response({'detail': 'A senha deve ter pelo menos 8 caracteres.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.set_password(nova)
        user.save(using=alias, update_fields=['password'])
        return Response({'mensagem': 'Senha alterada. Você já pode entrar com a nova senha.'})


class MeuLinkSenhaView(APIView):
    """POST /api/auth/meu-link-senha/ — envia o link para o e-mail do usuário logado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cnpj = request.auth.get('tenant_cnpj') if request.auth else None
        tenant = Tenant.objects.filter(cnpj_cpf=cnpj).first()
        if tenant is None or not request.user.email:
            return Response({'detail': 'Não foi possível enviar o link.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            enviar_link_redefinicao(tenant, request.user)
        except Exception:
            return Response({'detail': 'Falha ao enviar o e-mail. Tente novamente mais tarde.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'mensagem': f'Link enviado para {request.user.email}.'})
