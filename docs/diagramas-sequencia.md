# Diagramas de Sequência — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP

---

## Visão Geral

Os diagramas de sequência abaixo ilustram os dois cenários mais complexos do sistema **cardap.io**. As linhas de vida (lifelines) correspondem às classes definidas no [Diagrama de Classes](diagrama-classes.md), garantindo consistência entre os artefatos UML.

---

## Diagrama 1 — Cliente Realiza um Pedido

**Cenário completo:** O cliente escaneia o QR Code → é autenticado → navega pelo cardápio → adiciona itens ao carrinho → confirma o pedido.

**Casos de uso cobertos:** UC-01 (Autenticar via QR Code), UC-02 (Visualizar Cardápio), UC-03 (Realizar Pedido)

```mermaid
sequenceDiagram
    actor ClienteAtor as Cliente (Ator)
    participant Cliente as Cliente
    participant Cartao as Cartao
    participant Mesa as Mesa
    participant Comanda as Comanda
    participant Categoria as Categoria
    participant ItemCardapio as ItemCardapio
    participant ItemPedido as ItemPedido
    participant Pedido as Pedido

    Note over ClienteAtor, Pedido: Fase 1 — Autenticação via QR Code (UC-01)

    ClienteAtor ->> Cartao: escaneia QR Code (token)
    activate Cartao
    Cartao ->> Cartao: validar()
    alt QR Code inválido ou inativo
        Cartao -->> ClienteAtor: Erro: "QR Code inválido"
    else QR Code válido
        Cartao -->> Cliente: token validado
        deactivate Cartao
        activate Cliente
        Cliente ->> Cliente: autenticar(qrCode)
        Cliente ->> Cartao: obter mesaId
        Cartao -->> Cliente: mesaId
        Cliente ->> Mesa: abrirComanda()
        activate Mesa
        Mesa ->> Comanda: criar(mesaId, status=ABERTA)
        activate Comanda
        Comanda -->> Mesa: comanda criada
        deactivate Comanda
        Mesa -->> Cliente: comanda aberta
        deactivate Mesa
        Cliente -->> ClienteAtor: Tela de confirmação (Mesa #N)
        deactivate Cliente
    end

    Note over ClienteAtor, Pedido: Fase 2 — Visualização do Cardápio (UC-02)

    ClienteAtor ->> Categoria: navegar categorias
    activate Categoria
    Categoria ->> ItemCardapio: listar itens (disponivel=true)
    activate ItemCardapio
    ItemCardapio -->> Categoria: lista de itens
    deactivate ItemCardapio
    Categoria -->> ClienteAtor: cardápio por categorias
    deactivate Categoria

    ClienteAtor ->> ItemCardapio: selecionar item
    activate ItemCardapio
    ItemCardapio -->> ClienteAtor: detalhes (nome, descricao, preco, imagemUrl)
    deactivate ItemCardapio

    Note over ClienteAtor, Pedido: Fase 3 — Realização do Pedido (UC-03)

    ClienteAtor ->> ItemPedido: adicionar ao carrinho (quantidade, observacao)
    activate ItemPedido
    ItemPedido ->> ItemCardapio: obter preco atual
    activate ItemCardapio
    ItemCardapio -->> ItemPedido: precoUnitario
    deactivate ItemCardapio
    ItemPedido ->> ItemPedido: calcularSubtotal()
    ItemPedido -->> ClienteAtor: item adicionado ao carrinho
    deactivate ItemPedido

    Note right of ClienteAtor: Repete para cada item desejado

    ClienteAtor ->> Cliente: confirmar pedido
    activate Cliente
    Cliente ->> Cliente: fazerPedido(itens)
    Cliente ->> Pedido: criar(comandaId, status=PENDENTE)
    activate Pedido
    loop Para cada item no carrinho
        Pedido ->> ItemPedido: registrar(itemCardapioId, quantidade, observacao, precoUnitario)
        activate ItemPedido
        ItemPedido -->> Pedido: item registrado
        deactivate ItemPedido
    end
    Pedido ->> Pedido: calcularSubtotal()
    Pedido -->> Cliente: pedido criado
    deactivate Pedido

    Cliente ->> Comanda: adicionarPedido(pedido)
    activate Comanda
    Comanda -->> Cliente: pedido vinculado
    deactivate Comanda

    Cliente -->> ClienteAtor: Confirmação visual + resumo do pedido
    deactivate Cliente
```

---

## Diagrama 2 — Funcionário Gerencia Pedidos e Encerra Comanda

**Cenário completo:** O funcionário visualiza comandas abertas → atualiza o status dos pedidos → o cliente solicita o fechamento → o funcionário confirma o pagamento → a comanda é encerrada e o cartão liberado.

**Casos de uso cobertos:** UC-04 (Gerenciar Comanda), UC-07 (Acompanhar Status — lado do sistema), UC-08 (Solicitar Fechamento)

```mermaid
sequenceDiagram
    actor FuncAtor as Funcionário (Ator)
    participant Funcionario as Funcionario
    participant Comanda as Comanda
    participant Pedido as Pedido
    participant Mesa as Mesa
    participant Cartao as Cartao
    actor ClienteAtor as Cliente (Ator)
    participant Cliente as Cliente

    Note over FuncAtor, Cliente: Fase 1 — Visualização das Comandas Abertas

    FuncAtor ->> Funcionario: acessar painel de comandas
    activate Funcionario
    Funcionario ->> Comanda: listar comandas (status=ABERTA)
    activate Comanda
    Comanda ->> Pedido: listar pedidos por comanda
    activate Pedido
    Pedido -->> Comanda: pedidos com itens, quantidades, horários
    deactivate Pedido
    Comanda ->> Mesa: obter número da mesa
    activate Mesa
    Mesa -->> Comanda: numero
    deactivate Mesa
    Comanda -->> Funcionario: lista de comandas abertas
    deactivate Comanda
    Funcionario -->> FuncAtor: Painel com comandas (destaque para pedidos > 10min)
    deactivate Funcionario

    Note over FuncAtor, Cliente: Fase 2 — Atualização de Status dos Pedidos

    FuncAtor ->> Funcionario: atualizar status do pedido
    activate Funcionario
    Funcionario ->> Funcionario: atualizarStatusPedido(pedidoId, EM_PREPARO)
    Funcionario ->> Pedido: atualizarStatus(EM_PREPARO)
    activate Pedido
    Pedido ->> Pedido: validar transição PENDENTE → EM_PREPARO
    Pedido -->> Funcionario: status atualizado
    deactivate Pedido
    Funcionario -->> ClienteAtor: Notificação via Socket.io (status: Em Preparo)
    Funcionario -->> FuncAtor: Painel atualizado
    deactivate Funcionario

    Note right of FuncAtor: Repete para cada transição de status

    FuncAtor ->> Funcionario: atualizar status para ENTREGUE
    activate Funcionario
    Funcionario ->> Pedido: atualizarStatus(ENTREGUE)
    activate Pedido
    Pedido -->> Funcionario: status atualizado
    deactivate Pedido
    Funcionario -->> ClienteAtor: Notificação via Socket.io (status: Entregue)
    deactivate Funcionario

    Note over FuncAtor, Cliente: Fase 3 — Solicitação de Fechamento pelo Cliente

    ClienteAtor ->> Cliente: solicitar fechamento da comanda
    activate Cliente
    Cliente ->> Comanda: solicitarFechamento()
    activate Comanda
    Comanda ->> Comanda: calcularTotal()
    Comanda ->> Comanda: status = AGUARDANDO_PAGAMENTO
    Comanda -->> Cliente: total da comanda
    deactivate Comanda
    Cliente -->> ClienteAtor: Resumo com total (novos pedidos bloqueados)
    deactivate Cliente

    Comanda -->> Funcionario: Alerta via Socket.io (comanda aguardando pagamento)
    activate Funcionario
    Funcionario -->> FuncAtor: Notificação de fechamento solicitado
    deactivate Funcionario

    Note over FuncAtor, Cliente: Fase 4 — Confirmação de Pagamento e Encerramento

    FuncAtor ->> Funcionario: confirmar pagamento
    activate Funcionario
    Funcionario ->> Funcionario: confirmarPagamento(comandaId)
    Funcionario ->> Comanda: encerrar()
    activate Comanda
    Comanda ->> Comanda: status = ENCERRADA, fechadaEm = agora
    Comanda -->> Funcionario: comanda encerrada
    deactivate Comanda

    Funcionario ->> Cartao: liberar()
    activate Cartao
    Cartao ->> Cartao: ativo = true
    Cartao -->> Funcionario: cartão liberado
    deactivate Cartao

    Funcionario ->> Mesa: fecharComanda()
    activate Mesa
    Mesa ->> Mesa: verificar outras comandas abertas
    alt Sem outras comandas
        Mesa ->> Mesa: status = livre
    end
    Mesa -->> Funcionario: mesa atualizada
    deactivate Mesa

    Funcionario -->> ClienteAtor: Notificação via Socket.io (comanda encerrada)
    Funcionario -->> FuncAtor: Painel atualizado (comanda removida da lista)
    deactivate Funcionario
```

---

## Notas de Consistência

### Mapeamento Lifelines → Classes

| Lifeline no Diagrama | Classe no Diagrama de Classes | Métodos Utilizados |
|----------------------|-------------------------------|--------------------|
| Cliente | `Cliente` | `autenticar()`, `fazerPedido()` |
| Cartao | `Cartao` | `validar()`, `liberar()` |
| Mesa | `Mesa` | `abrirComanda()`, `fecharComanda()` |
| Comanda | `Comanda` | `adicionarPedido()`, `calcularTotal()`, `solicitarFechamento()`, `encerrar()` |
| Pedido | `Pedido` | `atualizarStatus()`, `calcularSubtotal()` |
| ItemPedido | `ItemPedido` | `calcularSubtotal()` |
| ItemCardapio | `ItemCardapio` | (consulta de preço e disponibilidade) |
| Categoria | `Categoria` | (navegação e listagem de itens) |
| Funcionario | `Funcionario` | `atualizarStatusPedido()`, `confirmarPagamento()` |

### Enumerações Utilizadas

| Enumeração | Valores no Diagrama |
|------------|---------------------|
| `StatusPedido` | PENDENTE → EM_PREPARO → A_CAMINHO → ENTREGUE |
| `StatusComanda` | ABERTA → AGUARDANDO_PAGAMENTO → ENCERRADA |
