from django.urls import path
from .ciclo_views import CicloCobrancaView
from .views import WebhookEfiView

urlpatterns = [
    path('ciclo/', CicloCobrancaView.as_view()),
    path('webhook-efi/', WebhookEfiView.as_view()),
]
