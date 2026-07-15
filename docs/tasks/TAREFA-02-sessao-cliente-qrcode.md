# TAREFA-02 — Sessão Seamless do Cliente via QR Code Token

> **Prioridade:** 🔴 Alta  
> **User Story:** US-01, US-10  
> **Estimativa:** 5–8 pontos  
> **Dependências:** TAREFA-03 (separação Mesa/Comanda) — a sessão real é construída sobre a fundação arquitetural correta.

---

## Contexto

Atualmente o cliente acessa `/mesa/[numero]` diretamente, sem nenhuma validação de sessão — qualquer pessoa pode digitar a URL e acessar qualquer mesa. O sistema precisar implementar o fluxo real de autenticação via QR Code descrito em `user-stories.md` (US-01) e `docs/database.md`.

O fluxo correto é:
1. **QR Code** contém a URL `cardap.io/entrar?token=UUID`
2. Backend valida o token → cria `sessao_cliente` → retorna cookie de sessão
3. Cliente cai no cardápio da sua mesa, já identificado, sem nenhum login

---

## Objetivo

Implementar a autenticação zero-fricção do cliente via token único embutido no QR Code, substituindo o acesso direto por número de mesa.

---

## Escopo

### Banco de Dados

- [ ] **Migração**: Criar tabela `qr_codes` conforme spec em `docs/database.md`:
  - `id`, `mesa_id` (FK → mesas), `token` (UUID, UNIQUE), `ativo` (boolean), `criado_em`
- [ ] **Migração**: Criar tabela `sessoes_cliente`:
  - `id`, `qr_code_id` (FK → qr_codes), `mesa_id` (FK → mesas), `iniciada_em`, `encerrada_em` (nullable)
- [ ] **Seed**: Gerar automaticamente 1 QR Code ativo por mesa (mesas 1–8) na migração inicial.

### Backend

- [ ] **Rota `GET /entrar?token=UUID`** (ou `POST /sessao`):
  - Valida se o token existe e `ativo = true`.
  - Verifica se não há sessão ativa para aquele token (ou permite múltiplas por mesa, conforme spec).
  - Cria registro em `sessoes_cliente`.
  - Retorna cookie HTTP-Only `sessao_id` com TTL de 4 horas.
  - Em caso de token inválido/expirado → retorna `400` com mensagem descritiva.
- [ ] **Middleware `requireSessaoCliente`**: Valida o cookie `sessao_id` nas rotas do cliente (cardápio, pedidos).
- [ ] **Rota `GET /qrcode/:mesaId`**: Já existente — deve passar a usar o token da tabela `qr_codes` em vez do número da mesa na URL gerada.

### Frontend

- [ ] **Rota `/entrar`** (nova página): Recebe `?token=UUID` da URL, chama o backend para iniciar sessão, armazena `sessao_id` no cookie local e redireciona para `/mesa/[mesaId]` com o contexto da sessão.
- [ ] **Proteção de `/mesa/[id]`**: Verificar se há `sessao_id` válido no cookie/localStorage. Sem sessão → redirecionar para `/entrar?expired=true` com mensagem explicativa.
- [ ] **Persistência de sessão**: Salvar `{sessao_id, mesa_id}` no `localStorage` para sobreviver recargas de página. Ao carregar, validar contra API se a sessão ainda está ativa.
- [ ] **Página de erro** para QR Code inválido, expirado ou sessão encerrada.

### Geração dos QR Codes Físicos

- [ ] **Rota `GET /admin/qrcode/:mesaId/export`** (protegida por `requireAuth`): Retorna PNG do QR Code apontando para `cardap.io/entrar?token=TOKEN_DA_MESA` — pronto para impressão nos cartões físicos.
- [ ] **Integração com o painel do admin**: Essa rota precisa estar integrada com o painel atual do admin, sendo fácil navegação para admin acessar e imprimir os qrcodes.
---

## Critérios de Aceitação

1. Escanear QR Code válido → cliente cai diretamente no cardápio sem nenhuma tela de login.
2. QR Code inválido ou desativado → exibe tela de erro descritiva.
3. Recarregar a página → sessão persiste, cliente continua onde estava.
4. Após encerramento da comanda → cookie de sessão é invalidado; nova tentativa de acesso redireciona para tela de erro/encerramento.
5. Nenhum cliente pode acessar dados de outra mesa (isolamento por `sessao_id`).

---

## Notas de Implementação

- O `token` do QR Code é um `UUID v4` gerado no banco — nunca exposto na lógica de negócio, apenas na URL do QR Code.
- A sessão do cliente **não é um JWT** — é um registro no banco que permite revogar acesso instantaneamente ao encerrar a comanda.
- A rota atual `/mesa/[numero]` pode coexistir temporariamente durante a transição, mas deve ser deprecada após esta tarefa ser concluída (TAREFA-03 já terá refatorado a separação das rotas).
- Escrever uma documentação sobre essa geração de token
