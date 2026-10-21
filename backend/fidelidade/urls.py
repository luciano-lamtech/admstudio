from django.urls import path
from .views import ConfiguracaoFidelidadeView, ClienteCashbackView

urlpatterns = [
    path('config/', ConfiguracaoFidelidadeView.as_view()),
    path('clientes/<int:cliente_id>/', ClienteCashbackView.as_view()),
]
