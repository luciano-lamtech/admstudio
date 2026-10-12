from accounts.permissions import criar_permissao
Nivel10 = criar_permissao(10)
from rest_framework import viewsets
from .models import UnidadeNegocio
from .serializers import UnidadeNegocioSerializer


class UnidadeNegocioViewSet(viewsets.ModelViewSet):
    permission_classes = [Nivel10]

    """
    CRUD das unidades/lojas do negócio.
    GET/POST /api/negocio/
    GET/PUT/PATCH/DELETE /api/negocio/{id}/
    """
    serializer_class = UnidadeNegocioSerializer
    queryset = UnidadeNegocio.objects.all()
