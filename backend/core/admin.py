from django.contrib import admin
from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('nome_fantasia', 'cnpj_cpf', 'tipo_negocio', 'plano', 'is_active', 'created_at')
    search_fields = ('cnpj_cpf', 'razao_social', 'nome_fantasia')
    list_filter = ('tipo_negocio', 'plano', 'is_active')
