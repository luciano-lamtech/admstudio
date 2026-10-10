from datetime import datetime, timedelta

from django.utils import timezone
from zoneinfo import ZoneInfo

FUSO = ZoneInfo('America/Sao_Paulo')
from rest_framework.response import Response
from rest_framework import status

from .base import TenantPublicAPIView
from catalogo.models import ItemCatalogo
from profissionais.models import Profissional
from clientes.models import Cliente
from agendamentos.models import Agendamento, AgendamentoItem

HORA_INICIO = 8
HORA_FIM = 20


class InfoPublicoView(TenantPublicAPIView):
    """GET /api/publico/<cnpj>/info/ — nome do negócio, para exibir no chat."""
    def get(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro
        return Response({'nome': self.tenant.nome_fantasia or self.tenant.razao_social})


class ServicosPublicosView(TenantPublicAPIView):
    """GET /api/publico/<cnpj>/servicos/ — serviços disponíveis para agendar."""
    def get(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro
        servicos = ItemCatalogo.objects.filter(tipo='servico', ativo=True).order_by('nome')
        dados = [
            {'id': s.id, 'nome': s.nome, 'preco': str(s.preco), 'duracao_minutos': s.duracao_minutos or 30}
            for s in servicos
        ]
        return Response(dados)


class ProfissionaisPublicosView(TenantPublicAPIView):
    """GET /api/publico/<cnpj>/profissionais/ — profissionais ativos."""
    def get(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro
        profissionais = Profissional.objects.filter(ativo=True).order_by('nome')
        dados = [{'id': p.id, 'nome': p.nome} for p in profissionais]
        return Response(dados)


class HorariosDisponiveisView(TenantPublicAPIView):
    """
    GET /api/publico/<cnpj>/horarios/?profissional=<id>&data=YYYY-MM-DD&duracao=<min>
    Lista os horários livres daquele profissional, naquele dia, considerando
    a duração do serviço escolhido.
    """
    def get(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro

        profissional_id = request.query_params.get('profissional')
        data_str = request.query_params.get('data')
        duracao = int(request.query_params.get('duracao', 30))
        if not profissional_id or not data_str:
            return Response({'detail': 'Informe profissional e data.'}, status=400)

        try:
            data = datetime.strptime(data_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Data inválida.'}, status=400)

        ocupados = Agendamento.objects.filter(
            profissional_id=profissional_id, data_hora__date=data,
        ).exclude(status='cancelado').prefetch_related('itens__item_catalogo')

        intervalos = []
        for ag in ocupados:
            dur = sum(
                (i.item_catalogo.duracao_minutos or 0) * i.quantidade
                for i in ag.itens.all() if i.item_catalogo.tipo == 'servico'
            ) or 30
            intervalos.append((ag.data_hora, ag.data_hora + timedelta(minutes=dur)))

        inicio_expediente = datetime(data.year, data.month, data.day, HORA_INICIO, tzinfo=FUSO)
        fim_expediente = datetime(data.year, data.month, data.day, HORA_FIM, tzinfo=FUSO)

        horarios = []
        atual = inicio_expediente
        while atual + timedelta(minutes=duracao) <= fim_expediente:
            fim_proposto = atual + timedelta(minutes=duracao)
            # No próprio dia de hoje, não oferece horário que já passou
            if atual > timezone.now():
                conflita = any(atual < fim and fim_proposto > inicio for inicio, fim in intervalos)
                if not conflita:
                    horarios.append(atual.strftime('%H:%M'))
            atual += timedelta(minutes=30)

        return Response(horarios)


class AgendarPublicoView(TenantPublicAPIView):
    """POST /api/publico/<cnpj>/agendar/ — cria o agendamento vindo do chatbot."""
    def post(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro

        dados = request.data
        nome = (dados.get('cliente_nome') or '').strip().upper()
        telefone = (dados.get('cliente_telefone') or '').strip()
        servico_id = dados.get('servico_id')
        profissional_id = dados.get('profissional_id') or None
        data_hora_str = dados.get('data_hora')  # 'YYYY-MM-DD HH:MM'

        if not all([nome, telefone, servico_id, data_hora_str]):
            return Response({'detail': 'Preencha todos os campos obrigatórios.'}, status=400)

        try:
            servico = ItemCatalogo.objects.get(pk=servico_id, tipo='servico', ativo=True)
        except ItemCatalogo.DoesNotExist:
            return Response({'detail': 'Serviço inválido.'}, status=400)

        try:
            data_hora = datetime.strptime(data_hora_str, '%Y-%m-%d %H:%M').replace(tzinfo=FUSO)
        except ValueError:
            return Response({'detail': 'Data/hora inválida.'}, status=400)

        # Bloqueia se este telefone já tem agendamento ATIVO que se sobrepõe
        # no horário, mesmo com outro profissional. Compara intervalos
        # (início + duração), não só a hora exata.
        duracao_novo = servico.duracao_minutos or 30
        inicio_novo = data_hora
        fim_novo = data_hora + timedelta(minutes=duracao_novo)

        existentes = (
            Agendamento.objects.filter(cliente__telefone=telefone)
            .exclude(status__in=['cancelado', 'concluido'])
            .prefetch_related('itens__item_catalogo')
        )
        for ag in existentes:
            dur_existente = sum(
                (i.item_catalogo.duracao_minutos or 0) * i.quantidade
                for i in ag.itens.all() if i.item_catalogo.tipo == 'servico'
            ) or 30
            inicio_existente = ag.data_hora
            fim_existente = ag.data_hora + timedelta(minutes=dur_existente)
            if inicio_novo < fim_existente and fim_novo > inicio_existente:
                return Response(
                    {'detail': 'Você já tem um agendamento neste horário com outro profissional. Escolha outro horário.'},
                    status=status.HTTP_409_CONFLICT,
                )

        cliente = Cliente.objects.filter(telefone=telefone).first()
        if cliente:
            if cliente.nome != nome:
                cliente.nome = nome
                cliente.save(update_fields=['nome'])
        else:
            cliente = Cliente.objects.create(nome=nome, telefone=telefone)

        agendamento = Agendamento.objects.create(
            cliente=cliente,
            profissional_id=profissional_id,
            data_hora=data_hora,
            status='agendado',
            observacoes='Agendado pelo chatbot público.',
        )
        AgendamentoItem.objects.create(
            agendamento=agendamento,
            item_catalogo=servico,
            quantidade=1,
            preco_unitario=servico.preco,
        )
        agendamento.recalcular_total()

        return Response({
            'agendamento_id': agendamento.id,
            'mensagem': 'Agendamento confirmado!',
        }, status=status.HTTP_201_CREATED)


class ConsultarPublicoView(TenantPublicAPIView):
    """POST /api/publico/<cnpj>/consultar/ — lista os agendamentos de um telefone."""
    def post(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro

        telefone = (request.data.get('telefone') or '').strip()
        if not telefone:
            return Response({'detail': 'Informe o telefone.'}, status=400)

        inicio_hoje = timezone.now().astimezone(FUSO).replace(hour=0, minute=0, second=0, microsecond=0)
        agendamentos = (
            Agendamento.objects.filter(cliente__telefone=telefone, data_hora__gte=inicio_hoje)
            .exclude(status='cancelado')
            .select_related('profissional')
            .prefetch_related('itens__item_catalogo')
            .order_by('-data_hora')[:10]
        )

        dados = [{
            'id': ag.id,
            'data_hora': timezone.localtime(ag.data_hora, FUSO).strftime('%Y-%m-%d %H:%M'),
            'status': ag.status,
            'status_display': ag.get_status_display(),
            'profissional_nome': ag.profissional.nome if ag.profissional else 'Sem profissional definido',
            'servicos': [i.item_catalogo.nome for i in ag.itens.all()],
            'valor_total': str(ag.valor_total),
        } for ag in agendamentos]

        return Response(dados)


class CancelarPublicoView(TenantPublicAPIView):
    """POST /api/publico/<cnpj>/cancelar/ — cancela um agendamento (valida pelo telefone)."""
    def post(self, request, cnpj):
        erro = self.checar_tenant()
        if erro:
            return erro

        agendamento_id = request.data.get('agendamento_id')
        telefone = (request.data.get('telefone') or '').strip()

        inicio_hoje = timezone.now().astimezone(FUSO).replace(hour=0, minute=0, second=0, microsecond=0)
        try:
            agendamento = Agendamento.objects.get(
                pk=agendamento_id, cliente__telefone=telefone, data_hora__gte=inicio_hoje,
            )
        except Agendamento.DoesNotExist:
            return Response({'detail': 'Agendamento não encontrado para esse telefone.'}, status=404)

        if agendamento.status == 'concluido':
            return Response({'detail': 'Esse atendimento já foi concluído e não pode ser cancelado.'}, status=400)

        agendamento.status = 'cancelado'
        agendamento.save(update_fields=['status'])
        return Response({'mensagem': 'Agendamento cancelado com sucesso.'})
