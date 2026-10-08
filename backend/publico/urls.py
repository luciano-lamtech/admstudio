from django.urls import path
from .views import (
    InfoPublicoView, ServicosPublicosView, ProfissionaisPublicosView,
    HorariosDisponiveisView, AgendarPublicoView, ConsultarPublicoView, CancelarPublicoView,
)

urlpatterns = [
    path('<str:cnpj>/info/', InfoPublicoView.as_view()),
    path('<str:cnpj>/servicos/', ServicosPublicosView.as_view()),
    path('<str:cnpj>/profissionais/', ProfissionaisPublicosView.as_view()),
    path('<str:cnpj>/horarios/', HorariosDisponiveisView.as_view()),
    path('<str:cnpj>/agendar/', AgendarPublicoView.as_view()),
    path('<str:cnpj>/consultar/', ConsultarPublicoView.as_view()),
    path('<str:cnpj>/cancelar/', CancelarPublicoView.as_view()),
]
