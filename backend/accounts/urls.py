from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UsuarioManageViewSet, RoleViewSet, MenuView, SenhaOperacaoView

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='role')
router.register('', UsuarioManageViewSet, basename='usuario')

urlpatterns = [
    path('menu/', MenuView.as_view()),
    path('senha-operacao/', SenhaOperacaoView.as_view()),
] + router.urls
