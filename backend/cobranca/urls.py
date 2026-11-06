from django.urls import path
from .views import AssinaturaView, SituacaoView, GerarBoletoView, VerificarPagamentoView
from .endereco import EnderecoView

urlpatterns = [
    path('', AssinaturaView.as_view()),
    path('situacao/', SituacaoView.as_view()),
    path('gerar-boleto/', GerarBoletoView.as_view()),
    path('verificar/', VerificarPagamentoView.as_view()),
    path('endereco/', EnderecoView.as_view()),
]
