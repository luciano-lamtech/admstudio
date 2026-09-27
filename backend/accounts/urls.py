from rest_framework.routers import DefaultRouter
from .views import UsuarioManageViewSet, RoleViewSet

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='role')
router.register('', UsuarioManageViewSet, basename='usuario')

urlpatterns = router.urls
