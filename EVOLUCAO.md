# ADMSTUDIO — Roadmap de Evolução para Comercialização

Checklist de evolução do sistema, organizado por fases de prioridade.
Marque `[x]` conforme cada item for concluído. Pode ser commitado no
repositório (ex: `EVOLUCAO.md` na raiz) para ficar versionado junto do
código.

---

## Fase 1 — Fechar o que já foi iniciado

Itens que já têm base pronta (card, campo ou rota), mas ainda não têm
funcionalidade real por trás.

- [ ] **Usuários e Perfis de Acesso** — tela real (hoje é só card em
      Gestão): listar/criar/editar usuários do tenant, atribuir Role,
      ativar/desativar acesso
- [ ] **Controle de estoque** — entrada e saída de produtos do catálogo,
      histórico de movimentação, alerta de estoque baixo (o campo
      `controla_estoque` já existe no model, falta a lógica)

## Fase 2 — Essenciais de mercado

Recursos que a maioria dos concorrentes diretos (Trinks, Booksy, Salon
Line, GestãoDS) já oferece — importantes para não perder venda por
comparação direta.

- [ ] **Agenda visual** — calendário por profissional/dia/semana (hoje o
      Agendamento é uma lista filtrada por data)
- [ ] **Agendamento online para o cliente** — link público onde o
      cliente escolhe serviço, profissional e horário sozinho
- [ ] **Notificações via WhatsApp** — lembrete automático de
      agendamento, redução de falta (no-show)

## Fase 3 — Diferenciais competitivos

Recursos que ajudam a vender "mais" que o básico, especialmente para
clínicas de estética.

- [ ] **Prontuário do cliente** — histórico de atendimentos, fotos
      antes/depois, anamnese, observações por sessão
- [ ] **Pacotes e planos** — venda de pacotes de sessões (ex: "10x
      depilação") e assinaturas recorrentes de clientes
- [ ] **Programa de fidelidade / cashback**
- [ ] **Suporte multi-unidade nas telas operacionais** — seletor de
      unidade em Agendamentos, Clientes, Financeiro (hoje o cadastro de
      unidades existe em Configurações, mas as outras telas ainda não
      filtram por unidade)

## Fase 4 — Preparação para comercializar de verdade

Não são módulos do sistema em si, mas processos/infra necessários para
vender e operar o ADMSTUDIO como produto.

- [ ] **Cadastro de assinante self-service** — formulário público de
      inscrição (hoje o provisionamento é manual, via comando)
- [ ] **Cobrança automática** (Stripe / Mercado Pago / Asaas) —
      integrar com o status "Em Análise → Ativo" das unidades
- [ ] **LGPD** — exportação e exclusão de dados do titular mediante
      solicitação
- [ ] **Termos de Uso e Política de Privacidade**
- [ ] **Central de ajuda / onboarding guiado** para novos assinantes

---

## Notas

- Cada item, quando desenvolvido, deve seguir o mesmo padrão já
  estabelecido: model + migration versionada + serializer + view + rota
  no `App.js` + item de menu (quando aplicável) + `migrate_all_tenants` /
  `sync_default_menu` para propagar aos tenants existentes.
- Prioridade sugerida dentro da Fase 2: Agenda visual → Agendamento
  online → Notificações WhatsApp (cada um depende conceitualmente do
  anterior).
