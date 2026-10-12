"""
Lista central dos itens padrão do menu lateral. Ao criar um módulo novo com
tela própria, adicione aqui. Use sync_default_menu para propagar aos tenants.
"""

DEFAULT_MENU_ITEMS = [
    {'rota': '/dashboard', 'label': 'Dashboard', 'icone': 'bi-speedometer2', 'ordem': 1, 'nivel_minimo': 1},
    {'rota': '/clientes', 'label': 'Clientes', 'icone': 'bi-people', 'ordem': 2, 'nivel_minimo': 1},
    {'rota': '/agendamentos', 'label': 'Agendamentos', 'icone': 'bi-calendar-check', 'ordem': 3, 'nivel_minimo': 1},
    {'rota': '/atendimento', 'label': 'Atendimento', 'icone': 'bi-play-circle', 'ordem': 4, 'nivel_minimo': 1},
    {'rota': '/servicos-produtos', 'label': 'Serviços e Produtos', 'icone': 'bi-bag-check', 'ordem': 5, 'nivel_minimo': 1},
    {'rota': '/caixa', 'label': 'Caixa', 'icone': 'bi-cash-stack', 'ordem': 6, 'nivel_minimo': 2},
    {'rota': '/gestao', 'label': 'Gestão', 'icone': 'bi-briefcase-fill', 'ordem': 7, 'nivel_minimo': 7},
    {'rota': '/configuracoes', 'label': 'Configurações', 'icone': 'bi-gear-fill', 'ordem': 8, 'nivel_minimo': 10},
]
