from rest_framework import viewsets
from .models import MovimentacaoEstoque
from .serializers import MovimentacaoEstoqueSerializer
from accounts.models import User


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    """
    Histórico de movimentações de estoque.
    GET /api/estoque/?item=<id>
    POST /api/estoque/   (cria uma entrada, saída ou ajuste)
    Não permite editar/excluir — é um registro de auditoria.
    """
    serializer_class = MovimentacaoEstoqueSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = MovimentacaoEstoque.objects.select_related('item_catalogo', 'usuario')
        item_id = self.request.query_params.get('item')
        if item_id:
            qs = qs.filter(item_catalogo_id=item_id)
        return qs

    def perform_create(self, serializer):
        usuario = None
        try:
            user_id = self.request.auth.get('user_id') if self.request.auth else None
            if user_id:
                usuario = User.objects.filter(pk=user_id).first()
        except Exception:
            usuario = None
        serializer.save(usuario=usuario)
