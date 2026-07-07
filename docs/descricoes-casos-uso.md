# Descrições Expandidas dos Casos de Uso — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP

---

## Visão Geral

Este documento detalha os **três casos de uso mais complexos** do sistema cardap.io. Cada descrição inclui fluxo principal, fluxos alternativos e fluxos de exceção, seguindo o formato expandido de Cockburn. As classes referenciadas correspondem ao [Diagrama de Classes](diagrama-classes.md).

---

## UC-03 — Realizar Pedido

| Campo | Valor |
|-------|-------|
| **ID** | UC-03 |
| **Nome** | Realizar Pedido |
| **Ator Principal** | Cliente |
| **User Story** | US-03 — Realização de pedidos |
| **Descrição** | O cliente autenticado seleciona itens do cardápio, ajusta quantidades, adiciona observações e confirma o pedido, que é registrado na comanda e notificado ao painel do estabelecimento em tempo real. |
| **Classes Envolvidas** | `Cliente`, `Comanda`, `Pedido`, `ItemPedido`, `ItemCardapio`, `Categoria` |

### Pré-condições

1. O cliente está autenticado no sistema (UC-01 concluído com sucesso).
2. Existe uma `Comanda` com status `ABERTA` associada à sessão do cliente.
3. O cardápio possui pelo menos um `ItemCardapio` com `disponivel = true`.

### Pós-condições

1. Um novo `Pedido` é criado com status `PENDENTE` e vinculado à `Comanda` do cliente.
2. Cada item selecionado é registrado como `ItemPedido` com quantidade, observação e `precoUnitario` congelado no momento da confirmação.
3. O pedido aparece imediatamente no painel de gerência do funcionário (via Socket.io).
4. O cliente visualiza uma confirmação visual na tela com o resumo do pedido.

### Fluxo Principal

| Passo | Ator | Ação |
|-------|------|------|
| 1 | Cliente | Acessa a tela do cardápio a partir do menu principal. |
| 2 | Sistema | Carrega as `Categorias` e seus `ItemCardapio` disponíveis (`disponivel = true`). Itens indisponíveis são exibidos com indicação visual "Esgotado". |
| 3 | Cliente | Navega pelas categorias e seleciona um item do cardápio. |
| 4 | Sistema | Exibe os detalhes do item: nome, descrição, preço e imagem. |
| 5 | Cliente | Define a quantidade desejada e, opcionalmente, adiciona uma observação textual (ex.: "sem cebola"). |
| 6 | Cliente | Confirma a adição do item ao carrinho. |
| 7 | Sistema | Cria um `ItemPedido` temporário no carrinho com `precoUnitario` igual ao preço atual do `ItemCardapio`. |
| 8 | Cliente | Repete os passos 3–7 para adicionar mais itens (opcional). |
| 9 | Cliente | Acessa o carrinho e revisa os itens selecionados. |
| 10 | Sistema | Exibe a lista de `ItemPedido` com nome, quantidade, observação, preço unitário e subtotal. |
| 11 | Cliente | Confirma o envio do pedido. |
| 12 | Sistema | Cria um novo `Pedido` com status `PENDENTE`, registra o horário (`criadoEm`), vincula os `ItemPedido` ao pedido e o `Pedido` à `Comanda` via `adicionarPedido()`. |
| 13 | Sistema | Emite evento via Socket.io para o painel do funcionário com os dados do novo pedido. |
| 14 | Sistema | Exibe confirmação visual ao cliente com o resumo do pedido e o status "Pendente". |

### Fluxos Alternativos

#### FA-01 — Cliente ajusta quantidade no carrinho

| Passo | Ator | Ação |
|-------|------|------|
| 9a | Cliente | No carrinho, altera a quantidade de um `ItemPedido` já adicionado. |
| 9b | Sistema | Recalcula o subtotal do item (`calcularSubtotal()`) e atualiza o total do carrinho. |
| — | — | Retorna ao passo 10 do fluxo principal. |

#### FA-02 — Cliente remove item do carrinho

| Passo | Ator | Ação |
|-------|------|------|
| 9a | Cliente | No carrinho, remove um `ItemPedido`. |
| 9b | Sistema | Remove o item da lista e recalcula o total. |
| — | — | Se o carrinho ficar vazio, retorna ao passo 2. Caso contrário, retorna ao passo 10. |

#### FA-03 — Cliente adiciona observação após adicionar ao carrinho

| Passo | Ator | Ação |
|-------|------|------|
| 9a | Cliente | No carrinho, edita a observação de um `ItemPedido` já adicionado. |
| 9b | Sistema | Atualiza o campo `observacao` do `ItemPedido`. |
| — | — | Retorna ao passo 10 do fluxo principal. |

### Fluxos de Exceção

#### FE-01 — Item tornou-se indisponível durante a seleção

| Passo | Ator | Ação |
|-------|------|------|
| 11a | Sistema | Ao confirmar o pedido, detecta que um `ItemCardapio` referenciado no carrinho teve `disponivel` alterado para `false` desde o carregamento do cardápio. |
| 11b | Sistema | Exibe mensagem de erro: _"O item [nome] não está mais disponível. Remova-o do carrinho para continuar."_ |
| 11c | Cliente | Remove o item indisponível do carrinho. |
| — | — | Retorna ao passo 10 do fluxo principal. |

#### FE-02 — Comanda não está aberta

| Passo | Ator | Ação |
|-------|------|------|
| 11a | Sistema | Ao confirmar o pedido, verifica que a `Comanda` associada tem status `AGUARDANDO_PAGAMENTO` ou `ENCERRADA`. |
| 11b | Sistema | Exibe mensagem: _"Sua comanda já foi solicitada para fechamento. Não é possível realizar novos pedidos."_ |
| — | — | O fluxo é encerrado sem criar o pedido. |

#### FE-03 — Falha de comunicação com o servidor

| Passo | Ator | Ação |
|-------|------|------|
| 12a | Sistema | A requisição de criação do pedido falha por erro de rede ou timeout. |
| 12b | Sistema | Exibe mensagem: _"Não foi possível enviar seu pedido. Verifique sua conexão e tente novamente."_ O carrinho é preservado. |
| 12c | Cliente | Tenta confirmar o pedido novamente. |
| — | — | Retorna ao passo 11 do fluxo principal. |

---

## UC-01 — Autenticar via QR Code

| Campo | Valor |
|-------|-------|
| **ID** | UC-01 |
| **Nome** | Autenticar via QR Code |
| **Ator Principal** | Cliente |
| **User Story** | US-01 — Autenticação do cliente via QR Code |
| **Descrição** | O cliente escaneia o QR Code do cartão recebido na chegada ao restaurante. O sistema valida o token, identifica a mesa correspondente, cria uma sessão e abre uma comanda, liberando o acesso ao cardápio digital. |
| **Classes Envolvidas** | `Cliente`, `Cartao`, `Mesa`, `Comanda` |

### Pré-condições

1. O administrador cadastrou a mesa e gerou o QR Code vinculado (UC-10 concluído).
2. O `Cartao` correspondente está com `ativo = true`.
3. O cliente possui um dispositivo com câmera funcional e acesso à internet.

### Pós-condições

1. Uma nova sessão (`Cliente`) é criada e associada ao `Cartao` escaneado.
2. Uma nova `Comanda` é aberta com status `ABERTA` e vinculada à `Mesa`.
3. O `Cartao` é marcado como em uso (não pode ser reutilizado até liberação).
4. O cliente é redirecionado para a tela do cardápio digital.

### Fluxo Principal

| Passo | Ator | Ação |
|-------|------|------|
| 1 | Cliente | Abre a câmera do dispositivo e escaneia o QR Code impresso no cartão recebido na chegada. |
| 2 | Sistema | Decodifica o QR Code e extrai o token (`qrCode`) contido nele. |
| 3 | Sistema | Chama `Cartao.validar()`: verifica se o token existe no banco, se o `Cartao` está com `ativo = true` e se não há sessão ativa vinculada a ele. |
| 4 | Sistema | Identifica a `Mesa` associada ao `Cartao` via `mesaId`. |
| 5 | Sistema | Cria um novo `Cliente` com `cartaoId` e registra `autenticadoEm` com a data/hora atual. |
| 6 | Sistema | Chama `Mesa.abrirComanda()`: cria uma nova `Comanda` com status `ABERTA`, vinculada à mesa, e registra `abertaEm`. |
| 7 | Sistema | Exibe tela de confirmação com o número da mesa e mensagem de boas-vindas. |
| 8 | Sistema | Redireciona o cliente para a tela do cardápio digital (UC-02). |

### Fluxos Alternativos

#### FA-01 — Mesa já possui comanda aberta (grupo existente)

| Passo | Ator | Ação |
|-------|------|------|
| 6a | Sistema | Detecta que a `Mesa` já possui uma `Comanda` com status `ABERTA`. |
| 6b | Sistema | Cria uma nova `Comanda` individual para o cliente (suporte a comandas simultâneas por mesa). |
| — | — | Continua no passo 7 do fluxo principal. |

#### FA-02 — Cliente escaneia via link direto (URL do QR Code)

| Passo | Ator | Ação |
|-------|------|------|
| 1a | Cliente | Em vez de usar a câmera, acessa a URL codificada no QR Code diretamente pelo navegador. |
| — | — | Continua no passo 2 do fluxo principal. |

### Fluxos de Exceção

#### FE-01 — QR Code inválido ou inexistente

| Passo | Ator | Ação |
|-------|------|------|
| 3a | Sistema | `Cartao.validar()` retorna `false`: o token não é encontrado no banco de dados. |
| 3b | Sistema | Exibe mensagem de erro: _"QR Code inválido. Solicite um novo cartão ao funcionário."_ |
| — | — | O fluxo é encerrado. O acesso ao cardápio permanece bloqueado. |

#### FE-02 — QR Code já vinculado a sessão ativa

| Passo | Ator | Ação |
|-------|------|------|
| 3a | Sistema | `Cartao.validar()` retorna `false`: já existe uma sessão ativa associada a este `Cartao`. |
| 3b | Sistema | Exibe mensagem de erro: _"Este cartão já está em uso. Se você acredita que isso é um erro, procure um funcionário."_ |
| — | — | O fluxo é encerrado. |

#### FE-03 — Cartão desativado (mesa removida)

| Passo | Ator | Ação |
|-------|------|------|
| 3a | Sistema | `Cartao.validar()` retorna `false`: o campo `ativo` é `false` (mesa foi removida pelo administrador). |
| 3b | Sistema | Exibe mensagem de erro: _"Mesa inativa. Este cartão não está mais habilitado."_ |
| — | — | O fluxo é encerrado. |

#### FE-04 — Falha na leitura do QR Code

| Passo | Ator | Ação |
|-------|------|------|
| 2a | Sistema | A câmera não consegue decodificar o QR Code (código danificado, pouca iluminação, etc.). |
| 2b | Sistema | Exibe mensagem: _"Não foi possível ler o QR Code. Tente novamente ou peça um novo cartão ao funcionário."_ |
| 2c | Cliente | Tenta escanear novamente. |
| — | — | Retorna ao passo 1 do fluxo principal. |

---

## UC-04 — Gerenciar Comanda

| Campo | Valor |
|-------|-------|
| **ID** | UC-04 |
| **Nome** | Gerenciar Comanda |
| **Ator Principal** | Funcionário |
| **User Story** | US-04 — Gerência das comandas pelo estabelecimento |
| **Descrição** | O funcionário autenticado visualiza todas as comandas abertas em tempo real, atualiza o status dos pedidos (Pendente → Em Preparo → A Caminho → Entregue), adiciona itens manualmente e confirma o pagamento para encerrar comandas. |
| **Classes Envolvidas** | `Funcionario`, `Comanda`, `Pedido`, `ItemPedido`, `Mesa`, `Cartao`, `StatusPedido`, `StatusComanda` |

### Pré-condições

1. O funcionário está autenticado no painel administrativo (UC-09 concluído com sucesso).
2. O token JWT do funcionário é válido e não expirado.
3. Existe pelo menos uma `Comanda` com status `ABERTA` ou `AGUARDANDO_PAGAMENTO` no sistema.

### Pós-condições

1. Os status dos pedidos são atualizados conforme a interação do funcionário.
2. As mudanças de status são refletidas em tempo real na tela do cliente (via Socket.io).
3. Comandas com pagamento confirmado são encerradas (`StatusComanda.ENCERRADA`) e o `Cartao` associado é liberado para reutilização.

### Fluxo Principal

| Passo | Ator | Ação |
|-------|------|------|
| 1 | Funcionário | Acessa o painel de comandas no sistema administrativo. |
| 2 | Sistema | Carrega todas as `Comandas` com status `ABERTA` ou `AGUARDANDO_PAGAMENTO`, exibindo: número da `Mesa`, lista de `Pedidos` com seus `ItemPedido`, quantidades, observações e horário de criação. |
| 3 | Sistema | Destaca visualmente (cor laranja/vermelho) os `Pedidos` cujo `status` não foi atualizado há mais de 10 minutos (baseado em `atualizadoEm`). |
| 4 | Funcionário | Seleciona um `Pedido` específico de uma comanda. |
| 5 | Funcionário | Atualiza o status do pedido para o próximo estado na sequência: `PENDENTE` → `EM_PREPARO` → `A_CAMINHO` → `ENTREGUE`. |
| 6 | Sistema | Chama `Pedido.atualizarStatus(status)`, registra a alteração e atualiza `atualizadoEm`. |
| 7 | Sistema | Emite evento via Socket.io para a sessão do cliente, notificando a mudança de status. |
| 8 | Sistema | Atualiza a interface do painel em tempo real refletindo o novo status. |

### Fluxos Alternativos

#### FA-01 — Funcionário adiciona item manualmente a uma comanda

| Passo | Ator | Ação |
|-------|------|------|
| 4a | Funcionário | Seleciona a opção "Adicionar item" em uma comanda aberta. |
| 4b | Sistema | Exibe o cardápio com os `ItemCardapio` disponíveis. |
| 4c | Funcionário | Seleciona um item, define quantidade e observação. |
| 4d | Sistema | Cria um novo `Pedido` com os `ItemPedido` correspondentes, vincula à `Comanda` e define status como `PENDENTE`. |
| — | — | Retorna ao passo 2 do fluxo principal (lista atualizada). |

#### FA-02 — Funcionário confirma pagamento e encerra comanda

| Passo | Ator | Ação |
|-------|------|------|
| 4a | Funcionário | Seleciona uma comanda com status `AGUARDANDO_PAGAMENTO`. |
| 4b | Sistema | Exibe o resumo da comanda com `calcularTotal()`: todos os itens, quantidades e valor total. |
| 4c | Funcionário | Confirma o pagamento via `Funcionario.confirmarPagamento(comandaId)`. |
| 4d | Sistema | Chama `Comanda.encerrar()`: altera status para `ENCERRADA` e registra `fechadaEm`. |
| 4e | Sistema | Chama `Cartao.liberar()`: reativa o cartão (`ativo = true`) para reutilização. |
| 4f | Sistema | Verifica se a `Mesa` possui outras comandas abertas; se não, atualiza o status da mesa para "livre". |
| 4g | Sistema | Notifica o cliente via Socket.io que a comanda foi encerrada. |
| — | — | Retorna ao passo 2 do fluxo principal. |

#### FA-03 — Funcionário filtra comandas por mesa ou status

| Passo | Ator | Ação |
|-------|------|------|
| 2a | Funcionário | Aplica filtro por número de mesa ou status da comanda. |
| 2b | Sistema | Recarrega a lista de comandas com o filtro aplicado. |
| — | — | Continua no passo 3 do fluxo principal. |

### Fluxos de Exceção

#### FE-01 — Tentativa de pular etapa de status

| Passo | Ator | Ação |
|-------|------|------|
| 5a | Funcionário | Tenta alterar o status de um pedido para um estado que não é o próximo na sequência (ex.: de `PENDENTE` direto para `ENTREGUE`). |
| 5b | Sistema | Exibe mensagem de erro: _"A transição de status deve seguir a ordem: Pendente → Em Preparo → A Caminho → Entregue."_ |
| — | — | Retorna ao passo 4 do fluxo principal. |

#### FE-02 — Sessão JWT expirada

| Passo | Ator | Ação |
|-------|------|------|
| * | Sistema | Em qualquer passo, detecta que o token JWT expirou (validade de 8 horas). |
| * | Sistema | Redireciona o funcionário para a tela de login (UC-09) com mensagem: _"Sua sessão expirou. Faça login novamente."_ |
| — | — | O fluxo é encerrado. |

#### FE-03 — Comanda modificada por outro funcionário

| Passo | Ator | Ação |
|-------|------|------|
| 5a | Sistema | Ao tentar atualizar o status, detecta que outro funcionário já alterou o status desse pedido (conflito de concorrência). |
| 5b | Sistema | Exibe notificação: _"O status deste pedido já foi atualizado por outro funcionário."_ Atualiza a interface com o status atual. |
| — | — | Retorna ao passo 2 do fluxo principal com dados atualizados. |

---

## Matriz de Rastreabilidade

| Caso de Uso | User Story | Classes do Diagrama | Enumerações |
|-------------|------------|---------------------|-------------|
| UC-01 | US-01 | Cliente, Cartao, Mesa, Comanda | StatusComanda |
| UC-03 | US-03 | Cliente, Comanda, Pedido, ItemPedido, ItemCardapio, Categoria | StatusPedido |
| UC-04 | US-04, US-08 | Funcionario, Comanda, Pedido, ItemPedido, Mesa, Cartao | StatusPedido, StatusComanda |
