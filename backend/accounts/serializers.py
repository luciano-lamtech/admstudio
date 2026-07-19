from rest_framework import serializers
from .models import User, Role, MenuItem


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'nome', 'nivel']


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'nome', 'role', 'is_active']


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'label', 'icone', 'rota', 'ordem', 'nivel_minimo']
