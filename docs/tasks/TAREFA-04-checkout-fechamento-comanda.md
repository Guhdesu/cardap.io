# TAREFA-04 — Fluxo de Checkout e Fechamento de Comanda

> **Prioridade:** 🟠 Alta-Média  
> **User Story:** US-08  
> **Estimativa:** 5–8 pontos  
> **Dependências:** TAREFA-02 (sessão), TAREFA-03 (separação mesa/comanda).

---

## Contexto

O banco de dados já possui o campo `status` na tabela `comandas` com os valores `aberta` e `fechada`. A documentação em `docs/database.md` especifica um estado adicional importante: `fechamento_solicitado` — que representa o momento em que o cliente pediu a conta mas o staff ainda não confirmou o pagamento.

O ciclo de vida completo da comanda segundo a spec é:

```
aberta → fechamento_solicitado → encerrada
```

Atualmente, nenhuma dessas transições é exposta ao cliente ou ao staff via interface.

---

## Objetivo

Implementar o ciclo de vida completo da comanda: o cliente solicita o fechamento, o staff é notificado em tempo real, confirma o pagamento e encerra a comanda — liberando a mesa e o QR Code para reutilização.

---

## Escopo

### Banco de Dados

- [ ] **Migração**: Atualizar a constraint `status` da tabela `comandas` para incluir `'fechamento_solicitado'` e `'encerrada'` além de `'aberta'`.
- [ ] Adicionar coluna `encerrada_em TIMESTAMPTZ` (nullable) à tabela `comandas`.

### Backend

- [ ] **Rota `PUT /comanda/:id/solicitar-fechamento`** (requer `requireSessaoCliente`):
  - Altera status de `aberta` → `fechamento_solicitado`.
  - Emite evento WebSocket `fechamento_solicitado` para a sala `staff`.
  - Bloqueia novos pedidos para aquela comanda (verificação no `POST /pedidos`).
- [ ] **Rota `PUT /comanda/:id/encerrar`** (requer `requireAuth` — somente staff):
  - Altera status de `fechamento_solicitado` → `encerrada`.
  - Preenche `encerrada_em` com o timestamp atual.
  - Marca o `qr_code` daquela mesa como `ativo = true` (liberação para reutilização).
  - Encerra a `sessao_cliente` preenchendo `encerrada_em`.
  - Emite evento WebSocket `comanda_encerrada` para a sala `mesa:${mesaId}`.
- [ ] Validação em `POST /pedidos`: rejeitar pedidos para comandas com status diferente de `aberta`.

### Frontend — Cliente (`/comanda/[id]`)

- [ ] **Resumo da comanda**: Exibir todos os itens pedidos com quantidade, preço unitário e subtotal.
- [ ] **Total acumulado** em destaque.
- [ ] **Botão "Pedir a Conta"**:
  - Exibe modal de confirmação ("Tem certeza? Novos pedidos serão bloqueados.").
  - Ao confirmar, chama `PUT /comanda/:id/solicitar-fechamento`.
  - Interface muda para estado "Aguardando confirmação do pagamento" — desabilita novos pedidos e o botão some.
- [ ] **Estado "Comanda Encerrada"**: Ao receber evento WebSocket `comanda_encerrada`, exibe tela de agradecimento/encerramento e limpa o `localStorage`.

### Frontend — Staff (Painel)

- [ ] **Alerta de fechamento solicitado**: Ao receber evento `fechamento_solicitado` via WebSocket:
  - Toast de notificação com som (já existe `playNotificationSound`).
  - O card da mesa correspondente na aba "Mesas Ativas" recebe destaque visual (borda pulsante laranja/vermelho).
  - Badge "⚠️ CONTA SOLICITADA" no card da comanda.
- [ ] **Botão "Confirmar Pagamento"** no card da comanda em estado `fechamento_solicitado`:
  - Chama `PUT /comanda/:id/encerrar`.
  - Remove o card da comanda do painel (ou move para uma seção "Encerradas").

---

## Critérios de Aceitação

1. Cliente clica em "Pedir a Conta" → interface muda imediatamente para "Aguardando pagamento" e não permite mais pedidos.
2. Staff vê notificação em tempo real da solicitação de fechamento com destaque visual na mesa correta.
3. Staff clica "Confirmar Pagamento" → comanda move para `encerrada` no banco.
4. Cliente vê tela de agradecimento/encerramento em tempo real (sem precisar recarregar).
5. QR Code da mesa fica disponível para a próxima sessão após encerramento.
6. Tentativa de fazer pedido em comanda `fechamento_solicitado` ou `encerrada` → retorna erro claro.

---

## Notas de Implementação

- O evento WebSocket de `fechamento_solicitado` deve incluir `{comanda_id, mesa_numero}` para o staff saber qual mesa destacar.
- O evento `comanda_encerrada` deve ser emitido para a sala `comanda:${comandaId}` para que somente o cliente daquela comanda receba.
- O fluxo de "múltiplas comandas por mesa" (grupos) deve ser tratado: encerrar uma comanda não libera a mesa se houver outras comandas `aberta` na mesma mesa.
