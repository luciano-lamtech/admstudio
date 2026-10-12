from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings


class TenantJWTAuthentication(JWTAuthentication):
    """
    Confere o usuário do token no banco do PRÓPRIO assinante (accounts.User),
    e não no banco central (auth.User), que é o padrão do SimpleJWT.
    """

    def get_user(self, validated_token):
        from accounts.models import User
        try:
            uid = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('Token sem identificação de usuário.')
        alias = validated_token.get('tenant_alias') or 'default'
        try:
            return User.objects.using(alias).get(pk=uid, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuário não encontrado ou inativo.', code='user_not_found')
