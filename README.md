# cardap.io

> Sistema de cardápio digital com gerência de comandas via QR Code para restaurantes e estabelecimentos.

---

## Sobre o Projeto

O **cardap.io** é um sistema web que digitaliza a experiência de atendimento em restaurantes. Ao chegar ao estabelecimento, o cliente recebe um cartão com QR Code que o autentica no sistema e o vincula a uma mesa. A partir daí, pode visualizar o cardápio, realizar pedidos e acompanhar o status em tempo real — sem precisar chamar um garçom.

Administradores e funcionários contam com uma interface dedicada para gerenciar o cardápio (itens, preços, imagens) e as comandas abertas.

### Principais Funcionalidades

- Autenticação de clientes via QR Code
- Cardápio digital com imagens, descrições e categorias
- Realização de pedidos com observações por item
- Acompanhamento de status dos pedidos em tempo real
- Gerência de comandas pelo estabelecimento
- Cadastro, edição e remoção de itens do cardápio
- Fechamento de comanda e solicitação de pagamento

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [User Stories e Requisitos](user-stories.md) | 8 User Stories com critérios de aceitação e RNFs |
| [Diagrama de Classes](docs/diagrama-classes.md) | Modelo de classes do domínio (Mermaid) |
| [Decisões de Modelagem](docs/decisoes-modelagem.md) | Justificativa das escolhas de design |

### Código — Modelos Traduzidos

| Arquivo | Classe |
|---------|--------|
| [src/models/ItemCardapio.ts](src/models/ItemCardapio.ts) | Item do cardápio com preço, imagem e disponibilidade |
| [src/models/Comanda.ts](src/models/Comanda.ts) | Comanda da mesa com ciclo de vida e total |
| [src/models/types.ts](src/models/types.ts) | Enumerações de status e cargo |

---

## Equipe

| Nome | GitHub |
|------|--------|
| Gustavo Ferreira | [@Guhdesu](https://github.com/Guhdesu) |
| Isis Bruna | — |
| Denny Rodrigues | — |
| Johnny Gabriel | — |
| Saullo Augusto | — |

---

## Disciplina

**Engenharia de Software 2026.1**
Universidade Federal do Amapá — UNIFAP
