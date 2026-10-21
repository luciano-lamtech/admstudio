from django.urls import path
from .views import ConfiguracaoFidelidadeView, ClienteCashbackView, ZerarClienteView, ZerarTodosView

urlpatterns = [
    path('config/', ConfiguracaoFidelidadeView.as_view()),
    path('clientes/<int:cliente_id>/', ClienteCashbackView.as_view()),
    path('clientes/<int:cliente_id>/zerar/', ZerarClienteView.as_view()),
    path('zerar-todos/', ZerarTodosView.as_view()),
]
