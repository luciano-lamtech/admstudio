from rest_framework import viewsets
from .models import Cliente
from .serializers import ClienteSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de clientes.
    GET/POST /api/clientes/
    GET/PUT/PATCH/DELETE /api/clientes/{id}/
    Suporta busca via ?search=nome
    """
    serializer_class = ClienteSerializer

    def get_queryset(self):
        qs = Cliente.objects.all()
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs
