from rest_framework.routers import DefaultRouter
from .views import AgendamentoViewSet

router = DefaultRouter()
router.register('', AgendamentoViewSet, basename='agendamento')

urlpatterns = router.urls
