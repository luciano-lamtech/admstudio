from rest_framework import serializers
from .models import Pacote


class PacoteSerializer(serializers.ModelSerializer):
    servico_nome = serializers.CharField(source='servico.nome', read_only=True, default=None)

    class Meta:
        model = Pacote
        fields = ['id', 'nome', 'servico', 'servico_nome', 'sessoes', 'preco', 'validade_dias', 'ativo']
