from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from clientes.models import Cliente
from .models import Anamnese
from .permissions import PodeVerProntuario
from .serializers import AnamneseSerializer


class AnamneseView(APIView):
    """Perfil do Cliente: GET e PUT da ficha do cliente."""
    permission_classes = [PodeVerProntuario]

    def get(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        anamnese, _ = Anamnese.objects.get_or_create(cliente=cliente)
        return Response(AnamneseSerializer(anamnese).data)

    def put(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        anamnese, _ = Anamnese.objects.get_or_create(cliente=cliente)
        serializer = AnamneseSerializer(anamnese, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instancia = serializer.save()
        if instancia.consentimento_lgpd and not instancia.consentimento_em:
            instancia.consentimento_em = timezone.now()
        elif not instancia.consentimento_lgpd:
            instancia.consentimento_em = None
        instancia.save(update_fields=['consentimento_em'])
        return Response(AnamneseSerializer(instancia).data)
