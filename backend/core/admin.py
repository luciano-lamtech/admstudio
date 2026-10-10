from django.contrib import admin
from .models import Tenant, RoadmapItem, InstanciaWhatsApp

admin.site.site_header = 'ADMSTUDIO - Administração'
admin.site.site_title = 'ADMSTUDIO'
admin.site.index_title = 'Painel de Administração Central'


@admin.register(InstanciaWhatsApp)
class InstanciaWhatsAppAdmin(admin.ModelAdmin):
    list_display = ('nome', 'nome_instancia', 'numero', 'intervalo_segundos', 'ativo', 'total_assinantes')
    list_editable = ('ativo',)
    search_fields = ('nome', 'nome_instancia', 'numero')

    def total_assinantes(self, obj):
        return obj.assinantes.count()
    total_assinantes.short_description = 'Assinantes vinculados'


@admin.action(description='Gerar NOVO token de integração (invalida o anterior)')
def gerar_novo_token(modeladmin, request, queryset):
    for tenant in queryset:
        tenant.gerar_novo_token()
        tenant.save(update_fields=['token_integracao'])
    modeladmin.message_user(request, f'{queryset.count()} token(s) regenerado(s).')


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('nome_fantasia', 'cnpj_cpf', 'is_active', 'instancia_whatsapp')
    search_fields = ('cnpj_cpf', 'razao_social', 'nome_fantasia')
    list_filter = ('tipo_negocio', 'plano', 'is_active')
    list_select_related = ('instancia_whatsapp',)
    readonly_fields = ('token_integracao',)
    actions = [gerar_novo_token]
    fieldsets = (
        ('Dados do assinante', {
            'fields': ('cnpj_cpf', 'razao_social', 'nome_fantasia', 'tipo_negocio', 'plano', 'is_active'),
        }),
        ('Banco de dados do assinante', {
            'fields': ('db_name', 'db_host', 'db_port', 'db_user', 'db_password'),
        }),
        ('WhatsApp / Integração (n8n)', {
            'fields': ('instancia_whatsapp', 'token_integracao'),
            'description': 'O token é usado pelo n8n para acessar a integração deste assinante.',
        }),
    )


@admin.register(RoadmapItem)
class RoadmapItemAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fase', 'concluido', 'ordem')
    list_editable = ('concluido',)  # marca direto na listagem, sem abrir o registro
    list_filter = ('fase', 'concluido')
    search_fields = ('titulo', 'descricao')
    ordering = ('fase', 'ordem')
