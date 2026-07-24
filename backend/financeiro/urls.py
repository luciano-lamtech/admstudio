from rest_framework.routers import DefaultRouter
from .views import LancamentoViewSet

router = DefaultRouter()
router.register('', LancamentoViewSet, basename='lancamento')

urlpatterns = router.urls
