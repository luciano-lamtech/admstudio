from django.contrib import admin
from .models import Tenant, RoadmapItem

admin.site.site_header = 'ADMSTUDIO - Administração'
admin.site.site_title = 'ADMSTUDIO'
admin.site.index_title = 'Painel de Administração Central'


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('nome_fantasia', 'cnpj_cpf', 'tipo_negocio', 'plano', 'is_active', 'created_at')
    search_fields = ('cnpj_cpf', 'razao_social', 'nome_fantasia')
    list_filter = ('tipo_negocio', 'plano', 'is_active')


@admin.register(RoadmapItem)
class RoadmapItemAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fase', 'concluido', 'ordem')
    list_editable = ('concluido',)  # marca direto na listagem, sem abrir o registro
    list_filter = ('fase', 'concluido')
    search_fields = ('titulo', 'descricao')
    ordering = ('fase', 'ordem')
