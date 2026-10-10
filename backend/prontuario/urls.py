from django.urls import path
from .views import AnamneseView, SessoesView, SessaoDetailView, FotosView, FotoDetailView

urlpatterns = [
    path('clientes/<int:cliente_id>/anamnese/', AnamneseView.as_view()),
    path('clientes/<int:cliente_id>/sessoes/', SessoesView.as_view()),
    path('sessoes/<int:pk>/', SessaoDetailView.as_view()),
    path('sessoes/<int:sessao_id>/fotos/', FotosView.as_view()),
    path('fotos/<int:pk>/', FotoDetailView.as_view()),
]
