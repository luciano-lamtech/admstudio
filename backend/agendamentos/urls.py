from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AgendamentoViewSet, RelatorioComissaoView

router = DefaultRouter()
router.register('', AgendamentoViewSet, basename='agendamento')

urlpatterns = [
    path('relatorio-comissao/', RelatorioComissaoView.as_view(), name='relatorio-comissao'),
] + router.urls
