from rest_framework import serializers
from .models import UnidadeNegocio


class UnidadeNegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadeNegocio
        fields = [
            'id', 'nome_empresa', 'cnpj_cpf', 'nome_contato', 'telefone_contato',
            'email', 'telegram_id', 'endereco', 'numero', 'bairro', 'cidade',
            'estado', 'cep', 'pais', 'ativo', 'created_at',
        ]
