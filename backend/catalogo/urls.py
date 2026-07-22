from rest_framework.routers import DefaultRouter
from .views import ItemCatalogoViewSet

router = DefaultRouter()
router.register('', ItemCatalogoViewSet, basename='item-catalogo')

urlpatterns = router.urls
