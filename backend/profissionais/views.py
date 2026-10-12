from accounts.permissions import criar_permissao
Nivel7 = criar_permissao(1, 7)
from accounts.permissions import criar_permissao
Nivel7 = criar_permissao(1, 7)
from rest_framework import viewsets
from .models import Profissional, Especialidade
from .serializers import ProfissionalSerializer, EspecialidadeSerializer


class EspecialidadeViewSet(viewsets.ModelViewSet):
    permission_classes = [Nivel7]

    """CRUD de Especialidades. Filtros: ?search=nome  ?ativo=true"""
    serializer_class = EspecialidadeSerializer

    def get_queryset(self):
        qs = Especialidade.objects.all()
        if self.request.query_params.get('ativo') == 'true':
            qs = qs.filter(ativo=True)
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs


class ProfissionalViewSet(viewsets.ModelViewSet):
    permission_classes = [Nivel7]

    """
    CRUD de Profissionais.
    Filtros: ?search=nome  ?ativo=true
    """
    serializer_class = ProfissionalSerializer

    def get_queryset(self):
        qs = Profissional.objects.select_related('usuario', 'especialidade')
        if self.request.query_params.get('ativo') == 'true':
            qs = qs.filter(ativo=True)
        busca = self.request.query_params.get('search')
        if busca:
            qs = qs.filter(nome__icontains=busca)
        return qs
