# Gestão do Processo — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP  
> Prof. Dr. Adolfo Colares  
> Equipe: Gustavo Ferreira, Isis Bruna, Denny Rodrigues, Johnny Gabriel, Saullo Augusto

---

## 1. Metodologia Adotada

A equipe adotou a metodologia **Kanban** para gerenciar o fluxo de trabalho ao longo do semestre.

### Justificativa da Escolha

A escolha pelo Kanban em detrimento de metodologias como Scrum ou XP foi motivada pelos seguintes fatores:

1. **Equipe pequena com disponibilidade variável:** Com apenas 5 integrantes, cada um com horários acadêmicos e compromissos distintos, o Kanban oferece a flexibilidade necessária para que cada membro contribua de forma assíncrona, sem a rigidez de sprints fixos.

2. **Fluxo contínuo mais adequado que sprints fixos:** Em um projeto acadêmico semestral, o ritmo de desenvolvimento varia conforme provas, trabalhos de outras disciplinas e disponibilidade individual. O fluxo contínuo do Kanban se adapta naturalmente a essas oscilações, ao contrário de sprints de duração fixa que poderiam ficar subutilizados ou sobrecarregados.

3. **Visualização do trabalho em progresso:** O quadro Kanban permite que todos os membros da equipe visualizem rapidamente o estado de cada tarefa (A Fazer, Em Progresso, Em Revisão, Concluída), facilitando a identificação de gargalos — por exemplo, acúmulo de tarefas aguardando revisão de código.

4. **Limites de WIP (Work In Progress):** A definição de limites de tarefas em andamento por pessoa evita a sobrecarga de membros individuais e garante que o trabalho iniciado seja concluído antes de se iniciar novas frentes.

5. **Sem overhead de cerimônias:** O Kanban dispensa reuniões formais como Sprint Planning, Sprint Review e Sprint Retrospective, que em um contexto acadêmico com equipe pequena representariam overhead desnecessário. A comunicação da equipe ocorreu de forma direta via mensagens e revisões de código no GitHub.

### Quadro Kanban — Colunas

| Coluna | Descrição |
|--------|-----------|
| **Backlog** | Tarefas identificadas mas ainda não priorizadas para execução imediata |
| **A Fazer** | Tarefas priorizadas e prontas para serem iniciadas |
| **Em Progresso** | Tarefas em desenvolvimento ativo por um membro da equipe |
| **Em Revisão** | Tarefas com Pull Request aberto aguardando revisão de código |
| **Concluída** | Tarefas finalizadas, revisadas e integradas à branch principal |

---

## 2. Product Backlog

O backlog do produto foi definido a partir das 10 User Stories documentadas no [user-stories.md](../user-stories.md), priorizadas conforme o valor de negócio e as dependências técnicas identificadas.

| ID | User Story | Prioridade | Status |
|----|-----------|------------|--------|
| US-01 | Autenticação do cliente via QR Code — escanear o QR Code do cartão para ser autenticado e vinculado a uma mesa e comanda | 🔴 Alta | ✅ Concluída |
| US-02 | Visualização do cardápio digital — visualizar o cardápio completo com categorias, imagens, preços e descrições | 🔴 Alta | ✅ Concluída |
| US-03 | Realização de pedidos — selecionar itens, ajustar quantidades, adicionar observações e confirmar o pedido | 🔴 Alta | ✅ Concluída |
| US-04 | Gerência das comandas pelo estabelecimento — visualizar e gerenciar todas as comandas abertas em tempo real | 🔴 Alta | ✅ Concluída |
| US-05 | Gerenciamento de itens do cardápio — adicionar, editar, marcar como indisponível e remover itens (CRUD) | 🟡 Média | ✅ Concluída |
| US-06 | Upload e exibição de imagens nos itens — fazer upload de imagens para os itens do cardápio via Cloudinary | 🟡 Média | ✅ Concluída |
| US-07 | Acompanhamento do status do pedido pelo cliente — acompanhar em tempo real o status de cada item pedido | 🟡 Média | ✅ Concluída |
| US-08 | Fechamento de comanda e solicitação de pagamento — visualizar o total e solicitar o fechamento da comanda | 🟢 Baixa | ✅ Concluída |
| US-09 | Autenticação do administrador e funcionário — login com e-mail e senha com JWT e controle de perfis | 🔴 Alta | ✅ Concluída |
| US-10 | Cadastro de mesas e geração de QR Codes — cadastrar mesas e gerar QR Codes vinculados a cada uma | 🔴 Alta | ✅ Concluída |

### Critérios de Priorização

A priorização seguiu dois critérios principais:
- **Valor de negócio:** Funcionalidades essenciais para o fluxo mínimo viável (autenticação → cardápio → pedido → gerência) foram priorizadas como Alta.
- **Dependências técnicas:** A autenticação do staff (US-09) e o cadastro de mesas (US-10) foram tratados como Alta por serem pré-requisitos para outras funcionalidades.

---

## 3. Evidência de Fluxo de Trabalho

### 3.1 Planejamento e Documentação de Tarefas

O trabalho foi organizado em **7 tarefas de implementação detalhadas**, documentadas no diretório [`docs/tasks/`](tasks/README.md). Cada tarefa contém:

- **Contexto e objetivo** claros
- **Escopo detalhado** separado por backend e frontend
- **Critérios de aceitação** verificáveis
- **Prioridade e estimativa** em story points
- **Dependências** entre tarefas

As tarefas foram ordenadas por prioridade e organizadas em dois trilhos paralelos de desenvolvimento:

| Trilho | Tarefas | Foco |
|--------|---------|------|
| Trilho A | TAREFA-01 → TAREFA-05 → TAREFA-06 | Autenticação staff, CRUD cardápio, upload de imagens |
| Trilho B | TAREFA-03 → TAREFA-02 → TAREFA-04 → TAREFA-07 | Separação mesa/comanda, sessão cliente, checkout, métricas |

### 3.2 Controle de Versão e Colaboração

O repositório GitHub do projeto ([Guhdesu/cardap.io](https://github.com/Guhdesu/cardap.io)) foi a ferramenta central de colaboração da equipe. O fluxo de trabalho incluiu:

- **Commits descritivos:** Cada commit segue a convenção de prefixos (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`) para facilitar o rastreamento das mudanças.
- **Branches por funcionalidade:** Membros trabalharam em branches separadas para evitar conflitos no código principal.
- **Pull Requests com revisão de código:** As integrações à branch `main` passaram por Pull Requests revisados por pelo menos um outro membro da equipe.

### 3.3 Pull Requests Realizados

| PR | Descrição | Autor | Revisor |
|----|-----------|-------|---------|
| [PR #1](https://github.com/Guhdesu/cardap.io/pull/1) | Integração inicial de funcionalidades colaborativas | Denny Rodrigues | Gustavo Ferreira |
| [PR #2](https://github.com/Guhdesu/cardap.io/pull/2) | Implementação de fluxo de decisão de comanda e ações de encerramento | Denny Rodrigues | Gustavo Ferreira |
| [PR #3](https://github.com/Guhdesu/cardap.io/pull/3) | Merge final de contribuições do colaborador | Denny Rodrigues | Gustavo Ferreira |

### 3.4 Marcos de Desenvolvimento

| Marco | Commit | Descrição |
|-------|--------|-----------|
| Infraestrutura | `28d959c` | Deploy automático configurado no Render |
| Camada de Serviço | `9353380`–`816954f` | Criação de CardapioService, MesaService, PedidoService |
| Repositórios PostgreSQL | `4cc5ff4` | Migração de dados em memória para banco relacional |
| Autenticação Staff | `39ff023` | Login com JWT e proteção de rotas |
| Sessão Cliente QR | `be17bc5` | Fluxo seamless de autenticação via QR Code |
| Checkout | `66bbbfc` | Fluxo completo de fechamento de comanda |
| CRUD Cardápio | `e2dd623` | Interface administrativa de gerenciamento do menu |
| Upload de Imagens | `a17da00` | Integração com Cloudinary para imagens dos itens |

---

## 4. Lições Aprendidas

Ao longo do desenvolvimento do cardap.io, a equipe acumulou aprendizados importantes que impactaram tanto o produto final quanto a forma de trabalho colaborativo. Entre os pontos positivos, destaca-se a **definição clara de requisitos desde o início do projeto**: as 10 User Stories com critérios de aceitação bem definidos e a verificação INVEST serviram como guia confiável durante toda a implementação, reduzindo retrabalho por ambiguidade. A **arquitetura modular** adotada — com separação clara entre camadas de rotas, serviços e repositórios no backend, e componentização no frontend — facilitou o desenvolvimento paralelo e a manutenção do código. As **funcionalidades em tempo real** com Socket.io funcionaram de forma robusta, proporcionando uma experiência fluida para clientes e funcionários.

Por outro lado, a equipe reconhece desafios significativos. A **distribuição desigual de commits** entre os membros revela que a carga de trabalho não foi equilibrada ao longo do semestre, concentrando-se em poucos integrantes em momentos críticos. A **ausência de testes automatizados** desde o início resultou em um código funcional mas sem rede de segurança contra regressões — bugs introduzidos em funcionalidades já estáveis consumiram tempo de depuração que poderia ter sido evitado. Além disso, a **documentação foi produzida tardiamente**, muitas vezes após a implementação, quando o ideal seria tê-la como parte do processo de desenvolvimento.

Se pudéssemos recomeçar, a equipe optaria por **adotar TDD (Test-Driven Development)** desde a primeira tarefa, garantindo cobertura de testes para as rotas críticas da API. Também configuraríamos **CI/CD (Integração Contínua e Deploy Contínuo)** desde o início, com execução automática de testes e lint a cada push. A **distribuição de tarefas seria mais explícita**, com atribuição formal de responsáveis no quadro Kanban e **reuniões semanais curtas (stand-ups de 15 minutos)** para alinhar progresso, impedimentos e próximos passos — mesmo que assíncronas, via mensagem gravada. Essas práticas teriam aumentado a qualidade do código, a previsibilidade das entregas e o engajamento de todos os membros da equipe.

---

## Referências

- [User Stories e Requisitos](../user-stories.md)
- [Tarefas de Desenvolvimento](tasks/README.md)
- [Decisões de Modelagem](decisoes-modelagem.md)
- [Próximos Passos](proximos-passos.md)
- [Repositório GitHub](https://github.com/Guhdesu/cardap.io)
