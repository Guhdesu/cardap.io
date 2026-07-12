# Próximos Passos e Planejamento de Desenvolvimento — cardap.io

Este documento detalha o planejamento dos próximos passos de desenvolvimento, melhorias arquiteturais e novas funcionalidades para a evolução da plataforma **cardap.io** para um ambiente comercial de produção.

---

## 1. Segurança & Autenticação do Staff (Prioridade Alta)
Atualmente, a rota `/staff` está acessível publicamente para fins de homologação rápida e validação de fluxo.

- **Desenvolvimento**:
  - Implementação de fluxo de Login `/staff/login` com credenciais salvas no banco de dados (senhas criptografadas via `bcrypt`).
  - Emissão de token JWT estruturado no backend para requisições autenticadas.
  - Implementação de Next.js Middleware no frontend para interceptar e validar sessões na rota `/staff/*`.
- **Documentação Relacionada**:
  - Atualização do diagrama de classes e detalhamento das rotas protegidas no repositório.

---

## 2. Fluxo Completo de Checkout & Fechamento de Comanda (Prioridade Alta)
A infraestrutura do banco de dados já possui o campo `status` ('aberta' | 'fechada') na tabela `comandas`. O próximo passo é integrar o fluxo de encerramento da comanda entre cliente e staff.

- **Desenvolvimento**:
  - **Lado do Cliente**: Botão "Solicitar Fechamento" na tela do cardápio. Isso enviará um sinal WebSocket em tempo real para a cozinha/staff.
  - **Lado do Staff**: Destaque visual (notificação sonora e borda vermelha pulsante) na comanda correspondente na aba "Mesas Ativas".
  - **Ação do Staff**: Botão "Confirmar Pagamento e Encerramento". Esta ação altera o status da comanda no banco para `fechada`, desvincula o cliente da mesa no frontend e libera a mesa para novas leituras de QR Code.
- **Documentação Relacionada**:
  - Diagrama de Transição de Estados da Comanda.

---

## 3. Persistência de Sessão do Cliente (UX / Resiliência)
Se o cliente atualizar o navegador ou a conexão cair no meio da experiência, ele perde o acesso direto à sua comanda.

- **Desenvolvimento**:
  - Guardar o ID da comanda associada e o ID da mesa no `localStorage` ou cookies HTTP-Only seguros do cliente.
  - Ao carregar a aplicação, validar se a comanda salva localmente ainda consta como `aberta` na API. Se sim, redirecioná-lo automaticamente de volta para a mesa `/mesa/[id]` com seu carrinho e histórico de pedidos intactos.

---

## 4. CRUD de Cardápio para o Staff (Gestão do Estabelecimento)
Permitir que gerentes atualizem o menu sem necessidade de comandos de SQL.

- **Desenvolvimento**:
  - Nova aba "Gerenciar Menu" no `/staff`.
  - Formulário para cadastrar novos itens, deletar pratos, ajustar preços em tempo real e alternar a flag de disponibilidade (`disponivel` true/false).
  - Atualização reativa: se um item for marcado como "indisponível", o cardápio do cliente deve desabilitar o botão de adicionar ao carrinho instantaneamente via WebSocket.

---

## 5. Upload Dinâmico de Imagens
Atualmente, as imagens do cardápio usam URLs estáticas hospedadas externamente.

- **Desenvolvimento**:
  - Integração com serviço de storage (Cloudinary, AWS S3 ou Supabase Storage).
  - Input de arquivo do tipo imagem no formulário de cadastro de item do cardápio do staff.

---

## 6. Dashboards & Métricas de Negócio (BI)
Oferecer inteligência para o dono do estabelecimento.

- **Desenvolvimento**:
  - Gráficos e tabelas mostrando:
    - Pratos mais pedidos da semana.
    - Tempo médio de preparo na cozinha (diferença de tempo entre status `pendente` e `pronto`).
    - Faturamento diário e ticket médio por mesa.
