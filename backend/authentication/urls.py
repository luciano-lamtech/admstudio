from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView
from .recuperacao_views import EsqueciSenhaView, RedefinirSenhaView, MeuLinkSenhaView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('esqueci-senha/', EsqueciSenhaView.as_view()),
    path('redefinir-senha/', RedefinirSenhaView.as_view()),
    path('meu-link-senha/', MeuLinkSenhaView.as_view()),
]
