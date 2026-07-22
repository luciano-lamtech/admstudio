from rest_framework import serializers
from .models import ItemCatalogo


class ItemCatalogoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = ItemCatalogo
        fields = [
            'id', 'tipo', 'tipo_display', 'nome', 'descricao', 'categoria',
            'preco', 'duracao_minutos', 'controla_estoque', 'estoque_atual',
            'ativo', 'created_at',
        ]
