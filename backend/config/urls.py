import re

from django.conf import settings
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView

urlpatterns = [
    path(f'{settings.ADMIN_URL_PATH}/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/clientes/', include('clientes.urls')),
    path('api/profissionais/', include('profissionais.urls')),
    path('api/catalogo/', include('catalogo.urls')),
    path('api/agendamentos/', include('agendamentos.urls')),
    path('api/financeiro/', include('financeiro.urls')),
    path('api/negocio/', include('negocio.urls')),
    path('api/estoque/', include('estoque.urls')),
    path('api/publico/', include('publico.urls')),
    path('api/usuarios/', include('accounts.urls')),
    path('api/integracoes/', include('integracoes.urls')),
    path('api/prontuario/', include('prontuario.urls')),
    path('api/historico/', include('historico.urls')),

    # Serve o React (SPA) para qualquer rota que não seja /api/ ou /admin/.
    # O próprio React Router cuida do roteamento no navegador a partir daqui.
    re_path(
        r'^(?!api/|static/|' + re.escape(settings.ADMIN_URL_PATH) + r'/).*$',
        TemplateView.as_view(template_name='index.html'),
        name='frontend',
    ),
]
