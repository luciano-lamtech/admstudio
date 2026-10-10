import base64
import binascii
from datetime import datetime

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from clientes.models import Cliente
from .models import Anamnese, Sessao, FotoSessao
from .permissions import PodeVerProntuario
from .serializers import AnamneseSerializer, SessaoSerializer

MAX_BYTES = 2 * 1024 * 1024
TIPOS_PERMITIDOS = {'image/jpeg', 'image/png', 'image/webp'}


def _decodificar_imagem(data_url):
    if not isinstance(data_url, str) or not data_url.startswith('data:') or ',' not in data_url:
        return None, 'Imagem inválida.'
    try:
        cabecalho, dados = data_url.split(',', 1)
        content_type = cabecalho[5:].split(';')[0]
        conteudo = base64.b64decode(dados, validate=True)
    except (ValueError, binascii.Error):
        return None, 'Imagem inválida.'
    if content_type not in TIPOS_PERMITIDOS:
        return None, 'Formato não permitido (use JPG, PNG ou WEBP).'
    if len(conteudo) > MAX_BYTES:
        return None, 'Imagem muito grande (máximo 2 MB).'
    return (conteudo, content_type), None


class AnamneseView(APIView):
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
        # Registra quando o consentimento foi dado; limpa se for removido
        if instancia.consentimento_lgpd and not instancia.consentimento_em:
            instancia.consentimento_em = timezone.now()
        elif not instancia.consentimento_lgpd:
            instancia.consentimento_em = None
        instancia.save(update_fields=['consentimento_em'])
        return Response(AnamneseSerializer(instancia).data)


class SessoesView(APIView):
    permission_classes = [PodeVerProntuario]

    def get(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        sessoes = Sessao.objects.filter(cliente=cliente).select_related('profissional').prefetch_related('fotos')
        return Response(SessaoSerializer(sessoes, many=True).data)

    def post(self, request, cliente_id):
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        serializer = SessaoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sessao = serializer.save(cliente=cliente)
        return Response(SessaoSerializer(sessao).data, status=status.HTTP_201_CREATED)


class SessaoDetailView(APIView):
    permission_classes = [PodeVerProntuario]

    def delete(self, request, pk):
        sessao = get_object_or_404(Sessao, pk=pk)
        sessao.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FotosView(APIView):
    permission_classes = [PodeVerProntuario]

    def post(self, request, sessao_id):
        sessao = get_object_or_404(Sessao, pk=sessao_id)
        tipo = request.data.get('tipo')
        if tipo not in ('antes', 'depois'):
            return Response({'tipo': ['Tipo deve ser "antes" ou "depois".']}, status=400)
        decodificado, erro = _decodificar_imagem(request.data.get('imagem'))
        if erro:
            return Response({'imagem': [erro]}, status=400)
        conteudo, content_type = decodificado
        foto = FotoSessao.objects.create(sessao=sessao, tipo=tipo, content_type=content_type, imagem=conteudo)
        return Response({'id': foto.id, 'tipo': foto.tipo}, status=status.HTTP_201_CREATED)


class FotoDetailView(APIView):
    permission_classes = [PodeVerProntuario]

    def get(self, request, pk):
        foto = get_object_or_404(FotoSessao, pk=pk)
        dados = base64.b64encode(bytes(foto.imagem)).decode()
        return Response({
            'id': foto.id,
            'tipo': foto.tipo,
            'imagem': f'data:{foto.content_type};base64,{dados}',
        })
