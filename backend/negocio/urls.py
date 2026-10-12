from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UnidadeNegocioViewSet, QrCodeGeralView

router = DefaultRouter()
router.register('', UnidadeNegocioViewSet, basename='unidade-negocio')

# A rota fixa vem antes do router, senão 'qrcode-geral' seria lido como id
urlpatterns = [
    path('qrcode-geral/', QrCodeGeralView.as_view()),
] + router.urls
