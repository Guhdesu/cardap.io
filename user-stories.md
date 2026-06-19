# User Stories — cardap.io

> Disciplina de Engenharia de Software 2026.1 — UNIFAP  
> Projeto Integrador: Sistema de Cardápio Digital com Gerência de Comandas

---

## Contexto do Projeto

O **cardap.io** é um sistema que permite a clientes de restaurantes/estabelecimentos visualizarem um cardápio digital, realizarem pedidos e acompanharem comandas. A identificação do cliente ocorre por meio de um cartão com QR Code entregue na chegada ao estabelecimento. Administradores e funcionários gerenciam o cardápio, os pedidos e as comandas por uma interface dedicada.

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
