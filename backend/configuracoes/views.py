from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import criar_permissao
from authentication.middleware import get_current_tenant_alias

from .fuso import limpar_cache
from .models import ConfiguracaoSistema
from .serializers import ConfiguracaoSistemaSerializer

# Todos os perfis podem consultar; só o Administrador (nível 10) altera.
LeituraTodosEscritaAdmin = criar_permissao(1, 10)


class PreferenciasSistemaView(APIView):
    """
    GET /api/configuracoes/preferencias/  -> fuso horário e link do robô de agendamento
    PUT /api/configuracoes/preferencias/  -> altera (somente Administrador)
    """
    permission_classes = [LeituraTodosEscritaAdmin]

    def get(self, request):
        s = ConfiguracaoSistemaSerializer(ConfiguracaoSistema.get_solo(), context={'request': request})
        return Response(s.data)

    def put(self, request):
        s = ConfiguracaoSistemaSerializer(
            ConfiguracaoSistema.get_solo(), data=request.data, partial=True, context={'request': request},
        )
        s.is_valid(raise_exception=True)
        s.save()
        limpar_cache(get_current_tenant_alias())
        return Response(s.data)
