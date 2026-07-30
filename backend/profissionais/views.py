from rest_framework import viewsets
from .models import Profissional
from .serializers import ProfissionalSerializer


class ProfissionalViewSet(viewsets.ModelViewSet):
    """
    CRUD de Profissionais.
    Filtros: ?search=nome  ?ativo=true
    """
    serializer_class = ProfissionalSerializer

    def get_queryset(self):
        qs = Profissional.objects.select_related('usuario')
        if self.request.query_params.get('ativo') == 'true':
            qs = qs.filter(ativo=True)
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs
