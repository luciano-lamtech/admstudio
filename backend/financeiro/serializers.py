from rest_framework import serializers
from .models import Lancamento


class LancamentoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    forma_pagamento_display = serializers.CharField(source='get_forma_pagamento_display', read_only=True)
    cliente_nome = serializers.CharField(source='agendamento.cliente.nome', read_only=True, default=None)

    itens_agendamento = serializers.SerializerMethodField()

    def get_itens_agendamento(self, obj):
        if not obj.agendamento_id:
            return []
        return [{
            'item_id': i.item_catalogo_id,
            'nome': i.item_catalogo.nome,
            'preco': str(i.preco_unitario),
            'quantidade': i.quantidade,
            'tem_qrcode': bool(i.item_catalogo.qrcode_pix),
        } for i in obj.agendamento.itens.select_related('item_catalogo')]

    class Meta:
        model = Lancamento
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria', 'descricao', 'valor',
            'forma_pagamento', 'forma_pagamento_display', 'status', 'status_display',
            'data', 'agendamento', 'cliente_nome', 'itens_agendamento', 'observacoes', 'created_at',
        ]
