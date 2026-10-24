from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import criar_permissao
from core.models import Tenant
from .servico import resumo_pagador

PermissaoGerente = criar_permissao(7)


class AssinaturaView(APIView):
    """GET /api/assinatura/ — dados da assinatura do assinante logado (Gerente ou superior)."""
    permission_classes = [PermissaoGerente]

    def get(self, request):
        cnpj = request.auth.get('tenant_cnpj') if request.auth else None
        tenant = Tenant.objects.filter(cnpj_cpf=cnpj).select_related('pagador').first()
        if tenant is None or tenant.pagador is None:
            return Response({'sem_assinatura': True})
        dados = resumo_pagador(tenant.pagador)
        dados['sem_assinatura'] = False
        return Response(dados)
