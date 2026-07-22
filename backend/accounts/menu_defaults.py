"""
Lista central dos itens padrão do menu lateral. Toda vez que criarmos um
módulo novo com tela própria, adicionamos ele aqui — e ele passa a ser
criado automaticamente tanto em tenants novos (via provision_tenant)
quanto propagado para os já existentes (via sync_default_menu).
"""

DEFAULT_MENU_ITEMS = [
    {'rota': '/dashboard', 'label': 'Dashboard', 'icone': 'bi-speedometer2', 'ordem': 1, 'nivel_minimo': 1},
    {'rota': '/clientes', 'label': 'Clientes', 'icone': 'bi-people', 'ordem': 2, 'nivel_minimo': 1},
    {'rota': '/servicos-produtos', 'label': 'Serviços e Produtos', 'icone': 'bi-bag-check', 'ordem': 3, 'nivel_minimo': 1},
]
