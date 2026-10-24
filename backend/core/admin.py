from io import StringIO

from django.contrib import admin, messages
from django.core.management import call_command
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
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
    change_form_template = 'admin/core/tenant/change_form.html'

    list_display = ('nome_fantasia', 'cnpj_cpf', 'is_active', 'instancia_whatsapp')
    search_fields = ('cnpj_cpf', 'razao_social', 'nome_fantasia')
    list_filter = ('tipo_negocio', 'plano', 'is_active')
    list_select_related = ('instancia_whatsapp',)
    readonly_fields = ('token_integracao',)
    actions = [gerar_novo_token]

    def get_urls(self):
        urls = super().get_urls()
        extra = [
            path('<int:pk>/provisionar/',
                 self.admin_site.admin_view(self.provisionar_view),
                 name='core_tenant_provisionar'),
        ]
        return extra + urls

    def provisionar_view(self, request, pk):
        tenant = get_object_or_404(Tenant, pk=pk)
        if request.method == 'POST':
            email = (request.POST.get('admin_email') or '').strip().lower()
            senha = request.POST.get('admin_senha') or ''
            nome = (request.POST.get('admin_nome') or 'Administrador').strip()
            if not email or not senha:
                messages.error(request, 'Informe o e-mail e a senha do administrador.')
            else:
                saida = StringIO()
                try:
                    call_command(
                        'provision_tenant',
                        cnpj_cpf=tenant.cnpj_cpf,
                        razao_social=tenant.razao_social,
                        nome_fantasia=tenant.nome_fantasia or '',
                        tipo_negocio=tenant.tipo_negocio,
                        db_name=tenant.db_name,
                        db_host=tenant.db_host,
                        db_port=tenant.db_port,
                        db_user=tenant.db_user,
                        db_password=tenant.db_password,
                        admin_email=email,
                        admin_senha=senha,
                        admin_nome=nome,
                        stdout=saida,
                        stderr=saida,
                    )
                    messages.success(request, f'Assinante provisionado. Acesso: {email}')
                except Exception as exc:
                    messages.error(request, f'Falha ao provisionar: {exc}')
                resumo = saida.getvalue().strip().splitlines()
                for linha in resumo[-6:]:
                    messages.info(request, linha)
            return redirect(reverse('admin:core_tenant_change', args=[pk]))

        contexto = dict(
            self.admin_site.each_context(request),
            tenant=tenant,
            title='Provisionar assinante',
            opts=self.model._meta,
        )
        return render(request, 'admin/core/tenant/provisionar.html', contexto)
    fieldsets = (
        ('Dados do assinante', {
            'fields': ('cnpj_cpf', 'razao_social', 'nome_fantasia', 'tipo_negocio', 'plano', 'is_active',
                       'nome_responsavel', 'email_responsavel', 'telefone_responsavel', 'aceite_termos_em'),
        }),
        ('Banco de dados do assinante', {
            'fields': ('usa_servidor_central', 'db_name', 'db_host', 'db_port', 'db_user', 'db_password'),
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
