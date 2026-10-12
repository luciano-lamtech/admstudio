import base64
import binascii

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import criar_permissao
from .models import ItemCatalogo
from .serializers import ItemCatalogoSerializer

# Leitura para todos (1); cadastrar/alterar a partir da Recepção (3)
Nivel3 = criar_permissao(1, 3)

TIPOS_IMAGEM = {'image/png', 'image/jpeg', 'image/webp'}
MAX_BYTES = 1024 * 1024


def _validar_imagem(data_url):
    if not isinstance(data_url, str) or not data_url.startswith('data:') or ',' not in data_url:
        return 'Imagem inválida.'
    cabecalho, dados = data_url.split(',', 1)
    tipo = cabecalho[5:].split(';')[0]
    if tipo not in TIPOS_IMAGEM:
        return 'Formato não permitido (use PNG, JPG ou WEBP).'
    try:
        tamanho = len(base64.b64decode(dados, validate=True))
    except (ValueError, binascii.Error):
        return 'Imagem inválida.'
    if tamanho > MAX_BYTES:
        return 'Imagem muito grande (máximo 1 MB).'
    return None


class ItemCatalogoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Serviços e Produtos.
    Filtros: ?search=nome  ?tipo=servico|produto
    QR Pix: GET/POST/DELETE /api/catalogo/<id>/qrcode/
    """
    permission_classes = [Nivel3]
    serializer_class = ItemCatalogoSerializer

    def get_queryset(self):
        qs = ItemCatalogo.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo in ('servico', 'produto'):
            qs = qs.filter(tipo=tipo)
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs

    @action(detail=True, methods=['get', 'post', 'delete'], url_path='qrcode')
    def qrcode(self, request, pk=None):
        item = self.get_object()
        if request.method == 'GET':
            return Response({'imagem': item.qrcode_pix or None})
        if request.method == 'DELETE':
            item.qrcode_pix = ''
            item.save(update_fields=['qrcode_pix'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        imagem = request.data.get('imagem')
        erro = _validar_imagem(imagem)
        if erro:
            return Response({'imagem': [erro]}, status=status.HTTP_400_BAD_REQUEST)
        item.qrcode_pix = imagem
        item.save(update_fields=['qrcode_pix'])
        return Response({'ok': True}, status=status.HTTP_201_CREATED)
