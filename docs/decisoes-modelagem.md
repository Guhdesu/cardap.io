# Decisões de Modelagem — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP

---

## Visão Geral

O diagrama de classes do **cardap.io** foi construído a partir das User Stories levantadas na etapa anterior, mapeando os substantivos do domínio em classes e os verbos em métodos. O objetivo foi manter o modelo próximo da linguagem do negócio (domínio do restaurante), facilitando a comunicação com stakeholders não técnicos e a rastreabilidade entre requisitos e código.

---

## Decisões Principais

### 1. Separação entre `Comanda` e `Pedido`

Optamos por manter `Comanda` e `Pedido` como classes distintas, em vez de tratar cada pedido individualmente como uma comanda. Uma `Comanda` representa a **sessão completa da mesa** — desde a chegada até o pagamento — enquanto um `Pedido` representa **cada rodada de itens** solicitada pelo cliente dentro dessa sessão. Essa separação reflete o vocabulário real do restaurante e permite que o cliente faça múltiplos pedidos sem precisar fechar e reabrir uma comanda.

A relação entre `Comanda` e `Pedido` foi modelada como **composição** (`*--`), pois um `Pedido` não existe fora de uma `Comanda`; seu ciclo de vida depende diretamente dela.

### 2. Autenticação por Cartão/QR Code como entidade própria (`Cartao`)

O QR Code poderia ter sido apenas um atributo de `Mesa`, mas optamos por criar a classe `Cartao` com sua própria identidade. Isso permite que um cartão seja **reutilizado** em diferentes sessões (liberado após o encerramento da comanda), que múltiplos cartões sejam associados a uma mesa no futuro, e que a lógica de validação (`validar()`, `liberar()`) fique encapsulada na própria entidade — sem poluir `Mesa` com responsabilidades de autenticação.

### 3. Herança entre `Funcionario` e `Administrador`

`Administrador` herda de `Funcionario` porque todo administrador é também um funcionário do estabelecimento. Os métodos exclusivos de `Administrador` (`adicionarItemCardapio`, `editarItemCardapio`, `removerItemCardapio`) representam as permissões elevadas do papel. Optamos por herança em vez de composição aqui pois a relação semântica é de especialização ("um administrador **é um** funcionário"), e o comportamento base de funcionário (atualizar status de pedido, confirmar pagamento) permanece relevante para o administrador.

### 4. Uso de enumerações para estados

Os estados de `Comanda` (`StatusComanda`) e `Pedido` (`StatusPedido`) foram modelados como enumerações por dois motivos: garantem que apenas valores válidos sejam atribuídos em tempo de compilação e tornam as transições de estado explícitas e verificáveis. As transições seguem uma lógica de máquina de estados: `ABERTA → AGUARDANDO_PAGAMENTO → ENCERRADA` e `PENDENTE → EM_PREPARO → A_CAMINHO → ENTREGUE`.

### 5. `ItemPedido` como classe intermediária

A relação entre `Pedido` e `ItemCardapio` não é uma associação direta, pois um mesmo item pode ser pedido com **quantidades e observações diferentes** em pedidos distintos. A classe `ItemPedido` captura esses atributos contextuais (quantidade, observação, preço no momento do pedido) e evita que mudanças futuras no preço do `ItemCardapio` afetem o histórico de comandas já encerradas.

### 6. Snapshot de preço em `ItemPedido`

O atributo `precoUnitario` em `ItemPedido` armazena o preço **no momento do pedido**, não uma referência ao preço atual do `ItemCardapio`. Essa decisão preserva a integridade do histórico financeiro: se um prato muda de preço amanhã, a comanda de hoje deve continuar com o valor cobrado na hora do pedido.

---

## Linguagem Escolhida: TypeScript

O projeto utilizará **TypeScript** no backend e no frontend, pelas seguintes razões:

- **Tipagem estática**: o mapeamento entre as classes do diagrama UML e o código é direto, com verificação de tipos em tempo de compilação.
- **Suporte nativo a classes e interfaces**: enums, `readonly`, `private` e getters traduzem com fidelidade os conceitos de encapsulamento do diagrama.
- **Ecossistema unificado**: um único stack (Node.js no backend, React no frontend) reduz a curva de aprendizado e facilita o compartilhamento de tipos entre as camadas.

As classes traduzidas (`Comanda` e `ItemCardapio`) estão em [`src/models/`](../src/models/).
