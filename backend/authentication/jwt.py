from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings

# Com o teste vencido (ou a assinatura inativa) o usuário entra no sistema, mas só
# estas rotas respondem: a tela "Minha assinatura" e o menu. O resto devolve 403.
ROTAS_LIBERADAS_COM_ASSINATURA_BLOQUEADA = (
    '/api/assinatura/',
    '/api/usuarios/menu/',
)

MENSAGEM_BLOQUEIO = 'Seu período de teste terminou ou a assinatura está inativa. Regularize o pagamento para continuar usando o sistema.'


class AssinaturaBloqueada(PermissionDenied):
    default_code = 'assinatura_bloqueada'

    def __init__(self, status=None):
        super().__init__(detail={
            'detail': MENSAGEM_BLOQUEIO,
            'codigo': 'assinatura_bloqueada',
            'status': status,
        })


class TenantJWTAuthentication(JWTAuthentication):
    """
    Confere o usuário do token no banco do PRÓPRIO assinante (accounts.User).
    Se a assinatura estiver bloqueada (teste vencido ou inativa por falta de
    pagamento), só deixa passar as rotas da tela de assinatura.
    """

    _situacao_bloqueada = None

    def authenticate(self, request):
        resultado = super().authenticate(request)
        if resultado is not None and self._situacao_bloqueada:
            if not request.path.startswith(ROTAS_LIBERADAS_COM_ASSINATURA_BLOQUEADA):
                raise AssinaturaBloqueada(self._situacao_bloqueada)
        return resultado

    def get_user(self, validated_token):
        from accounts.models import User
        from core.models import Tenant
        try:
            uid = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('Token sem identificação de usuário.')

        cnpj = validated_token.get('tenant_cnpj')
        tenant = Tenant.objects.filter(cnpj_cpf=cnpj).select_related('pagador').first() if cnpj else None
        if tenant and tenant.pagador_id and tenant.pagador.bloqueado:
            self._situacao_bloqueada = tenant.pagador.status_efetivo()

        alias = validated_token.get('tenant_alias') or 'default'
        try:
            return User.objects.using(alias).get(pk=uid, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuário não encontrado ou inativo.', code='user_not_found')
