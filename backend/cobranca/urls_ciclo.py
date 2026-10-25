from django.urls import path
from .ciclo_views import CicloCobrancaView

urlpatterns = [
    path('ciclo/', CicloCobrancaView.as_view()),
]
