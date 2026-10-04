from rest_framework.routers import DefaultRouter
from .views import MovimentacaoEstoqueViewSet

router = DefaultRouter()
router.register('', MovimentacaoEstoqueViewSet, basename='movimentacao-estoque')

urlpatterns = router.urls
