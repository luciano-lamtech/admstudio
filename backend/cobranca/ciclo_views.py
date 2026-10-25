import hmac

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .servico import executar_ciclo


class CicloCobrancaView(APIView):
    """
    POST /api/cobranca/ciclo/   header: X-Ciclo-Token: <CICLO_SECRET>
    Executa o ciclo diário (avisos, boletos e status). Chamado pelo n8n uma vez por dia.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        segredo = settings.CICLO_SECRET
        if not segredo:
            return Response({'detail': 'CICLO_SECRET não configurado.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        enviado = request.headers.get('X-Ciclo-Token', '')
        if not hmac.compare_digest(enviado, segredo):
            return Response({'detail': 'Token inválido.'}, status=status.HTTP_403_FORBIDDEN)
        resultado = executar_ciclo()
        return Response({
            'executado_em': timezone.now(),
            'pagadores': [{'nome': nome, 'situacao': situacao} for nome, situacao in resultado],
        })
