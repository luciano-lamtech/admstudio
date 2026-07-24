from rest_framework import generics
from .models import User
from .serializers import UserSerializer


class UsuarioListView(generics.ListAPIView):
    """
    GET /api/usuarios/
    Lista os usuários ativos do tenant (usado, por exemplo, para escolher
    o profissional responsável num agendamento).
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(is_active=True).select_related('role')
