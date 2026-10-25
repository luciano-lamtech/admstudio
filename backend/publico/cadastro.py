import re
from io import StringIO

from decouple import config
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management import call_command
from django.core.validators import validate_email
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.models import Tenant


class CadastroThrottle(AnonRateThrottle):
    scope = 'cadastro'


class CadastroAssinanteView(APIView):
    """
    POST /api/publico/cadastro/  -> cria o assinante, o banco e o administrador.
    Usado pela página pública /cadastro. Não exige login.
    """
    permission_classes = [AllowAny]
    throttle_classes = [CadastroThrottle]

    def post(self, request):
        d = request.data
        erros = {}

        cnpj = re.sub(r'\D', '', d.get('cnpj_cpf') or '')
        if len(cnpj) not in (11, 14):
            erros['cnpj_cpf'] = ['Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).']
        elif Tenant.objects.filter(cnpj_cpf=cnpj).exists():
            erros['cnpj_cpf'] = ['Já existe um cadastro com este CPF/CNPJ.']

        razao = (d.get('razao_social') or '').strip()
        if not razao:
            erros['razao_social'] = ['Informe o nome da empresa.']

        responsavel = (d.get('nome_responsavel') or '').strip()
        if not responsavel:
            erros['nome_responsavel'] = ['Informe o nome do responsável.']

        email = (d.get('email') or '').strip().lower()
        try:
            validate_email(email)
        except DjangoValidationError:
            erros['email'] = ['E-mail inválido.']

        senha = d.get('senha') or ''
        if len(senha) < 8:
            erros['senha'] = ['A senha deve ter pelo menos 8 caracteres.']
        elif senha != (d.get('confirmar_senha') or ''):
            erros['confirmar_senha'] = ['As senhas não conferem.']

        cpf_resp = re.sub(r'\D', '', d.get('cpf_responsavel') or '')
        if len(cpf_resp) != 11:
            erros['cpf_responsavel'] = ['Informe o CPF do responsável (11 dígitos).']

        tipo = d.get('tipo_negocio') or 'salao'
        if tipo not in dict(Tenant.TIPO_CHOICES):
            erros['tipo_negocio'] = ['Tipo de negócio inválido.']

        if not d.get('aceite_termos'):
            erros['aceite_termos'] = ['É necessário aceitar os termos de uso.']

        if erros:
            return Response(erros, status=status.HTTP_400_BAD_REQUEST)

        usuario_db = config('PLATFORM_DB_USER', default='')
        senha_db = config('PLATFORM_DB_PASSWORD', default='')
        if not usuario_db or not senha_db:
            return Response({'detail': 'Cadastro indisponível no momento. Tente mais tarde.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        nome_fantasia = (d.get('nome_fantasia') or '').strip()
        saida = StringIO()
        try:
            call_command(
                'provision_tenant',
                cnpj_cpf=cnpj,
                razao_social=razao,
                nome_fantasia=nome_fantasia,
                tipo_negocio=tipo,
                db_name=f'adm_{cnpj}',
                db_host=settings.DATABASES['default']['HOST'],
                db_port=str(settings.DATABASES['default']['PORT']),
                db_user=usuario_db,
                db_password=senha_db,
                admin_email=email,
                admin_senha=senha,
                admin_nome=responsavel,
                stdout=saida,
                stderr=saida,
            )
        except Exception:
            return Response(
                {'detail': 'Não foi possível concluir o cadastro. Tente novamente em instantes.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        Tenant.objects.filter(cnpj_cpf=cnpj).update(
            usa_servidor_central=True,
            nome_responsavel=responsavel,
            email_responsavel=email,
            telefone_responsavel=(d.get('telefone') or '').strip()[:20],
            aceite_termos_em=timezone.now(),
        )
        from cobranca.servico import vincular_ao_pagador
        tenant = Tenant.objects.get(cnpj_cpf=cnpj)
        import logging
        from authentication.utils import register_tenant_connection
        from negocio.models import UnidadeNegocio
        try:
            UnidadeNegocio.objects.using(register_tenant_connection(tenant)).create(
                nome_empresa=razao, nome_unidade='Matriz', cnpj_cpf=cnpj,
                nome_contato=responsavel, telefone_contato=(d.get('telefone') or '').strip()[:20],
                email=email, status='ativo',
            )
        except Exception:
            logging.getLogger(__name__).exception('Falha ao criar a unidade inicial do cadastro')
        try:
            _, criado = vincular_ao_pagador(tenant, cpf_resp)
        except Exception:
            criado = True  # a cobrança não bloqueia o cadastro; o admin ajusta depois
        return Response({
            'cnpj_cpf': cnpj,
            'email': email,
            'mensagem': 'Cadastro criado. Use o CPF/CNPJ, o e-mail e a senha que você escolheu para entrar.',
        }, status=status.HTTP_201_CREATED)
