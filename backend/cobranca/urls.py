from django.urls import path
from .views import AssinaturaView

urlpatterns = [
    path('', AssinaturaView.as_view()),
]
