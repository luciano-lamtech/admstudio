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


class UserManageSerializer(serializers.ModelSerializer):
    """
    Serializer para o CRUD de usuários (tela Usuários e Perfis de Acesso).
    Diferente do UserSerializer (usado no login), aqui 'role' é gravável
    (id do perfil) e existe um campo 'senha' write-only.
    """
    senha = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_nome = serializers.CharField(source='role.nome', read_only=True, default=None)

    class Meta:
        model = User
        fields = ['id', 'email', 'nome', 'role', 'role_nome', 'is_active', 'senha', 'created_at']

    def create(self, validated_data):
        senha = validated_data.pop('senha', None)
        user = User(**validated_data)
        user.set_password(senha or None)
        user.save()
        return user

    def update(self, instance, validated_data):
        senha = validated_data.pop('senha', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if senha:
            instance.set_password(senha)
        instance.save()
        return instance


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'label', 'icone', 'rota', 'ordem', 'nivel_minimo']
