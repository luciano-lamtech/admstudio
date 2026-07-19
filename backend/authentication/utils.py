from django.db import connections


def register_tenant_connection(tenant):
    """
    Registra dinamicamente, em tempo de execução, a conexão MySQL do
    banco de dados exclusivo do tenant (assinante) informado.
    Retorna o alias da conexão a ser usado nas queries (.using(alias)).
    """
    alias = tenant.alias

    if alias not in connections.databases:
        connections.databases[alias] = {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': tenant.db_name,
            'USER': tenant.db_user,
            'PASSWORD': tenant.db_password,
            'HOST': tenant.db_host,
            'PORT': tenant.db_port,
            'OPTIONS': {'charset': 'utf8mb4'},
            'ATOMIC_REQUESTS': False,
            'AUTOCOMMIT': True,
            'CONN_MAX_AGE': 0,
            'CONN_HEALTH_CHECKS': False,
            'TIME_ZONE': None,
        }

    return alias
