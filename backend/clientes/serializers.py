from rest_framework import serializers
from .models import Cliente


# Campos de texto que são gravados em MAIÚSCULAS.
# O e-mail é exceção: sempre em minúsculas.
CAMPOS_MAIUSCULAS = ['nome', 'cpf_cnpj', 'token', 'endereco', 'observacoes']


class ClienteSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'cpf_cnpj', 'telefone', 'email', 'data_nascimento',
                  'sexo', 'sexo_display', 'token', 'endereco', 'observacoes',
                  'status', 'status_display', 'created_at']

    def validate(self, attrs):
        for campo in CAMPOS_MAIUSCULAS:
            if isinstance(attrs.get(campo), str):
                attrs[campo] = attrs[campo].strip().upper()
        if isinstance(attrs.get('email'), str):
            attrs['email'] = attrs['email'].strip().lower()
        return attrs
