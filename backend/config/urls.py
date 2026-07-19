from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/clientes/', include('clientes.urls')),

    # Serve o React (SPA) para qualquer rota que não seja /api/ ou /admin/.
    # O próprio React Router cuida do roteamento no navegador a partir daqui.
    re_path(
        r'^(?!api/|admin/|static/).*$',
        TemplateView.as_view(template_name='index.html'),
        name='frontend',
    ),
]
