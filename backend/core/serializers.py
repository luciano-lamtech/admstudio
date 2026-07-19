from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'cnpj_cpf', 'razao_social', 'nome_fantasia', 'tipo_negocio', 'plano', 'is_active']
        read_only_fields = fields
