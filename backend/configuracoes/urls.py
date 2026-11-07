from django.urls import path

from .views import PreferenciasSistemaView

urlpatterns = [
    path('preferencias/', PreferenciasSistemaView.as_view()),
]
