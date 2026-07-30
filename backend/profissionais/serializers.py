from rest_framework import serializers
from .models import Profissional


class ProfissionalSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True, default=None)

    class Meta:
        model = Profissional
        fields = [
            'id', 'nome', 'especialidade', 'telefone', 'email',
            'comissao_percentual', 'cor', 'usuario', 'usuario_nome', 'ativo', 'created_at',
        ]
