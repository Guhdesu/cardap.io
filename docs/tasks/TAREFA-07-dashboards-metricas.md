# TAREFA-07 — Dashboards e Métricas de Negócio (BI)

> **Prioridade:** 🟢 Baixa  
> **User Story:** Sem US direta (melhoria de produto)  
> **Estimativa:** 8–13 pontos  
> **Dependências:** TAREFA-01, TAREFA-04 (precisam de dados reais acumulados para fazer sentido).

---

## Contexto

Com o sistema operacional e acumulando dados de pedidos, o dono do estabelecimento passa a ter interesse em entender o desempenho do negócio: quais pratos vendem mais, qual o ticket médio, qual o tempo médio de preparo da cozinha. Essa informação hoje não está disponível em nenhuma interface — seria necessário consultar o banco diretamente.

---

## Objetivo

Criar um painel de métricas de negócio acessível ao administrador com os principais KPIs operacionais do restaurante.

---

## Escopo

### Backend — Rotas de Métricas

Todas as rotas requerem `requireRole('admin')`.

- [ ] **`GET /admin/metricas/faturamento`**: Faturamento por período (hoje, semana, mês). Retorna `{data, total}[]`.
- [ ] **`GET /admin/metricas/itens-mais-pedidos`**: Top 10 itens mais pedidos no período. Retorna `{item_nome, total_pedidos, receita_gerada}[]`.
- [ ] **`GET /admin/metricas/ticket-medio`**: Ticket médio por comanda no período.
- [ ] **`GET /admin/metricas/tempo-preparo`**: Tempo médio em segundos entre `status = 'pendente'` (criado_em) e `status = 'pronto'` (atualizado_em) dos `pedido_itens`.
- [ ] **`GET /admin/metricas/mesas-mais-ativas`**: Mesas com maior volume de comandas/pedidos no período.

### Banco de Dados

- [ ] **Migração**: Adicionar coluna `atualizado_em TIMESTAMPTZ DEFAULT NOW()` em `pedido_itens` (já especificada em `docs/database.md` para o cálculo de tempo de preparo).
- [ ] **Trigger**: Atualizar `atualizado_em` automaticamente a cada mudança de `status` em `pedido_itens`.
- [ ] **Índice**: `pedido_itens(status, atualizado_em)` para as queries de tempo de preparo.

### Frontend — Admin Panel (`/staff/admin/metricas`)

- [ ] Nova aba "Métricas" no painel do staff, visível apenas para `role: 'admin'`.
- [ ] **Cards de KPI no topo**: Faturamento Hoje, Ticket Médio, Total de Comandas Abertas, Tempo Médio de Preparo.
- [ ] **Gráfico de Faturamento** (últimos 7 dias): Gráfico de barras com faturamento por dia.
  - Biblioteca recomendada: `recharts` (leve, compatível com React/Next.js).
- [ ] **Tabela: Itens Mais Pedidos**: Top 10 com nome, quantidade total e receita gerada.
- [ ] **Filtro de período**: Seletor de "Hoje / Esta Semana / Este Mês".
- [ ] Design visual consistente com o estilo neo-brutalista do restante da aplicação.

---

## Critérios de Aceitação

1. Painel de métricas carrega em menos de 1 segundo com dados do período selecionado.
2. Gráfico de faturamento exibe corretamente os últimos 7 dias com os valores reais.
3. Tabela de itens mais pedidos reflete os dados reais do banco.
4. Alterar o filtro de período (hoje/semana/mês) atualiza todos os dados do painel sem recarregar a página.
5. Painel inacessível para `role: 'funcionario'` (retorna 403 nas rotas de API e a aba não aparece no menu).

---

## Notas de Implementação

- As queries de métricas podem ser custosas — considerar caching de curta duração (TTL 5 minutos) no backend com Redis ou simples cache em memória.
- O cálculo de tempo de preparo deve ignorar pedidos sem `atualizado_em` ou com status ainda não `pronto/entregue`.
- Não implementar integração com maquininha de pagamento nesta tarefa — o faturamento calculado é baseado nos preços do sistema, não em transações reais.
