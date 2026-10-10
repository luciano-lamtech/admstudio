from django.urls import path
from .views import AnamneseView

urlpatterns = [
    path('clientes/<int:cliente_id>/anamnese/', AnamneseView.as_view()),
]
