# Banco de Dados — cardap.io

> PostgreSQL — Entidades principais e intenções de design

---

## Entidades

**`usuario`** — Representa os funcionários e administradores que operam o sistema pelo painel administrativo. O campo `role` distingue quem pode apenas gerenciar comandas (`funcionario`) de quem tem acesso total (`admin`). O campo `ativo` permite desativar uma conta sem excluí-la, preservando o histórico de ações do usuário.

**`mesa`** — Mesa física do restaurante. Fica `ocupada` enquanto houver ao menos uma sessão ativa e volta a `livre` quando todas as comandas daquela mesa forem encerradas — permitindo que um grupo divida a conta em comandas individuais simultâneas.

**`qr_code`** — Token único vinculado a um cartão físico entregue ao cliente. Uma mesa pode ter múltiplos QR Codes ativos ao mesmo tempo (um por pessoa do grupo); ao encerrar a comanda, o QR Code é reativado para reutilização sem gerar um novo token.

**`sessao_cliente`** — Criada quando o cliente escaneia o QR Code. Representa a identidade temporária do cliente: não há cadastro nem login — o QR Code é a única credencial. Cada sessão delimita o acesso ao cardápio e aos pedidos e é encerrada quando o funcionário confirma o pagamento.

**`categoria`** — Agrupa os itens do cardápio em seções (ex.: Entradas, Pratos, Bebidas). O campo `ordem` define a sequência em que as categorias aparecem na tela do cliente.

**`item_cardapio`** — Cada prato, bebida ou produto disponível para pedido. O flag `disponivel` permite marcar um item como esgotado sem excluí-lo, preservando o histórico de pedidos anteriores que o referenciam.

**`comanda`** — Agrupa os pedidos de uma sessão individual. Uma mesa pode ter múltiplas comandas abertas ao mesmo tempo quando cada pessoa do grupo escaneia seu próprio QR Code. O `status` guia o ciclo de vida: `aberta` (pedidos em andamento), `fechamento_solicitado` (cliente pediu a conta) e `encerrada` (pagamento confirmado pelo funcionário).

**`pedido`** — Representa cada item solicitado pelo cliente dentro de uma comanda. O `status` individual por pedido (`pendente` → `em_preparo` → `a_caminho` → `entregue`) é o que alimenta o acompanhamento em tempo real tanto na tela do cliente quanto no painel do estabelecimento.

---

## Modelagem

### `usuario`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| nome | `VARCHAR(100)` | NOT NULL |
| email | `VARCHAR(255)` | UNIQUE, NOT NULL |
| senha_hash | `VARCHAR(255)` | NOT NULL |
| role | `VARCHAR(20)` | NOT NULL, CHECK (`'admin'`, `'funcionario'`) |
| ativo | `BOOLEAN` | NOT NULL, DEFAULT `true` |
| criado_em | `TIMESTAMP` | DEFAULT NOW() |

### `mesa`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| numero | `INTEGER` | UNIQUE, NOT NULL |
| status | `VARCHAR(20)` | NOT NULL, CHECK (`'livre'`, `'ocupada'`) |

### `qr_code`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| mesa_id | `INTEGER` | FK → `mesa.id`, NOT NULL |
| token | `UUID` | UNIQUE, NOT NULL |
| ativo | `BOOLEAN` | NOT NULL, DEFAULT `true` |
| criado_em | `TIMESTAMP` | DEFAULT NOW() |

### `sessao_cliente`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| qr_code_id | `INTEGER` | FK → `qr_code.id`, NOT NULL |
| mesa_id | `INTEGER` | FK → `mesa.id`, NOT NULL |
| iniciada_em | `TIMESTAMP` | DEFAULT NOW() |
| encerrada_em | `TIMESTAMP` | nullable |

### `categoria`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| nome | `VARCHAR(60)` | NOT NULL |
| ordem | `INTEGER` | NOT NULL |

### `item_cardapio`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| categoria_id | `INTEGER` | FK → `categoria.id`, NOT NULL |
| nome | `VARCHAR(100)` | NOT NULL |
| descricao | `TEXT` | nullable |
| preco | `DECIMAL(10,2)` | NOT NULL, CHECK (`preco > 0`) |
| imagem_url | `VARCHAR(500)` | nullable |
| disponivel | `BOOLEAN` | NOT NULL, DEFAULT `true` |

### `comanda`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| mesa_id | `INTEGER` | FK → `mesa.id`, NOT NULL |
| sessao_id | `INTEGER` | FK → `sessao_cliente.id`, NOT NULL |
| status | `VARCHAR(30)` | NOT NULL, CHECK (`'aberta'`, `'fechamento_solicitado'`, `'encerrada'`) |
| criada_em | `TIMESTAMP` | DEFAULT NOW() |
| encerrada_em | `TIMESTAMP` | nullable — preenchido ao encerrar a comanda |

### `pedido`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| id | `SERIAL` | PK |
| comanda_id | `INTEGER` | FK → `comanda.id`, NOT NULL |
| item_id | `INTEGER` | FK → `item_cardapio.id`, NOT NULL |
| quantidade | `INTEGER` | NOT NULL, CHECK (`quantidade > 0`) |
| observacao | `TEXT` | nullable |
| status | `VARCHAR(20)` | NOT NULL, CHECK (`'pendente'`, `'em_preparo'`, `'a_caminho'`, `'entregue'`) |
| criado_em | `TIMESTAMP` | DEFAULT NOW() |
| atualizado_em | `TIMESTAMP` | DEFAULT NOW() — atualizado a cada mudança de `status`; usado para detectar pedidos parados há mais de 10 min (US-04) |

---

## Índices

| Tabela | Coluna(s) | Tipo | Motivo |
|--------|-----------|------|--------|
| `usuario` | `email` | UNIQUE | Lookup no login — toda autenticação consulta por e-mail |
| `usuario` | `ativo` | B-tree | Filtrar apenas contas ativas na validação do login |
| `mesa` | `status` | B-tree | Filtrar mesas livres ao ativar um novo QR Code |
| `qr_code` | `token` | UNIQUE | Validação do QR Code escaneado — consulta mais frequente do sistema |
| `qr_code` | `mesa_id` | B-tree | Buscar QR Code ativo de uma mesa |
| `sessao_cliente` | `qr_code_id` | B-tree | Verificar se já existe sessão aberta para um QR Code |
| `item_cardapio` | `categoria_id` | B-tree | Carregar itens por categoria ao renderizar o cardápio |
| `item_cardapio` | `disponivel` | B-tree | Filtrar apenas itens disponíveis na listagem do cliente |
| `comanda` | `mesa_id` | B-tree | Buscar comanda aberta de uma mesa |
| `comanda` | `status` | B-tree | Listar todas as comandas abertas no painel do funcionário |
| `pedido` | `comanda_id` | B-tree | Join mais frequente — carregar todos os pedidos de uma comanda |
| `pedido` | `status` | B-tree | Filtrar pedidos pendentes/em preparo no painel em tempo real |

---

## Comportamento das Chaves Estrangeiras

| FK | ON DELETE | Motivo |
|----|-----------|--------|
| `qr_code.mesa_id` → `mesa` | RESTRICT | Não permite remover uma mesa que ainda tem QR Codes vinculados |
| `sessao_cliente.qr_code_id` → `qr_code` | RESTRICT | Um QR Code com sessão registrada não pode ser excluído |
| `sessao_cliente.mesa_id` → `mesa` | RESTRICT | Idem — sessão ativa impede remoção da mesa |
| `item_cardapio.categoria_id` → `categoria` | RESTRICT | Não permite excluir uma categoria que ainda tem itens |
| `comanda.mesa_id` → `mesa` | RESTRICT | Mesa com comanda aberta não pode ser removida |
| `comanda.sessao_id` → `sessao_cliente` | RESTRICT | Comanda deve ser encerrada antes de qualquer remoção de sessão |
| `pedido.comanda_id` → `comanda` | CASCADE | Pedidos são parte da comanda — removida a comanda, os pedidos vão junto |
| `pedido.item_id` → `item_cardapio` | RESTRICT | Não permite excluir um item que já foi pedido em alguma comanda |

---

## Diagrama de Relacionamentos

```
usuario

mesa ──────────────── qr_code (1 ativo por vez)
 │                        │
 │                   sessao_cliente
 │                        │
 └────────────────── comanda ──── pedido ──── item_cardapio
                                                    │
                                                categoria
```
