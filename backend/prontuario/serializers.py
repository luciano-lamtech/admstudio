from rest_framework import serializers
from .models import Anamnese


class AnamneseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anamnese
        exclude = ['cliente']
        read_only_fields = ['consentimento_em', 'atualizado_em']
