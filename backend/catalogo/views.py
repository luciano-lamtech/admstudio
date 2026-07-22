from rest_framework import viewsets
from .models import ItemCatalogo
from .serializers import ItemCatalogoSerializer


class ItemCatalogoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Serviços e Produtos.
    GET/POST /api/catalogo/
    GET/PUT/PATCH/DELETE /api/catalogo/{id}/
    Filtros: ?search=nome  e  ?tipo=servico|produto
    """
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
