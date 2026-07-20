# ADMSTUDIO - Backend (Django REST Framework)

Sistema de gestão para salões de beleza, barbearias e clínicas de estética.
Arquitetura **multi-tenant por banco de dados separado**: cada assinante
(identificado por CPF/CNPJ) possui seu próprio banco MySQL.

## Como funciona o multi-tenant

- **Banco central** (`default`): contém apenas a tabela `tenants` (app `core`),
  com o CPF/CNPJ de cada assinante e as credenciais do banco MySQL dele.
- **Banco de cada tenant**: contém as tabelas de negócio (`usuarios`, `roles`,
  `menu_items`, `clientes`, e futuros módulos).
- No **login**, o usuário informa `email`, `senha` e `id` (CPF/CNPJ). O backend:
  1. Busca o tenant pelo CPF/CNPJ no banco central.
  2. Abre uma conexão dinâmica com o MySQL daquele tenant.
  3. Autentica o usuário dentro do banco do tenant.
  4. Gera um JWT contendo o alias do banco do tenant.
- Nas requisições seguintes, o `TenantMiddleware` lê esse alias do token e o
  `TenantDatabaseRouter` direciona automaticamente todas as queries dos apps
  de negócio para o banco correto — sem precisar passar `.using()` manualmente
  nas views.

## Setup local

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha com as credenciais do banco central
python manage.py migrate                # cria a tabela "tenants" no banco central
python manage.py createsuperuser        # para acessar /admin e cadastrar tenants
python manage.py runserver
```

## Cadastrando um novo assinante (tenant)

Use o comando `provision_tenant`, que já faz tudo de uma vez: cria o
registro do tenant, roda as migrações no banco dele, cria os perfis de
acesso (Roles), o menu lateral padrão e o primeiro usuário administrador.

```bash
python manage.py provision_tenant \
  --cnpj_cpf "12.345.678/0001-90" \
  --razao_social "Salão Bella Vitta LTDA" \
  --nome_fantasia "Bella Vitta" \
  --tipo_negocio salao \
  --db_name admstudio_bellavitta \
  --db_host meu-mysql-na-nuvem.com \
  --db_user usuario_mysql \
  --db_password senha_mysql \
  --admin_email admin@bellavitta.com \
  --admin_senha "SenhaForte123!" \
  --admin_nome "Maria Administradora"
```

> O banco MySQL do tenant (`admstudio_bellavitta` no exemplo) precisa já
> existir/estar criado na nuvem antes de rodar o comando — o Django cria as
> tabelas dentro dele, mas não cria o banco em si.

## Checklist completo: do zero até o sistema no ar

1. **Criar o banco MySQL central** na nuvem (ex: `admstudio_central`) e
   preencher o `.env` com as credenciais dele.
2. **Rodar as migrações do banco central** (as migrações já vêm prontas no
   repositório, não precisa rodar `makemigrations`):
   ```bash
   python manage.py migrate          # cria a tabela "tenants"
   python manage.py createsuperuser  # acesso ao /admin/
   ```
3. **Criar um banco MySQL para o primeiro cliente** (tenant) na nuvem.
4. **Provisionar esse tenant** com o comando `provision_tenant` acima.
6. **Testar localmente**: `python manage.py runserver` + rodar o frontend
   (`npm start` no repo `admstudio-frontend`) e logar com o email/senha/CNPJ
   criados no passo 5.
7. **Subir os dois repositórios no GitHub** (backend e frontend).
8. **Criar o App no EasyPanel** apontando para o repo `admstudio-backend`
   (ver seção "Deploy" acima), configurando os Build Args
   (`FRONTEND_REPO_URL`, `FRONTEND_REPO_BRANCH`) e as variáveis de ambiente
   do banco central.
9. **Após o deploy**, rodar via terminal do EasyPanel:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py provision_tenant --cnpj_cpf ... (mesmos dados do passo 5, ou um novo cliente)
   ```
10. **Acessar o domínio configurado** e testar o login de verdade em produção.

## Deploy (GitHub + EasyPanel) — SERVIÇO ÚNICO

Este backend faz parte do monorepo `admstudio`. O `Dockerfile` que builda
tudo (backend + frontend, servidos juntos pelo Django) fica na **raiz do
monorepo**, não aqui dentro. Veja o `README.md` na raiz do repositório para
as instruções completas de deploy.

## Fluxo de trabalho: evoluindo o sistema (novos campos, tabelas, módulos)

Sempre que você alterar um model de um app de **tenant** (`accounts`,
`clientes`, ou um módulo novo que criarmos, tipo `agendamentos`), siga
estes passos:

1. **Altere o `models.py`** do app (novo campo, novo model, etc.)
2. **Gere a migração** (pode ser localmente, se tiver Python/Django
   instalado, ou pelo Console do EasyPanel, mas **sempre baixe e
   `git commit` o arquivo gerado** em `<app>/migrations/`, senão ele se
   perde no próximo deploy):
   ```bash
   python manage.py makemigrations accounts clientes
   ```
3. **Suba pro GitHub e implante** no EasyPanel normalmente.
4. **Aplique a migração em TODOS os assinantes já existentes**, com o
   comando feito especialmente pra isso:
   ```bash
   python manage.py migrate_all_tenants
   ```
   Ele percorre a lista de tenants cadastrados no banco central e aplica
   as migrações pendentes no banco de cada um, automaticamente.

   Se você criou um **módulo novo** (novo app, tipo `agendamentos`),
   inclua-o explicitamente:
   ```bash
   python manage.py migrate_all_tenants --apps accounts clientes agendamentos
   ```

5. **Tenants criados depois** (via `provision_tenant`) já recebem
   automaticamente TODAS as migrações existentes até aquele momento —
   não precisa fazer nada extra para eles.

> Alterações no app `core` (que fica só no banco central, ex: mudar o
> model `Tenant`) seguem o fluxo normal do Django: `makemigrations core`
> e depois só `migrate` (sem precisar do `migrate_all_tenants`, que é
> exclusivo para os apps de tenant).
- [x] Autenticação multi-tenant (login por email + senha + CPF/CNPJ)
- [x] Usuários e níveis de acesso (Role)
- [x] Menu lateral dinâmico por nível de acesso
- [x] Dashboard (endpoint resumo)
- [x] Clientes e Cadastros (CRUD completo)

## Próximos módulos sugeridos
- [ ] Agendamentos/Agenda
- [ ] Financeiro/Caixa
- [ ] Profissionais e Comissões
- [ ] Provisionamento automático de novo tenant
