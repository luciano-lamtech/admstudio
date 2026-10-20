from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PacoteViewSet, ClientePacotesView, VenderPacoteView, UsarPacoteView

router = DefaultRouter()
router.register('', PacoteViewSet, basename='pacote')

# Rotas fixas antes do router, para não serem lidas como id
urlpatterns = [
    path('clientes/<int:cliente_id>/', ClientePacotesView.as_view()),
    path('vender/', VenderPacoteView.as_view()),
    path('cliente-pacotes/<int:pk>/usar/', UsarPacoteView.as_view()),
] + router.urls
