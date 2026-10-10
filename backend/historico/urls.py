from django.urls import path
from .views import HistoricoClienteView

urlpatterns = [
    path('clientes/<int:cliente_id>/', HistoricoClienteView.as_view()),
]
