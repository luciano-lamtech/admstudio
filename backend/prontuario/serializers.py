from rest_framework import serializers
from .models import Anamnese, Sessao


class AnamneseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anamnese
        exclude = ['cliente']
        read_only_fields = ['consentimento_em', 'atualizado_em']


class SessaoSerializer(serializers.ModelSerializer):
    profissional_nome = serializers.CharField(source='profissional.nome', read_only=True, default=None)
    fotos = serializers.SerializerMethodField()

    class Meta:
        model = Sessao
        fields = ['id', 'data', 'procedimento', 'descricao', 'observacoes',
                  'profissional', 'profissional_nome', 'agendamento', 'fotos', 'created_at']

    def get_fotos(self, obj):
        return [{'id': f.id, 'tipo': f.tipo} for f in obj.fotos.all()]
