from rest_framework import serializers
from .models import UnidadeNegocio


class UnidadeNegocioSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = UnidadeNegocio
        fields = [
            'id', 'nome_empresa', 'cnpj_cpf', 'nome_contato', 'telefone_contato',
            'email', 'telegram_id', 'cep', 'pais', 'endereco', 'numero', 'bairro',
            'cidade', 'estado', 'status', 'status_display', 'created_at',
        ]
