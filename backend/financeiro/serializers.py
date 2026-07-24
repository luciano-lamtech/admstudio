from rest_framework import serializers
from .models import Lancamento


class LancamentoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    forma_pagamento_display = serializers.CharField(source='get_forma_pagamento_display', read_only=True)
    cliente_nome = serializers.CharField(source='agendamento.cliente.nome', read_only=True, default=None)

    class Meta:
        model = Lancamento
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria', 'descricao', 'valor',
            'forma_pagamento', 'forma_pagamento_display', 'status', 'status_display',
            'data', 'agendamento', 'cliente_nome', 'observacoes', 'created_at',
        ]
