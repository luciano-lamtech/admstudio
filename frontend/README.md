# ADMSTUDIO - Frontend (React + Bootstrap)

Interface do sistema ADMSTUDIO: login multi-tenant, dashboard e menu lateral
dinâmico conforme o nível de acesso do usuário.

## Setup local

```bash
npm install
cp .env.example .env   # aponte REACT_APP_API_URL para o backend
npm start
```

## Como funciona
- **Login** (`/login`): envia `email`, `senha` e `id` (CPF/CNPJ do assinante)
  para `POST /api/auth/login/`. A API retorna o token JWT, os dados do
  usuário, do tenant e o **menu já filtrado pelo nível de acesso**.
- Tudo é guardado no `localStorage` e disponibilizado via `AuthContext`.
- `PrivateRoute` protege as rotas internas e envolve as páginas no `Layout`
  (Sidebar + Header).
- `Sidebar` renderiza dinamicamente os itens de menu vindos do backend —
  ou seja, **para adicionar um novo módulo ao menu, basta cadastrar um novo
  `MenuItem` no backend**, sem precisar alterar o código do frontend.
- Todas as chamadas à API passam pelo `axiosClient`, que já injeta o token
  JWT automaticamente e desloga o usuário se o token expirar (401).

## Deploy (GitHub + EasyPanel)

Este frontend faz parte do monorepo `admstudio`. O `Dockerfile` que builda
tudo (frontend + backend, servidos juntos pelo Django) fica na **raiz do
monorepo**, não aqui dentro. Veja o `README.md` na raiz do repositório para
as instruções completas de deploy.

## Módulos já implementados
- [x] Tela de Login (email + senha + CPF/CNPJ)
- [x] Layout com Sidebar + Header
- [x] Dashboard com cards de indicadores
- [x] Clientes e Cadastros (listagem, criação, edição e exclusão)

## Próximos módulos sugeridos
- [ ] Agendamentos/Agenda
- [ ] Financeiro/Caixa
- [ ] Gestão de Usuários e Perfis de Acesso (tela administrativa)
