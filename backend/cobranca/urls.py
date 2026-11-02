from django.urls import path
from .views import AssinaturaView, SituacaoView, GerarBoletoView, VerificarPagamentoView

urlpatterns = [
    path('', AssinaturaView.as_view()),
    path('situacao/', SituacaoView.as_view()),
    path('gerar-boleto/', GerarBoletoView.as_view()),
    path('verificar/', VerificarPagamentoView.as_view()),
]
