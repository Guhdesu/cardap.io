# User Stories — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP  
> Projeto Integrador: Sistema de Cardápio Digital com Gerência de Comandas

---

## Contexto e Descrição do Problema

O **cardap.io** é um sistema que permite a clientes de restaurantes e estabelecimentos visualizarem um cardápio digital, realizarem pedidos e acompanharem comandas. A identificação do cliente ocorre por meio de um cartão com QR Code entregue na chegada ao estabelecimento. Administradores e funcionários gerenciam o cardápio, os pedidos e as comandas por uma interface dedicada.

O problema central que o sistema resolve é a ineficiência no atendimento presencial em horários de pico, onde clientes enfrentam lentidão para visualizar o cardápio, fazer pedidos e solicitar a conta devido à limitação da quantidade de garçons. O sistema dá autonomia ao cliente (que acessa o cardápio digital pelo próprio smartphone) e otimiza a operação do estabelecimento, que passa a receber os pedidos diretamente na cozinha de forma digital e em tempo real.

---

## Requisitos Funcionais

Abaixo estão os Requisitos Funcionais (RF) que o sistema deve atender, derivados das histórias de usuário.

*   **RF01** — O sistema deve permitir a autenticação do cliente via leitura de QR Code vinculado a uma mesa.
*   **RF02** — O sistema deve bloquear acesso ao cardápio caso o QR Code seja inválido, expirado ou já esteja em uso por outra sessão ativa.
*   **RF03** — O sistema deve exibir o cardápio digital organizado por categorias, contendo nome, descrição, preço e imagem de cada item.
*   **RF04** — O sistema deve permitir que o cliente adicione itens a um carrinho virtual, ajuste quantidades e insira observações textuais (ex.: "sem cebola").
*   **RF05** — O sistema deve registrar os pedidos do cliente, vinculando-os à sua comanda e enviando-os para a interface do estabelecimento em tempo real.
*   **RF06** — O sistema deve permitir que funcionários visualizem as comandas abertas e atualizem o status dos pedidos ("Pendente", "Em Preparo", "A Caminho", "Entregue").
*   **RF07** — O sistema deve permitir que o cliente acompanhe o status dos seus pedidos em tempo real na sua própria tela.
*   **RF08** — O sistema deve possuir uma área administrativa protegida por login e senha (com JWT).
*   **RF09** — O sistema deve permitir que o administrador gerencie os itens do cardápio (adicionar, editar, remover e marcar como indisponível).
*   **RF10** — O sistema deve permitir que o administrador faça upload de imagens para os itens do cardápio (formato JPG/PNG, até 5MB).
*   **RF11** — O sistema deve permitir que o administrador cadastre mesas e gere os QR Codes correspondentes.
*   **RF12** — O sistema deve permitir que o cliente visualize o total da sua comanda e solicite o fechamento para pagamento.

---

## Descrição do Problema

Restaurantes e estabelecimentos gastronômicos enfrentam gargalos operacionais no fluxo de atendimento presencial: dependência de garçons para anotar pedidos, erros de comunicação entre salão e cozinha, falta de visibilidade do cliente sobre o andamento de seus itens e dificuldade em manter cardápios físicos atualizados com preços, disponibilidade e imagens dos pratos. O **cardap.io** resolve esses problemas oferecendo um sistema web de cardápio digital com gerência de comandas via QR Code, destinado a três perfis de usuário: o **cliente** do restaurante, que escaneia um cartão com QR Code para se autenticar, visualizar o cardápio, realizar pedidos e acompanhar o status em tempo real; o **funcionário**, que gerencia as comandas abertas e atualiza o status de cada pedido pelo painel administrativo; e o **administrador**, que, além das funções de funcionário, cadastra e edita itens do cardápio, gerencia mesas e gera QR Codes para os cartões físicos.

---

## Requisitos Funcionais

Os requisitos funcionais abaixo foram derivados das User Stories (US-01 a US-10) e representam as capacidades que o sistema deve oferecer:

| ID | Requisito Funcional |
|----|--------------------|
| **RF01** | O sistema deve permitir que o cliente se autentique escaneando o QR Code do cartão vinculado à mesa, sendo associado automaticamente a uma mesa e a uma comanda sem nenhuma etapa adicional de login. |
| **RF02** | O sistema deve exibir o cardápio digital completo, organizado em categorias, com nome, descrição, preço e imagem de cada item, permitindo filtragem por categoria e busca por nome. |
| **RF03** | O sistema deve permitir que itens marcados como indisponíveis sejam exibidos com indicação visual de "Esgotado" e não possam ser adicionados ao pedido. |
| **RF04** | O sistema deve permitir que o cliente selecione itens do cardápio, ajuste quantidades, adicione observações textuais por item e confirme o pedido, que será vinculado à sua comanda. |
| **RF05** | O sistema deve exibir todas as comandas abertas em tempo real no painel do funcionário, com número da mesa, itens pedidos, quantidades, horário e status de cada pedido. |
| **RF06** | O sistema deve permitir que o funcionário altere o status de cada item entre: "Pendente", "Em Preparo", "A Caminho" e "Entregue". |
| **RF07** | O sistema deve permitir que o administrador cadastre, edite, marque como indisponível e remova itens do cardápio, incluindo upload de imagens nos formatos JPG e PNG com tamanho máximo de 5 MB. |
| **RF08** | O sistema deve permitir que o cliente acompanhe em tempo real o status de cada item pedido, com atualização automática via WebSocket e notificação visual ao mudar de status. |
| **RF09** | O sistema deve permitir que o cliente visualize o total da comanda e solicite o fechamento, bloqueando novos pedidos e alertando o funcionário responsável. |
| **RF10** | O sistema deve permitir que administradores e funcionários façam login com e-mail e senha, recebendo um token JWT com expiração de 8 horas, com acesso ao painel correspondente ao seu perfil. |
| **RF11** | O sistema deve permitir que o administrador cadastre mesas e gere QR Codes vinculados, exportáveis como PNG para impressão nos cartões físicos. |
| **RF12** | O sistema deve reativar automaticamente o QR Code de uma mesa após o encerramento da comanda, sem necessidade de gerar um novo token. |

### Rastreabilidade: Requisitos Funcionais ↔ User Stories

| Requisito | User Story de Origem |
|-----------|---------------------|
| RF01 | US-01 (Autenticação via QR Code) |
| RF02 | US-02 (Visualização do cardápio) |
| RF03 | US-02 (Visualização do cardápio), US-05 (Gerenciamento de itens) |
| RF04 | US-03 (Realização de pedidos) |
| RF05 | US-04 (Gerência das comandas) |
| RF06 | US-04 (Gerência das comandas) |
| RF07 | US-05 (Gerenciamento de itens), US-06 (Upload de imagens) |
| RF08 | US-07 (Acompanhamento do status) |
| RF09 | US-08 (Fechamento de comanda) |
| RF10 | US-09 (Autenticação admin/funcionário) |
| RF11 | US-10 (Cadastro de mesas e QR Codes) |
| RF12 | US-08 (Fechamento de comanda), US-10 (QR Codes) |

---

## User Stories (ordenadas por prioridade)

---

### US-01 — Autenticação do cliente via QR Code
**Prioridade:** Alta

> Como **cliente do restaurante**, quero **escanear o QR Code do cartão entregue na minha chegada**, para que **eu seja autenticado no sistema e vinculado automaticamente a uma mesa e a uma comanda**.

**Critérios de Aceitação:**
1. O QR Code deve conter um identificador único que o sistema vincula a uma mesa específica; ao escanear, o cliente é associado a essa mesa sem nenhuma etapa adicional de login.
2. Após a leitura bem-sucedida, o sistema exibe uma tela de confirmação com o número da mesa e permite acesso imediato ao cardápio.
3. Se o QR Code for inválido, expirado ou já estiver vinculado a uma sessão ativa, o sistema exibe uma mensagem de erro descritiva e não permite acesso.
4. O acesso ao cardápio e à realização de pedidos fica bloqueado enquanto o QR Code não for validado.

**Verificação INVEST:**
- **I**ndependente: não depende de outras histórias para ser implementada.
- **N**egociável: o fluxo de validação (ex.: expiração do QR Code) pode ser ajustado.
- **V**aliosa: sem autenticação, nenhuma outra funcionalidade do cliente funciona.
- **E**stimável: escopo bem definido, estimável em 5–8 pontos de story.
- **S**mall: foco em um único fluxo (escanear → validar → redirecionar).
- **T**estável: testável com QR Codes válido, inválido e duplicado.

---

### US-02 — Visualização do cardápio digital
**Prioridade:** Alta

> Como **cliente autenticado**, quero **visualizar o cardápio completo com categorias, imagens, preços e descrições**, para que **eu possa conhecer as opções disponíveis e escolher o que desejo pedir**.

**Critérios de Aceitação:**
1. O cardápio é organizado em categorias (ex.: Entradas, Pratos Principais, Bebidas, Sobremesas), navegáveis por abas ou menu lateral.
2. Cada item exibe nome, descrição, preço e imagem; caso não haja imagem cadastrada, uma imagem padrão é exibida.
3. Itens marcados como indisponíveis são exibidos com indicação visual clara (ex.: "Esgotado") e não podem ser adicionados ao pedido.
4. O cliente pode filtrar itens por categoria ou buscar pelo nome.

**Verificação INVEST:**
- **I**ndependente: pode ser desenvolvida separadamente da US-03 (pedidos).
- **N**egociável: layout, filtros e categorias são ajustáveis.
- **V**aliosa: é a vitrine do estabelecimento; sem ela o cliente não sabe o que pedir.
- **E**stimável: 5–8 pontos.
- **S**mall: focada apenas na exibição, sem lógica de pedido.
- **T**estável: verificável visualmente e via testes de filtragem/busca.

---

### US-03 — Realização de pedidos
**Prioridade:** Alta

> Como **cliente autenticado**, quero **selecionar itens do cardápio, ajustar quantidades, adicionar observações e confirmar o pedido**, para que **minha solicitação chegue à cozinha ou ao bar sem precisar chamar um garçom**.

**Critérios de Aceitação:**
1. O cliente pode adicionar itens a um carrinho, ajustar a quantidade de cada um e removê-los antes de confirmar.
2. É possível incluir uma observação textual por item (ex.: "sem cebola", "ponto médio").
3. Ao confirmar, o sistema registra o horário do pedido, vincula-o à comanda do cliente e exibe uma confirmação visual na tela.
4. Após a confirmação, o pedido aparece imediatamente na interface de gerência do estabelecimento.

**Verificação INVEST:**
- **I**ndependente: separável da US-04 (gerência de comanda) com contrato de API definido.
- **N**egociável: comportamento do carrinho (ex.: pedidos parciais) é negociável.
- **V**aliosa: entrega o principal valor ao cliente — autonomia para pedir.
- **E**stimável: 8–13 pontos (envolve lógica de estado do carrinho).
- **S**mall: limitada ao fluxo de seleção e envio; status do pedido é tratado na US-07.
- **T**estável: verificável com pedidos válidos, vazios e com itens indisponíveis.

---

### US-04 — Gerência das comandas pelo estabelecimento
**Prioridade:** Alta

> Como **funcionário do restaurante**, quero **visualizar e gerenciar todas as comandas abertas em tempo real**, para que **eu possa acompanhar os pedidos de cada mesa e atualizar o status de atendimento**.

**Critérios de Aceitação:**
1. A interface administrativa lista todas as comandas abertas com número da mesa, itens pedidos, quantidades e horário de cada pedido.
2. O funcionário pode alterar o status de cada item entre: "Pendente", "Em Preparo", "A Caminho" e "Entregue".
3. Pedidos aguardando atualização de status por mais de 10 minutos são destacados visualmente (ex.: cor laranja/vermelho).
4. O funcionário pode adicionar itens manualmente a uma comanda aberta (ex.: pedido via voz/papel).

**Verificação INVEST:**
- **I**ndependente: depende da existência de pedidos (US-03) apenas para ter dados; a tela em si é independente.
- **N**egociável: limites de tempo de alerta e fluxo de status são negociáveis.
- **V**aliosa: permite ao estabelecimento operar o serviço de forma eficiente.
- **E**stimável: 8–13 pontos.
- **S**mall: focada na visualização e atualização de status, sem fechamento de conta.
- **T**estável: verificável com comandas em diferentes estados e tempos.

---

### US-05 — Gerenciamento de itens do cardápio
**Prioridade:** Média

> Como **administrador do sistema**, quero **adicionar, editar, marcar como indisponível e remover itens do cardápio**, para que **o menu digital reflita sempre a oferta real do estabelecimento**.

**Critérios de Aceitação:**
1. O administrador pode cadastrar um item informando: nome, categoria, preço, descrição e imagem (opcional).
2. Todos os campos de um item existente podem ser editados individualmente.
3. O administrador pode marcar um item como "indisponível" sem excluí-lo, mantendo seu histórico.
4. Antes de excluir definitivamente um item, o sistema solicita confirmação explícita do administrador.

**Verificação INVEST:**
- **I**ndependente: não depende de nenhuma outra US para ser implementada.
- **N**egociável: campos obrigatórios/opcionais e regras de categoria são negociáveis.
- **V**aliosa: sem essa US, o cardápio não pode ser mantido atualizado.
- **E**stimável: 5–8 pontos.
- **S**mall: CRUD focado; upload de imagem separado na US-06.
- **T**estável: testável com todas as operações CRUD e validações de campos.

---

### US-06 — Upload e exibição de imagens nos itens
**Prioridade:** Média

> Como **administrador do sistema**, quero **fazer upload de imagens para os itens do cardápio**, para que **os clientes possam visualizar os pratos antes de realizar seus pedidos**.

**Critérios de Aceitação:**
1. O sistema aceita uploads nos formatos JPG e PNG com tamanho máximo de 5 MB por imagem.
2. A imagem é exibida como miniatura no cardápio e em tamanho ampliado ao ser tocada/clicada pelo cliente.
3. Caso nenhuma imagem seja cadastrada para um item, o sistema exibe uma imagem padrão genérica do estabelecimento.
4. O administrador pode substituir a imagem de qualquer item a qualquer momento, sem precisar recriar o item.

**Verificação INVEST:**
- **I**ndependente: pode ser desenvolvida após a US-05 com interface de upload separada.
- **N**egociável: formatos aceitos, tamanho máximo e comportamento do modal são negociáveis.
- **V**aliosa: imagens aumentam a taxa de conversão de pedidos.
- **E**stimável: 3–5 pontos.
- **S**mall: foco exclusivo no upload e exibição de imagem.
- **T**estável: verificável com arquivos válidos, inválidos e acima do tamanho limite.

---

### US-07 — Acompanhamento do status do pedido pelo cliente
**Prioridade:** Média

> Como **cliente autenticado**, quero **acompanhar em tempo real o status de cada item que pedi**, para que **eu saiba quando meu pedido está sendo preparado, está a caminho ou já foi entregue**.

**Critérios de Aceitação:**
1. A tela do cliente exibe cada item pedido com seu status atual: "Pendente", "Em Preparo", "A Caminho" ou "Entregue".
2. O status é atualizado automaticamente sem que o cliente precise recarregar a página.
3. O cliente recebe uma notificação visual (ex.: banner, toast) sempre que o status de algum item mudar.
4. O histórico completo dos pedidos feitos na sessão está acessível ao cliente durante toda a permanência.

**Verificação INVEST:**
- **I**ndependente: depende do contrato de dados de status definido na US-04, mas pode ser desenvolvida em paralelo.
- **N**egociável: tipo de notificação (push, visual, sonora) é negociável.
- **V**aliosa: reduz chamados ao garçom e melhora a experiência do cliente.
- **E**stimável: 5–8 pontos (inclui comunicação em tempo real).
- **S**mall: focada em leitura/exibição de status, sem alterá-lo.
- **T**estável: verificável com simulação de mudanças de status em tempo real.

---

### US-08 — Fechamento de comanda e solicitação de pagamento
**Prioridade:** Baixa

> Como **cliente autenticado**, quero **visualizar o total da minha comanda e solicitar o fechamento**, para que **eu possa efetuar o pagamento e encerrar minha visita ao restaurante**.

**Critérios de Aceitação:**
1. O cliente pode visualizar a qualquer momento todos os itens pedidos, quantidades, preços unitários e o valor total da comanda.
2. Ao solicitar o fechamento, o sistema gera um alerta imediato para o funcionário responsável.
3. Após a solicitação de fechamento, novos pedidos ficam bloqueados na sessão do cliente.
4. Após o funcionário confirmar o pagamento, a comanda é encerrada e o QR Code daquele cartão é liberado para reutilização.

**Verificação INVEST:**
- **I**ndependente: separável do fluxo de pedidos; pode ser implementada por último.
- **N**egociável: fluxo de confirmação de pagamento (ex.: integração com maquininha) é negociável.
- **V**aliosa: fecha o ciclo completo de uso do sistema.
- **E**stimável: 5–8 pontos.
- **S**mall: focada no fechamento; processamento de pagamento não está no escopo desta US.
- **T**estável: verificável com solicitação de fechamento e liberação do QR Code.

---

### US-09 — Autenticação do administrador e funcionário
**Prioridade:** Alta

> Como **administrador ou funcionário do restaurante**, quero **fazer login com e-mail e senha**, para que **eu possa acessar o painel de gerenciamento de forma segura e com permissões adequadas ao meu perfil**.

**Critérios de Aceitação:**
1. O sistema disponibiliza uma tela de login separada da interface do cliente, acessível apenas por URL direta (ex.: `/admin/login`).
2. Após autenticação bem-sucedida, o sistema emite um token JWT com expiração de 8 horas e redireciona o usuário para o painel correspondente ao seu perfil (admin ou funcionário).
3. Administradores têm acesso a todas as funcionalidades (gerência de cardápio, mesas, comandas e usuários); funcionários têm acesso restrito à gerência de comandas.
4. Após 5 tentativas de login inválidas consecutivas, a conta é bloqueada temporariamente por 15 minutos e o usuário é notificado.

**Verificação INVEST:**
- **I**ndependente: pode ser desenvolvida antes das US-04 e US-05, pois estas dependem de um usuário autenticado.
- **N**egociável: duração do bloqueio, validade do token e número de tentativas são ajustáveis.
- **V**aliosa: sem autenticação, o painel admin ficaria exposto a qualquer usuário.
- **E**stimável: 5–8 pontos.
- **S**mall: foco no fluxo de login e controle de acesso por role; cadastro de usuários é escopo do admin.
- **T**estável: verificável com credenciais válidas, inválidas, expiradas e bloqueio por tentativas.

---

### US-10 — Cadastro de mesas e geração de QR Codes
**Prioridade:** Alta

> Como **administrador do sistema**, quero **cadastrar as mesas do estabelecimento e gerar QR Codes vinculados a cada uma**, para que **os clientes possam se autenticar e iniciar uma comanda ao escanear o cartão entregue na chegada**.

**Critérios de Aceitação:**
1. O administrador pode cadastrar mesas informando apenas o número identificador; o sistema gera automaticamente um token único e o QR Code correspondente.
2. O QR Code de cada mesa pode ser exportado como imagem (PNG) para impressão e colagem nos cartões físicos.
3. Ao remover uma mesa, o QR Code vinculado é automaticamente invalidado; escaneamentos posteriores retornam erro de "mesa inativa".
4. Após o fechamento de uma comanda (US-08), o QR Code daquela mesa é automaticamente reativado para a próxima sessão, sem necessidade de gerar um novo.

**Verificação INVEST:**
- **I**ndependente: depende da US-09 (admin autenticado), mas pode ser planejada em paralelo.
- **N**egociável: formato de exportação do QR Code (PNG, PDF, tamanho) e campos da mesa são ajustáveis.
- **V**aliosa: sem essa US, a US-01 (autenticação do cliente) não tem QR Codes para escanear.
- **E**stimável: 5–8 pontos.
- **S**mall: focada na criação e gerência do vínculo mesa ↔ QR Code; sessão do cliente é tratada na US-01.
- **T**estável: verificável com criação, exportação, invalidação e reativação de QR Codes.

---

## Requisitos Não-Funcionais

Utilizando **FURPS+** como referência:

---

### RNF-01 — Desempenho (Performance)
O cardápio digital deve ser completamente carregado — incluindo imagens dos itens — em **no máximo 2 segundos** em uma conexão móvel 4G (≥ 10 Mbps de download), medido pelo tempo de carregamento da página principal do cardápio via ferramenta de auditoria (ex.: Lighthouse ou WebPageTest).

---

### RNF-02 — Disponibilidade (Reliability)
O sistema deve estar disponível **99% do tempo** durante o horário de funcionamento cadastrado pelo estabelecimento, tolerando no máximo **5 minutos de interrupção não planejada por mês**. Falhas de comunicação em tempo real (ex.: atualização de status) devem ser sinalizadas ao usuário em até 3 segundos.

---

### RNF-03 — Usabilidade (Usability)
A interface voltada ao cliente deve ser **responsiva e funcional em dispositivos móveis com tela mínima de 4 polegadas**, sem necessidade de scroll horizontal, com elementos de toque com área mínima de 44×44 px, seguindo as diretrizes de acessibilidade **WCAG 2.1 nível AA**. Nenhum fluxo principal (escanear QR Code → visualizar cardápio → fazer pedido) deve exigir mais de **4 toques/cliques** do início ao fim.

---

### RNF-04 — Segurança (Security)
O acesso ao painel administrativo deve ser protegido por **autenticação via JWT** com expiração máxima de 8 horas, sem renovação automática. Todas as rotas da API que manipulam dados sensíveis (comandas, usuários, cardápio) devem exigir um token válido; requisições sem token ou com token expirado recebem HTTP 401. Os dados de sessão do cliente (vinculados ao QR Code) devem ser isolados por comanda — um cliente não pode acessar dados de outra mesa. Senhas de usuários devem ser armazenadas com hash bcrypt (fator de custo ≥ 10).

---

### RNF-05 — Suportabilidade (Supportability)
O sistema deve ser compatível com as versões recentes dos principais navegadores (Chrome 120+, Safari 17+, Firefox 120+, Edge) tanto em desktop quanto em dispositivos móveis. A interface web do cliente (frontend) deve adaptar seu layout (responsividade) para suportar resoluções de tela variadas, garantindo uso adequado desde telas de 4 polegadas (smartphones) até telas de 27 polegadas (monitores desktop).

---

### RNF-05 — Suportabilidade (Supportability)
O sistema deve ser compatível com os navegadores **Google Chrome 120+**, **Safari 17+**, **Firefox 120+** e seus equivalentes em dispositivos móveis (Android e iOS). O frontend deve ser **responsivo**, adaptando-se corretamente a telas com tamanhos entre **4 polegadas** (smartphones compactos) e **27 polegadas** (monitores de mesa do painel administrativo), sem quebra de layout, scroll horizontal indesejado ou perda de funcionalidade em nenhuma resolução dentro dessa faixa.

---

## Resumo para Apresentação (3 min)

### 3 User Stories mais prioritárias
| # | User Story | Critérios-chave |
|---|-----------|-----------------|
| US-01 | Autenticação via QR Code | QR único por mesa; erro para QR inválido; bloqueio sem autenticação |
| US-02 | Visualização do cardápio | Categorias; imagem + preço + descrição; indisponíveis destacados |
| US-03 | Realização de pedidos | Carrinho com observações; confirmação visual; registro em tempo real |

### Requisito não-funcional mais crítico
**RNF-02 — Disponibilidade**, pois uma queda do sistema durante o horário de pico do restaurante impede clientes de pedidos e paralisa a operação do estabelecimento inteiro. Os demais RNFs afetam a qualidade; este afeta a operabilidade.

### Principal dificuldade encontrada
**Priorização e escopo** da US-04 (gerência de comandas): definir o que pertence à gestão de comanda versus ao fechamento (US-08), e até onde vai o papel do funcionário versus do cliente, gerou sobreposição de responsabilidades que exigiu renegociação do escopo de ambas as histórias.

---

## Glossário

*   **Comanda**: Registro que agrupa todos os pedidos realizados por um cliente (ou grupo em uma mesma mesa) durante uma única sessão/visita ao estabelecimento, sendo a base para o fechamento da conta.
*   **Mesa**: Local físico no restaurante onde os clientes se acomodam. Uma mesa pode ter uma ou mais comandas abertas simultaneamente (se cada pessoa do grupo escanear seu próprio QR Code).
*   **QR Code**: Código bidimensional impresso em um cartão e vinculado a uma mesa específica. Serve como credencial única para que o cliente acesse o cardápio sem precisar criar conta.
*   **Sessão do Cliente**: O período de tempo e estado que se inicia quando o cliente escaneia o QR Code e finaliza quando a conta é paga e a comanda é encerrada.
*   **Pedido**: Uma solicitação individual de um ou mais itens do cardápio enviada de uma vez pelo cliente para a cozinha/bar.
*   **Item do Cardápio**: Produto (prato, bebida, sobremesa) que está disponível para ser pedido pelo cliente.
*   **Carrinho**: Espaço temporário na interface do cliente onde ele agrupa itens que deseja pedir antes de confirmar e enviar definitivamente para a cozinha.
*   **MVP (Minimum Viable Product)**: Produto Mínimo Viável, versão inicial do sistema que contempla apenas as funcionalidades (User Stories) essenciais para seu funcionamento básico (ex.: autenticar, pedir, gerenciar status).

---

## Glossário

| Termo | Definição |
|-------|-----------|
| **Cardápio Digital** | Interface web que exibe os itens disponíveis para pedido no estabelecimento, organizados por categorias, com nome, descrição, preço e imagem. |
| **Carrinho** | Estrutura temporária no lado do cliente que acumula os itens selecionados (com quantidades e observações) antes da confirmação do pedido. Após a confirmação, os itens são convertidos em um `Pedido` vinculado à comanda. |
| **Comanda** | Registro que agrupa todos os pedidos de uma sessão individual do cliente. Possui um ciclo de vida com três estados: `aberta` (pedidos em andamento), `fechamento_solicitado` (cliente pediu a conta) e `encerrada` (pagamento confirmado pelo funcionário). |
| **Item do Cardápio** | Produto disponível para pedido (prato, bebida, sobremesa, etc.), com atributos como nome, descrição, preço, categoria, imagem e flag de disponibilidade. |
| **Item de Pedido** | Registro intermediário que associa um `Item do Cardápio` a um `Pedido`, capturando a quantidade, observação textual e o preço unitário no momento do pedido (snapshot). |
| **Mesa** | Representação digital de uma mesa física do restaurante, identificada por um número. Pode estar nos estados `livre` ou `ocupada`. |
| **MVP** | *Minimum Viable Product* (Produto Mínimo Viável) — versão inicial do sistema com as funcionalidades essenciais para validar o conceito: autenticação via QR Code, cardápio digital, realização de pedidos e gerência de comandas. |
| **Pedido** | Conjunto de itens solicitados pelo cliente em uma única rodada dentro de uma comanda. Cada item de pedido possui status individual que progride de `pendente` → `em_preparo` → `a_caminho` → `entregue`. |
| **QR Code** | Código bidimensional impresso em um cartão físico entregue ao cliente na chegada ao restaurante. Contém um token UUID único que identifica e autentica o cliente no sistema, vinculando-o a uma mesa e a uma comanda. |
| **Sessão do Cliente** | Identidade temporária criada quando o cliente escaneia o QR Code. Delimita o acesso ao cardápio e aos pedidos durante a permanência no restaurante. Não há cadastro nem login tradicional — o QR Code é a única credencial. Encerrada quando o funcionário confirma o pagamento. |
| **Status do Pedido** | Estado atual de um item de pedido no fluxo de atendimento. Segue a progressão: `Pendente` (aguardando preparo) → `Em Preparo` (na cozinha/bar) → `A Caminho` (saindo para a mesa) → `Entregue` (recebido pelo cliente). |
| **WebSocket** | Protocolo de comunicação bidirecional persistente entre cliente e servidor, utilizado via Socket.io para atualizar o status dos pedidos em tempo real, sem necessidade de recarregar a página. |
