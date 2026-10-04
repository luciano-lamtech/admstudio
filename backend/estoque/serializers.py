from rest_framework import serializers
from .models import MovimentacaoEstoque


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    item_nome = serializers.CharField(source='item_catalogo.nome', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True, default=None)

    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id', 'item_catalogo', 'item_nome', 'tipo', 'tipo_display', 'quantidade',
            'estoque_resultante', 'motivo', 'usuario', 'usuario_nome', 'created_at',
        ]
        read_only_fields = ['estoque_resultante', 'usuario']

    def validate(self, attrs):
        item = attrs['item_catalogo']
        if not item.controla_estoque:
            raise serializers.ValidationError('Este item não tem controle de estoque habilitado.')

        tipo = attrs['tipo']
        quantidade = attrs['quantidade']

        if tipo in ('entrada', 'saida') and quantidade <= 0:
            raise serializers.ValidationError({'quantidade': 'Informe uma quantidade maior que zero.'})
        if tipo == 'saida' and quantidade > item.estoque_atual:
            raise serializers.ValidationError(
                {'quantidade': f'Estoque insuficiente (atual: {item.estoque_atual}).'}
            )
        if tipo == 'ajuste' and quantidade < 0:
            raise serializers.ValidationError({'quantidade': 'O novo total não pode ser negativo.'})
        return attrs

    def create(self, validated_data):
        item = validated_data['item_catalogo']
        tipo = validated_data['tipo']
        quantidade = validated_data['quantidade']

        if tipo == 'entrada':
            item.estoque_atual += quantidade
        elif tipo == 'saida':
            item.estoque_atual -= quantidade
        elif tipo == 'ajuste':
            item.estoque_atual = quantidade
        item.save(update_fields=['estoque_atual'])

        validated_data['estoque_resultante'] = item.estoque_atual
        return super().create(validated_data)
