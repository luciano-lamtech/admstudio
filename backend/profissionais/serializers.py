from rest_framework import serializers
from .models import Profissional, Especialidade


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = ['id', 'nome', 'ativo', 'created_at']


class ProfissionalSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True, default=None)
    especialidade_nome = serializers.CharField(source='especialidade.nome', read_only=True, default=None)

    class Meta:
        model = Profissional
        fields = [
            'id', 'nome', 'especialidade', 'especialidade_nome', 'telefone', 'email',
            'comissao_percentual', 'cor', 'usuario', 'usuario_nome', 'ativo', 'created_at',
        ]
