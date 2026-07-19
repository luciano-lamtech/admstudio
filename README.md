# ADMSTUDIO

Sistema de gestão para salões de beleza, barbearias e clínicas de estética.
Monorepo contendo o backend (Django REST Framework, multi-tenant por
banco de dados) em `backend/` e o frontend (React + Bootstrap) em `frontend/`.

Deploy como **serviço único**: o `Dockerfile` na raiz builda o frontend e
o backend juntos, com o Django servindo o build do React (via WhiteNoise) e
a API sob `/api/`.

- Documentação detalhada do backend: [`backend/README.md`](backend/README.md)
- Documentação detalhada do frontend: [`frontend/README.md`](frontend/README.md)

## Rodando localmente

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencher com credenciais do banco central
python manage.py makemigrations core accounts dashboard clientes
python manage.py migrate
python manage.py runserver

# Frontend (outro terminal)
cd frontend
npm install
cp .env.example .env   # REACT_APP_API_URL=http://localhost:8000/api
npm start
```

## Deploy no EasyPanel (serviço único)

1. Suba este repositório (monorepo) no GitHub.
2. No EasyPanel, crie um **App** apontando para este repositório — o
   `Dockerfile` da raiz já builda tudo junto.
3. Configure as variáveis de ambiente de runtime (as do `.env.example` do
   backend) no painel do EasyPanel.
4. Exponha a porta `8000` e configure o domínio.
5. Após o primeiro deploy, no terminal do EasyPanel:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py provision_tenant --cnpj_cpf "..." --razao_social "..." ...
   ```
