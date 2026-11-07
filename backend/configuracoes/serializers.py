from rest_framework import serializers

from accounts.permissions import nivel_do_token

from .constants import FUSOS_BRASIL, FUSOS_VALIDOS
from .models import ConfiguracaoSistema

NIVEL_ADMIN = 10


class ConfiguracaoSistemaSerializer(serializers.ModelSerializer):
    fusos_disponiveis = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracaoSistema
        fields = ['fuso_horario', 'link_agendamento', 'fusos_disponiveis', 'pode_editar']

    def validate_fuso_horario(self, valor):
        if valor not in FUSOS_VALIDOS:
            raise serializers.ValidationError('Selecione um fuso horário do Brasil.')
        return valor

    def validate_link_agendamento(self, valor):
        return (valor or '').strip()

    def get_fusos_disponiveis(self, obj):
        return [{'valor': v, 'rotulo': r} for v, r in FUSOS_BRASIL]

    def get_pode_editar(self, obj):
        return nivel_do_token(self.context['request']) >= NIVEL_ADMIN
