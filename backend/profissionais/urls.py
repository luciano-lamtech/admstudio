from rest_framework.routers import DefaultRouter
from .views import ProfissionalViewSet, EspecialidadeViewSet

router = DefaultRouter()
router.register('especialidades', EspecialidadeViewSet, basename='especialidade')
router.register('', ProfissionalViewSet, basename='profissional')

urlpatterns = router.urls
