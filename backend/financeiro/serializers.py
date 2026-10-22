from rest_framework import serializers
from accounts.permissions import unidade_permitida
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

    def validate(self, attrs):
        request = self.context.get('request')
        if request is not None and (self.instance is None or 'unidade' in attrs):
            if not unidade_permitida(request, attrs.get('unidade')):
                raise serializers.ValidationError({'unidade': 'Você não tem acesso a esta unidade.'})
        return attrs

    class Meta:
        model = Lancamento
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria', 'descricao', 'valor',
            'forma_pagamento', 'forma_pagamento_display', 'status', 'status_display',
            'data', 'agendamento', 'cliente_nome', 'itens_agendamento', 'unidade', 'observacoes', 'created_at',
        ]
