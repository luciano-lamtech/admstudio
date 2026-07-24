from rest_framework import serializers
from .models import Agendamento, AgendamentoItem


class AgendamentoItemSerializer(serializers.ModelSerializer):
    item_catalogo_nome = serializers.CharField(source='item_catalogo.nome', read_only=True)
    item_catalogo_tipo = serializers.CharField(source='item_catalogo.tipo', read_only=True)

    class Meta:
        model = AgendamentoItem
        fields = [
            'id', 'item_catalogo', 'item_catalogo_nome', 'item_catalogo_tipo',
            'quantidade', 'preco_unitario', 'subtotal',
        ]
        read_only_fields = ['subtotal']


class AgendamentoSerializer(serializers.ModelSerializer):
    itens = AgendamentoItemSerializer(many=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    profissional_nome = serializers.CharField(source='profissional.nome', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Agendamento
        fields = [
            'id', 'cliente', 'cliente_nome', 'profissional', 'profissional_nome',
            'data_hora', 'status', 'status_display', 'observacoes', 'valor_total',
            'itens', 'created_at',
        ]
        read_only_fields = ['valor_total']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        agendamento = Agendamento.objects.create(**validated_data)
        self._salvar_itens(agendamento, itens_data)
        agendamento.recalcular_total()
        if agendamento.status == 'concluido':
            self._gerar_receita(agendamento)
        return agendamento

    def update(self, instance, validated_data):
        status_anterior = instance.status
        itens_data = validated_data.pop('itens', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if itens_data is not None:
            instance.itens.all().delete()
            self._salvar_itens(instance, itens_data)
        instance.recalcular_total()
        if instance.status == 'concluido' and status_anterior != 'concluido':
            self._gerar_receita(instance)
        return instance

    def _gerar_receita(self, agendamento):
        # Import local para evitar dependência circular entre os apps
        from financeiro.models import Lancamento
        if Lancamento.objects.filter(agendamento=agendamento).exists():
            return  # já existe uma receita gerada para esse agendamento
        Lancamento.objects.create(
            tipo='receita',
            categoria='Atendimento',
            descricao=f'Atendimento - {agendamento.cliente.nome}',
            valor=agendamento.valor_total,
            status='pago',
            data=agendamento.data_hora.date(),
            agendamento=agendamento,
        )

    def _salvar_itens(self, agendamento, itens_data):
        for item_data in itens_data:
            preco = item_data.get('preco_unitario') or item_data['item_catalogo'].preco
            AgendamentoItem.objects.create(
                agendamento=agendamento,
                item_catalogo=item_data['item_catalogo'],
                quantidade=item_data.get('quantidade', 1),
                preco_unitario=preco,
            )
