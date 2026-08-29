from rest_framework.routers import DefaultRouter
from .views import UnidadeNegocioViewSet

router = DefaultRouter()
router.register('', UnidadeNegocioViewSet, basename='unidade-negocio')

urlpatterns = router.urls
