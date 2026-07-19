"""
ADMSTUDIO - Configurações principais do projeto Django
Arquitetura multi-tenant: 1 banco central (tenants) + 1 banco MySQL por assinante
"""
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret-key-troque-em-producao')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=Csv())

# Domínios com permissão para enviar formulários (proteção CSRF do Django).
# Precisa ser a URL COMPLETA, com https://, sem caminho no final.
# Ex: CSRF_TRUSTED_ORIGINS=https://plataformas-admstudio.sqkz99.easypanel.host,https://admstudio.seudominio.com
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    'core',            # tenants / assinantes (banco central)
    'authentication',  # login, JWT, roteamento multi-tenant
    'accounts',        # usuários e perfis de acesso (por tenant)
    'dashboard',       # dados do dashboard (por tenant)
    'clientes',        # módulo de clientes/cadastros (por tenant)
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Middleware customizado: identifica o tenant da requisição a partir do JWT
    'authentication.middleware.TenantMiddleware',
]

ROOT_URLCONF = 'config.urls'

# Pasta onde o build do React é copiado dentro da imagem Docker (deploy em serviço único)
FRONTEND_BUILD_DIR = BASE_DIR / 'frontend_build'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_BUILD_DIR],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# -----------------------------------------------------------------
# BANCOS DE DADOS
# 'default' = banco central, onde fica a tabela de Tenants (assinantes)
# Os bancos de cada cliente são registrados dinamicamente em runtime
# (veja authentication/utils.py e authentication/db_router.py)
# -----------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        # Os defaults abaixo só existem para permitir que o Django carregue
        # as configurações durante o BUILD da imagem Docker (ex: comando
        # collectstatic, que não precisa de conexão real com o banco).
        # Em runtime, o EasyPanel injeta os valores reais via variáveis de
        # ambiente — sempre configure-as lá.
        'NAME': config('DB_CENTRAL_NAME', default='admstudio_central'),
        'USER': config('DB_CENTRAL_USER', default='root'),
        'PASSWORD': config('DB_CENTRAL_PASSWORD', default=''),
        'HOST': config('DB_CENTRAL_HOST', default='localhost'),
        'PORT': config('DB_CENTRAL_PORT', default='3306'),
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}

DATABASE_ROUTERS = ['authentication.db_router.TenantDatabaseRouter']

# IMPORTANTE: NÃO definimos AUTH_USER_MODEL aqui.
# O Django usa o modelo padrão dele (auth.User) no banco CENTRAL, exclusivamente
# para você acessar o /admin/ e gerenciar os assinantes (Tenants).
# O modelo accounts.User (definido no app "accounts") é o usuário de cada
# TENANT, e vive nos bancos dos clientes — nosso fluxo de login (LoginView)
# valida esse usuário manualmente, sem depender do AUTH_USER_MODEL do Django.

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [FRONTEND_BUILD_DIR / 'static'] if (FRONTEND_BUILD_DIR / 'static').exists() else []
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# -----------------------------------------------------------------
# LOGGING: garante que erros apareçam nos logs do container (Docker/
# EasyPanel) mesmo com DEBUG=False. Por padrão, o Django só imprime
# erros no console quando DEBUG=True — sem isso, os erros em produção
# ficariam invisíveis (só tentam ser enviados por e-mail, que não está
# configurado).
# -----------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
