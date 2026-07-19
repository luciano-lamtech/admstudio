from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'cpf_cnpj', 'telefone', 'email', 'data_nascimento',
                  'endereco', 'observacoes', 'ativo', 'created_at']
