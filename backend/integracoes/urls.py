from django.urls import path
from .views import LembretesAmanhaView, MarcarLembreteEnviadoView, RespostaClienteView

urlpatterns = [
    path('lembretes-amanha/', LembretesAmanhaView.as_view()),
    path('lembrete-enviado/', MarcarLembreteEnviadoView.as_view()),
    path('resposta/', RespostaClienteView.as_view()),
]
