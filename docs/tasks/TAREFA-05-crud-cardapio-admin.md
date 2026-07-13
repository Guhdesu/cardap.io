# TAREFA-05 — CRUD de Cardápio para o Administrador

> **Prioridade:** 🟡 Média  
> **User Story:** US-05  
> **Estimativa:** 5–8 pontos  
> **Dependências:** TAREFA-01 (autenticação do staff com `role: 'admin'`).

---

## Contexto

Atualmente o cardápio é gerenciado exclusivamente via seed SQL no arquivo `schema.sql`. Para uso em produção real, o dono do estabelecimento precisa poder adicionar novos pratos, atualizar preços e marcar itens como esgotados sem precisar de acesso técnico ao banco.

Segundo a documentação, esta funcionalidade é restrita ao `role: 'admin'` — funcionários regulares podem operar o painel de comandas, mas não alterar o cardápio.

---

## Objetivo

Criar uma interface administrativa para gerenciar o cardápio em tempo real, acessível apenas a administradores autenticados.

---

## Escopo

### Backend

- [ ] **Rota `GET /admin/cardapio`** (requer `requireRole('admin')`): Lista todos os itens, incluindo os indisponíveis (diferente da rota pública que filtra `disponivel = true`).
- [ ] **Rota `POST /admin/cardapio`**: Cria novo item. Campos: `nome`, `descricao`, `preco`, `categoria`, `imagem_url` (opcional), `disponivel` (default `true`).
- [ ] **Rota `PUT /admin/cardapio/:id`**: Atualiza qualquer campo de um item existente individualmente.
- [ ] **Rota `PATCH /admin/cardapio/:id/disponibilidade`**: Toggle rápido de `disponivel` (true/false) sem precisar enviar todos os campos.
- [ ] **Rota `DELETE /admin/cardapio/:id`**: Remove o item. Verificar se o item foi pedido em alguma comanda (`pedido_itens.item_id`); se sim, **não deletar** — apenas marcar como indisponível e retornar aviso.
- [ ] Validação de campos: `preco > 0`, `nome` obrigatório, `categoria` obrigatória.
- [ ] **WebSocket**: Ao alterar disponibilidade de um item, emitir evento `cardapio_atualizado` para todos os clientes conectados (para atualização reativa do cardápio em tempo real).

### Frontend — Admin Panel (`/staff/admin/cardapio`)

- [ ] Nova aba "Gerenciar Cardápio" no painel do staff (visível apenas para `role: 'admin'`).
- [ ] **Listagem de itens**: Tabela/grid com todos os itens, incluindo os indisponíveis. Colunas: nome, categoria, preço, disponível (toggle), ações (editar, excluir).
- [ ] **Toggle de disponibilidade**: Switch/checkbox inline na listagem para marcar item como esgotado sem abrir formulário.
- [ ] **Formulário de criação/edição** (modal ou página dedicada):
  - Campos: nome, descrição, preço, categoria (select com opções existentes + campo livre), URL da imagem.
  - Preview da imagem ao inserir URL.
  - Validação de campos obrigatórios no frontend antes do submit.
- [ ] **Confirmação de exclusão**: Modal de confirmação antes de deletar. Se o backend retornar aviso de item com histórico, exibir ao admin com opção "Apenas marcar como indisponível".
- [ ] Filtros por categoria e por status (disponível/indisponível).

### Frontend — Cliente (reativo)

- [ ] Ao receber evento WebSocket `cardapio_atualizado`, recarregar os dados do cardápio ou atualizar o item específico no estado local.
- [ ] Item marcado como indisponível: botão "Adicionar" desabilitado + badge "Esgotado" visível.

---

## Critérios de Aceitação

1. Admin cria um novo item → ele aparece imediatamente no cardápio público.
2. Admin marca item como indisponível → clientes veem o badge "Esgotado" em tempo real (sem recarregar).
3. Admin edita o preço de um item → próximos pedidos usam o novo preço.
4. Admin tenta deletar item com histórico de pedidos → sistema recusa e oferece "marcar como indisponível".
5. Funcionário (não admin) não enxerga a aba "Gerenciar Cardápio".

---

## Notas de Implementação

- A atualização de preço **não** deve retroativamente alterar pedidos já realizados (snapshot de preço em `pedido_itens.item_nome` e `preco_unitario` — cf. decisão 5 e 6 em `docs/decisoes-modelagem.md`).
- Considerar adicionar a coluna `preco_unitario` em `pedido_itens` se ainda não existir, para registrar o snapshot correto.
- A listagem de categorias pode ser dinâmica (extraída do próprio banco: `SELECT DISTINCT categoria FROM cardapio_itens`) para não depender de uma lista hardcoded.
