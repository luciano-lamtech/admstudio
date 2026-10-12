from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UsuarioManageViewSet, RoleViewSet, MenuView

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='role')
router.register('', UsuarioManageViewSet, basename='usuario')

urlpatterns = [
    path('menu/', MenuView.as_view()),
] + router.urls
