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

## Tecnologias

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | [Next.js](https://nextjs.org/) | Interface do cliente (cardápio, pedidos, status) e painel admin |
| Backend | [Express](https://expressjs.com/) | API REST e gerenciamento de sessões/autenticação |
| Banco de dados | [PostgreSQL](https://www.postgresql.org/) | Armazenamento relacional de mesas, cardápio, pedidos e comandas |
| Tempo real | [Socket.io](https://socket.io/) | Atualização de status de pedidos sem recarregar a página |

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Backend

```bash
cd backend
cp .env.example .env
# Configure as variáveis de ambiente no .env:
#   DATABASE_URL  → string de conexão do PostgreSQL
#   JWT_SECRET    → segredo para assinar tokens JWT
npm install
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> O backend roda em `http://localhost:3001` e o frontend em `http://localhost:3000`.

---

## 🧪 Testes Automatizados

O sistema conta com uma suíte de testes unitários e de integração desenvolvida com **Jest** e **Supertest**, cobrindo regras de negócio, serviços e rotas da API.

Para rodar os testes e gerar o relatório de cobertura (coverage):

```bash
cd backend
npm run test
# ou
npx jest --coverage
```

---

## Arquitetura

```
Cliente (Browser / Mobile)
         │  HTTPS
         ▼
    Next.js (Frontend SSR)
         │  REST API + WebSocket
         ▼
    Express (Backend API)
         │  SQL
         ▼
    PostgreSQL (Database)
```

**Fluxo principal do cliente:** QR Code escaneado → token validado pela API → mesa e comanda associadas → acesso ao cardápio liberado.

**Fluxo do funcionário:** login com e-mail/senha → JWT retornado → painel administrativo carrega comandas abertas em tempo real via WebSocket.

---

## Banco de Dados

Descrição das entidades, intenções de design e diagrama de relacionamentos: [docs/database.md](docs/database.md)

---

## Documentação

### Requisitos e Modelagem

| Documento | Descrição |
|-----------|-----------|
| [User Stories e Requisitos](user-stories.md) | 10 User Stories com critérios de aceitação e RNFs |
| [Banco de Dados — Entidades e Relacionamentos](docs/database.md) | Esquema do banco, entidades e relacionamentos |
| [Diagrama de Classes](docs/diagrama-classes.md) | Modelo de classes do domínio (Mermaid/UML) |
| [Decisões de Modelagem](docs/decisoes-modelagem.md) | Justificativa das escolhas de design |

### Processo e Planejamento

| Documento | Descrição |
|-----------|-----------|
| [Gestão do Processo](docs/processo.md) | Metodologia Kanban, backlog, evidências de fluxo e lições aprendidas |
| [Tarefas de Desenvolvimento](docs/tasks/README.md) | Índice com 7 tarefas detalhadas ordenadas por prioridade |
| [Próximos Passos e Planejamento](docs/proximos-passos.md) | Visão geral do roadmap de desenvolvimento |
| Testes Automatizados (Jest) | Suíte de testes em `backend/src/__tests__` que cobre Domain, Services e Integração API |

---

## Equipe

| Nome | GitHub |
|------|--------|
| Gustavo Ferreira | [@Guhdesu](https://github.com/Guhdesu) |
| Isis Bruna | — |
| Denny Rodrigues | [@DennyCarmo](https://github.com/DennyRodrigues/) |
| Johnny Gabriel | — |
| Saullo Augusto | — |

---

## Disciplina

**Engenharia de Software 2026.1**
Universidade Federal do Amapá — UNIFAP
