from rest_framework import viewsets
from .models import UnidadeNegocio
from .serializers import UnidadeNegocioSerializer


class UnidadeNegocioViewSet(viewsets.ModelViewSet):
    """
    CRUD das unidades/lojas do negócio.
    GET/POST /api/negocio/
    GET/PUT/PATCH/DELETE /api/negocio/{id}/
    """
    serializer_class = UnidadeNegocioSerializer
    queryset = UnidadeNegocio.objects.all()
