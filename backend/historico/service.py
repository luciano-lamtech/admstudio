"""
Registra no histórico do cliente cada mudança feita num agendamento.
É chamado a partir do salvamento do agendamento, então cobre qualquer origem:
tela do sistema, chatbot público e resposta do WhatsApp.
"""
from zoneinfo import ZoneInfo

from .models import EventoHistorico

FUSO = ZoneInfo('America/Sao_Paulo')

STATUS_LABEL = {
    'agendado': 'Agendado',
    'confirmado': 'Confirmado',
    'em_atendimento': 'Em Atendimento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
}


def _money(valor):
    return 'R$ ' + f'{float(valor):.2f}'.replace('.', ',')


def _dt(dt):
    return dt.astimezone(FUSO).strftime('%d/%m/%Y %H:%M')


def _label_item(tipo_item):
    return 'Serviço' if tipo_item == 'servico' else 'Produto'


def usuario_da_requisicao(request):
    """Devolve (id, nome) de quem fez a ação, lido do token de acesso."""
    if request is None:
        return None, 'Sistema'
    try:
        uid = request.auth.get('user_id') if request.auth else None
    except Exception:
        uid = None
    if not uid:
        return None, 'Sistema'
    from accounts.models import User
    usuario = User.objects.filter(pk=uid).first()
    return (usuario.id, usuario.nome) if usuario else (None, 'Usuário')


def registrar(cliente_id, tipo, descricao, agendamento_id=None, usuario_id=None,
              usuario_nome='Sistema', detalhes=None):
    if not cliente_id:
        return
    EventoHistorico.objects.create(
        cliente_id=cliente_id,
        agendamento_id=agendamento_id,
        tipo=tipo,
        descricao=descricao[:255],
        usuario_id=usuario_id,
        usuario_nome=(usuario_nome or 'Sistema')[:150],
        detalhes=detalhes or {},
    )


def snapshot(ag):
    """Foto do agendamento antes da alteração, para comparar depois."""
    return {
        'status': ag.status,
        'profissional': ag.profissional.nome if ag.profissional_id else None,
        'data_hora': ag.data_hora,
        'observacoes': ag.observacoes or '',
        'itens': {
            i.item_catalogo_id: {
                'nome': i.item_catalogo.nome,
                'tipo': i.item_catalogo.tipo,
                'qtd': i.quantidade,
                'preco': i.preco_unitario,
            }
            for i in ag.itens.select_related('item_catalogo')
        },
    }


def _registrar_item(ag, tipo_evento, tipo_item, nome, qtd, preco, usuario_id, usuario_nome):
    verbo = {'item_adicionado': 'adicionado', 'item_removido': 'removido', 'item_alterado': 'alterado'}[tipo_evento]
    registrar(
        ag.cliente_id, tipo_evento,
        f'{_label_item(tipo_item)} "{nome}" {verbo} (qtd {qtd}, {_money(preco)}) — agendamento #{ag.id}',
        agendamento_id=ag.id, usuario_id=usuario_id, usuario_nome=usuario_nome,
        detalhes={'item': nome, 'tipo_item': tipo_item, 'quantidade': qtd, 'preco': str(preco)},
    )


def registrar_criacao(ag, usuario_id=None, usuario_nome='Sistema'):
    prof = ag.profissional.nome if ag.profissional_id else 'sem profissional'
    registrar(
        ag.cliente_id, 'agendamento_criado',
        f'Agendamento #{ag.id} criado para {_dt(ag.data_hora)} com {prof} '
        f'({STATUS_LABEL.get(ag.status, ag.status)})',
        agendamento_id=ag.id, usuario_id=usuario_id, usuario_nome=usuario_nome,
    )
    for item in ag.itens.select_related('item_catalogo'):
        _registrar_item(ag, 'item_adicionado', item.item_catalogo.tipo, item.item_catalogo.nome,
                        item.quantidade, item.preco_unitario, usuario_id, usuario_nome)


def registrar_alteracoes(antes, ag, usuario_id=None, usuario_nome='Sistema'):
    depois = snapshot(ag)

    def ev(tipo, desc):
        registrar(ag.cliente_id, tipo, f'{desc} — agendamento #{ag.id}',
                  agendamento_id=ag.id, usuario_id=usuario_id, usuario_nome=usuario_nome)

    if antes['status'] != depois['status']:
        ev('status_alterado',
           f"Status: {STATUS_LABEL.get(antes['status'], antes['status'])} → "
           f"{STATUS_LABEL.get(depois['status'], depois['status'])}")
    if antes['profissional'] != depois['profissional']:
        ev('profissional_alterado',
           f"Profissional: {antes['profissional'] or 'sem profissional'} → "
           f"{depois['profissional'] or 'sem profissional'}")
    if antes['data_hora'] != depois['data_hora']:
        ev('data_alterada', f"Horário: {_dt(antes['data_hora'])} → {_dt(depois['data_hora'])}")
    if antes['observacoes'] != depois['observacoes']:
        ev('observacao_alterada', 'Observações alteradas')

    for iid, d in depois['itens'].items():
        if iid not in antes['itens']:
            _registrar_item(ag, 'item_adicionado', d['tipo'], d['nome'], d['qtd'], d['preco'],
                            usuario_id, usuario_nome)
        else:
            a = antes['itens'][iid]
            if a['qtd'] != d['qtd'] or a['preco'] != d['preco']:
                _registrar_item(ag, 'item_alterado', d['tipo'], d['nome'], d['qtd'], d['preco'],
                                usuario_id, usuario_nome)
    for iid, a in antes['itens'].items():
        if iid not in depois['itens']:
            _registrar_item(ag, 'item_removido', a['tipo'], a['nome'], a['qtd'], a['preco'],
                            usuario_id, usuario_nome)


def registrar_exclusao(ag, usuario_id=None, usuario_nome='Sistema'):
    registrar(ag.cliente_id, 'agendamento_excluido',
              f'Agendamento #{ag.id} de {_dt(ag.data_hora)} excluído',
              agendamento_id=ag.id, usuario_id=usuario_id, usuario_nome=usuario_nome)
    for item in ag.itens.select_related('item_catalogo'):
        _registrar_item(ag, 'item_removido', item.item_catalogo.tipo, item.item_catalogo.nome,
                        item.quantidade, item.preco_unitario, usuario_id, usuario_nome)


def registrar_status(ag, status_antes, usuario_nome='Sistema'):
    if status_antes != ag.status:
        registrar(
            ag.cliente_id, 'status_alterado',
            f"Status: {STATUS_LABEL.get(status_antes, status_antes)} → "
            f"{STATUS_LABEL.get(ag.status, ag.status)} — agendamento #{ag.id}",
            agendamento_id=ag.id, usuario_nome=usuario_nome,
        )
