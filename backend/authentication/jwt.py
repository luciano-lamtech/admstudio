from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings


class TenantJWTAuthentication(JWTAuthentication):
    """
    Confere o usuário do token no banco do PRÓPRIO assinante (accounts.User),
    e recusa assinantes com assinatura inativa por falta de pagamento.
    """

    def get_user(self, validated_token):
        from accounts.models import User
        from core.models import Tenant
        try:
            uid = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('Token sem identificação de usuário.')

        cnpj = validated_token.get('tenant_cnpj')
        tenant = Tenant.objects.filter(cnpj_cpf=cnpj).select_related('pagador').first() if cnpj else None
        if tenant and tenant.pagador_id and tenant.pagador.status_cobranca == 'inativo':
            raise AuthenticationFailed('Assinatura inativa por falta de pagamento.', code='assinatura_inativa')

        alias = validated_token.get('tenant_alias') or 'default'
        try:
            return User.objects.using(alias).get(pk=uid, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuário não encontrado ou inativo.', code='user_not_found')
