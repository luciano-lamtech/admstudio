from .middleware import get_current_tenant_alias

# Apps cujos modelos moram no banco de CADA TENANT (não no central)
TENANT_APPS = {'accounts', 'dashboard', 'clientes', 'catalogo', 'agendamentos'}

# Apps que moram sempre no banco central
CENTRAL_APPS = {'core', 'admin', 'auth', 'contenttypes', 'sessions'}


class TenantDatabaseRouter:
    """
    Direciona automaticamente cada query para o banco correto:
    - apps de negócio (accounts, dashboard, clientes...) -> banco do tenant atual
    - apps centrais (core, admin, auth...) -> banco 'default'
    """

    def db_for_read(self, model, **hints):
        return self._resolve(model)

    def db_for_write(self, model, **hints):
        return self._resolve(model)

    def _resolve(self, model):
        app_label = model._meta.app_label
        if app_label in TENANT_APPS:
            alias = get_current_tenant_alias()
            return alias or 'default'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Migrações de apps de tenant devem ser rodadas manualmente
        # apontando o alias do tenant (veja README - comando migrate_tenant)
        if app_label in TENANT_APPS:
            return db != 'default'
        return db == 'default'
