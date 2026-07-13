# TAREFA-03 — Separação de Mesa e Comanda no Frontend

> **Prioridade:** 🔴 Alta  
> **User Story:** US-01, US-08  
> **Estimativa:** 8–13 pontos  
> **Dependências:** TAREFA-02 (sessão do cliente) deve estar implementada ou em paralelo.

---

## Contexto

O código atual mistura os conceitos de **Mesa** e **Comanda** em uma única rota `/mesa/[id]`. Isso viola a modelagem documentada em `docs/database.md` e `docs/decisoes-modelagem.md`, onde:

- **Mesa** = entidade física, permanente, identificada por número.
- **Comanda** = sessão de consumo individual, criada no scan do QR Code, encerrada no pagamento.

A confusão atual gera problemas práticos:
- Não é possível ter múltiplas comandas simultâneas na mesma mesa (grupos dividindo conta).
- O total da comanda e o botão de fechar conta não têm contexto adequado.
- O painel do staff não distingue corretamente o "estado da mesa" do "estado dos pedidos de cada comanda".

---

## Objetivo

Refatorar a arquitetura de rotas e estado do frontend para refletir com precisão a separação entre Mesa e Comanda, alinhando o código com a modelagem documentada.

---

## Escopo

### Backend

- [ ] **Rota `POST /mesas/:mesaId/comanda`**: Cria (ou reabre) uma comanda para aquela mesa, vinculada à sessão do cliente. Retorna o `comanda_id`.
- [ ] **Rota `GET /mesas/:mesaId/status`**: Retorna o estado atual da mesa (livre/ocupada) e as comandas abertas nela.
- [ ] **Rota `GET /comanda/:comandaId`**: Retorna os dados completos de uma comanda específica (itens, total, status).
- [ ] Garantir que `POST /pedidos` está vinculado ao `comanda_id`, não ao `mesa_id`.

### Frontend — Novas Rotas

| Rota | Responsabilidade |
|------|-----------------|
| `/mesa/[id]` | **Cardápio público da mesa** — exibe o menu, categorias e itens disponíveis. Qualquer cliente autenticado naquela mesa acessa. |
| `/comanda/[id]` | **Área pessoal do cliente** — carrinho, histórico de pedidos feitos, total acumulado, botão de solicitar fechamento. |

### Frontend — Refatoração

- [ ] Separar o estado de `/mesa/[id]`: remover carrinho e pedidos pessoais. Esta rota deve ser **somente leitura** do cardápio.
- [ ] Criar `/comanda/[id]`: migrar para cá o carrinho, o histórico de pedidos e o total acumulado.
- [ ] **Fluxo de navegação pós-sessão**:
  1. Cliente escaneia QR Code → `/entrar?token=...` → backend cria/associa comanda → redireciona para `/mesa/[mesaId]`.
  2. Ao clicar em "Ver meu pedido" ou similar → navega para `/comanda/[comandaId]`.
  3. Floating action button (FAB) ou barra inferior fixa no cardápio para alternar entre "Cardápio" e "Minha Comanda".
- [ ] Persistir `{sessao_id, mesa_id, comanda_id}` no `localStorage` para manter o contexto entre navegações.

### Staff — Painel de Mesas

- [ ] Aba "Mesas Ativas" no painel do staff deve exibir **por mesa** → e dentro de cada mesa, **por comanda** (especialmente útil para grupos com contas separadas).
- [ ] Cada card de mesa deve mostrar:
  - Número da mesa e status (livre/ocupada).
  - Lista de comandas abertas naquela mesa (pode ser mais de uma).
  - Total de cada comanda individualmente.
  - Total consolidado da mesa (soma de todas as comandas abertas).

---

## Critérios de Aceitação

1. `/mesa/[id]` exibe apenas o cardápio — sem carrinho, sem histórico de pedidos pessoais.
2. `/comanda/[id]` exibe apenas os itens do cliente autenticado, sem itens de outras comandas da mesma mesa.
3. Dois clientes na Mesa 03 com comandas diferentes veem totais diferentes em `/comanda/[id]`.
4. O staff consegue distinguir no painel quantas comandas estão abertas por mesa.
5. Nenhuma rota existente quebra durante a transição (backward compatibility via redirecionamento).

---

## Notas de Implementação

- A rota `/mesa/[id]` pode continuar existindo e deve ser mantida retrocompatível, porém o comportamento de carrinho/pedidos deve migrar completamente para `/comanda/[id]`.
- O `comanda_id` da sessão ativa deve ser acessível globalmente via React Context ou estado global (Zustand/Jotai) para evitar prop drilling entre as duas rotas.
- WebSocket: o evento `novo_pedido` já usa `comanda_id`. O evento de status deve continuar emitindo para `comanda:${comandaId}`, não para `mesa:${mesaId}`.
