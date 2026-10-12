from rest_framework import serializers
from .models import ItemCatalogo


class ItemCatalogoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    tem_qrcode = serializers.SerializerMethodField()

    class Meta:
        model = ItemCatalogo
        fields = [
            'id', 'tipo', 'tipo_display', 'nome', 'descricao', 'categoria',
            'preco', 'duracao_minutos', 'controla_estoque', 'estoque_atual',
            'estoque_minimo', 'ativo', 'created_at', 'tem_qrcode',
        ]

    def get_tem_qrcode(self, obj):
        return bool(obj.qrcode_pix)

    def update(self, instance, validated_data):
        novo_preco = validated_data.get('preco')
        if novo_preco is not None and novo_preco != instance.preco:
            # O QR Pix traz o valor fixo: ao mudar o preço, o QR antigo sai e precisa ser recadastrado
            instance.qrcode_pix = ''
        return super().update(instance, validated_data)
