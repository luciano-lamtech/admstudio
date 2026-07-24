from django.urls import path
from .views import UsuarioListView

urlpatterns = [
    path('', UsuarioListView.as_view(), name='usuarios-list'),
]
