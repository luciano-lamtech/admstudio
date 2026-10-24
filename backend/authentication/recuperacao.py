"""
Recuperação de senha: envia um link por e-mail para o usuário criar uma nova senha.
O token usa o mesmo mecanismo do Django (vale 1 hora e deixa de valer após a troca).
"""
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from accounts.models import User
from authentication.utils import register_tenant_connection
from core.models import Tenant


def enviar_link_redefinicao(tenant, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f'{settings.FRONTEND_URL}/redefinir-senha?cnpj={tenant.cnpj_cpf}&uid={uid}&token={token}'
    nome_estab = tenant.nome_fantasia or tenant.razao_social
    send_mail(
        subject='ADMSTUDIO - Alterar senha',
        message=(
            f'Olá, {user.nome}!\n\n'
            f'Recebemos um pedido para redefinir a senha da sua conta em {nome_estab}.\n'
            f'Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\n{link}\n\n'
            'Se você não fez esse pedido, ignore este e-mail. Sua senha continua a mesma.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def usuario_pelo_link(cnpj, uid, token):
    """Devolve o usuário se o link for válido, ou None."""
    tenant = Tenant.objects.filter(cnpj_cpf=cnpj, is_active=True).first()
    if tenant is None:
        return None, None
    alias = register_tenant_connection(tenant)
    try:
        pk = int(force_str(urlsafe_base64_decode(uid)))
    except (ValueError, TypeError):
        return None, None
    user = User.objects.using(alias).filter(pk=pk, is_active=True).first()
    if user is None or not default_token_generator.check_token(user, token):
        return None, None
    return user, alias
