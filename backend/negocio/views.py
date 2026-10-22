import base64
import binascii

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import criar_permissao, unidades_permitidas
from .models import UnidadeNegocio
from .serializers import UnidadeNegocioSerializer

Nivel10 = criar_permissao(10)
LeituraTodos = criar_permissao(1, 10)

TIPOS_IMAGEM = {'image/png', 'image/jpeg', 'image/webp'}
MAX_BYTES = 1024 * 1024


def _validar_imagem(data_url):
    if not isinstance(data_url, str) or not data_url.startswith('data:') or ',' not in data_url:
        return 'Imagem inválida.'
    cabecalho, dados = data_url.split(',', 1)
    if cabecalho[5:].split(';')[0] not in TIPOS_IMAGEM:
        return 'Formato não permitido (use PNG, JPG ou WEBP).'
    try:
        tamanho = len(base64.b64decode(dados, validate=True))
    except (ValueError, binascii.Error):
        return 'Imagem inválida.'
    if tamanho > MAX_BYTES:
        return 'Imagem muito grande (máximo 1 MB).'
    return None


class UnidadeNegocioViewSet(viewsets.ModelViewSet):
    """CRUD das unidades. QR Pix geral: POST/DELETE /api/negocio/<id>/qrcode-geral/"""
    permission_classes = [LeituraTodos]
    serializer_class = UnidadeNegocioSerializer
    queryset = UnidadeNegocio.objects.all()

    def get_queryset(self):
        qs = UnidadeNegocio.objects.all()
        permitidas = unidades_permitidas(self.request)
        if permitidas is not None:
            qs = qs.filter(id__in=permitidas)
        return qs

    @action(detail=True, methods=['post', 'delete'], url_path='qrcode-geral')
    def qrcode_geral(self, request, pk=None):
        unidade = self.get_object()
        if request.method == 'DELETE':
            unidade.qrcode_pix_geral = ''
            unidade.save(update_fields=['qrcode_pix_geral'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        imagem = request.data.get('imagem')
        erro = _validar_imagem(imagem)
        if erro:
            return Response({'imagem': [erro]}, status=status.HTTP_400_BAD_REQUEST)
        unidade.qrcode_pix_geral = imagem
        unidade.save(update_fields=['qrcode_pix_geral'])
        return Response({'ok': True}, status=status.HTTP_201_CREATED)


class QrCodeGeralView(APIView):
    """
    GET /api/negocio/qrcode-geral/
    Devolve o QR Pix geral (primeira unidade que tiver um). Usado pelo Caixa,
    por isso é liberado a qualquer usuário logado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unidade = UnidadeNegocio.objects.exclude(qrcode_pix_geral='').order_by('id').first()
        return Response({'imagem': unidade.qrcode_pix_geral if unidade else None})
