# TAREFA-01 — Autenticação do Staff (Login + JWT)

> **Prioridade:** 🔴 Alta  
> **User Story:** US-09  
> **Estimativa:** 5–8 pontos  
> **Dependências:** Nenhuma — pode iniciar imediatamente.

---

## Contexto

A rota `/staff` está atualmente **acessível publicamente**, sem nenhum controle de acesso. Qualquer pessoa com a URL pode ver e manipular todas as comandas do restaurante. Esta tarefa adiciona autenticação real ao painel operacional.

O modelo de dados já está especificado em `docs/database.md` (tabela `usuario` com campos `email`, `senha_hash`, `role` e `ativo`).

---

## Objetivo

Proteger todas as rotas `/staff/*` com autenticação JWT, sem impactar o fluxo do cliente.

---

## Escopo

### Backend

- [ ] **Migração do banco**: Criar a tabela `usuarios` conforme spec do `docs/database.md`.
- [ ] **Seed de usuários padrão** no `schema.sql`:
  - `admin@cardap.io` / `admin123` — role: `admin`
  - `cozinha@cardap.io` / `cozinha123` — role: `funcionario`
- [ ] **Rota `POST /auth/login`**: Recebe `{email, senha}`, valida contra o banco, retorna JWT com payload `{id, email, role}` e expiração de 8h.
- [ ] **Middleware `requireAuth`**: Verifica o token JWT no header `Authorization: Bearer <token>`. Retorna `401` para requisições sem token ou com token inválido/expirado.
- [ ] **Middleware `requireRole(role)`**: Verifica o campo `role` do payload JWT. Retorna `403` para acessos insuficientes.
- [ ] Aplicar `requireAuth` em **todas as rotas do staff** (`/pedidos/staff/comandas`, `PUT /pedidos/:id/status`).
- [ ] Bloqueio temporário após 5 tentativas inválidas consecutivas (15 min), conforme RNF-04.

### Frontend

- [ ] **Página `/staff/login`**: Formulário de e-mail + senha. Submit chama `POST /auth/login`, armazena o token recebido em um cookie HTTP-Only via endpoint Next.js Route Handler.
- [ ] **Next.js Middleware** (`middleware.ts`): Intercepta toda requisição para `/staff/*`. Se não houver cookie de sessão válido, redireciona para `/staff/login`.
- [ ] **Lógica de Logout**: Botão no header do painel que limpa o cookie de sessão e redireciona para `/staff/login`.
- [ ] Todas as chamadas `fetch` do painel já existentes passam a incluir o token JWT no header.

---

## Critérios de Aceitação

1. Acessar `/staff` sem autenticação → redireciona para `/staff/login`.
2. Login com credenciais válidas → redireciona para `/staff` com o painel operacional.
3. Login com credenciais inválidas → exibe mensagem de erro, não redireciona.
4. Token expirado (após 8h) → próxima requisição autenticada retorna 401, frontend redireciona para `/staff/login`.
5. Logout → cookie removido, usuário redirecionado para `/staff/login`.

---

## Notas de Implementação

- Usar `bcrypt` com fator de custo `12` para hash de senhas no seed e no cadastro.
- JWT secret deve ser uma variável de ambiente (`JWT_SECRET`), nunca hardcoded.
- O cookie de sessão deve ser `httpOnly: true`, `sameSite: 'lax'`, `secure: true` em produção.
- Separar claramente: `role: 'admin'` terá acesso futuro ao CRUD de cardápio (TAREFA-05); `role: 'funcionario'` tem acesso apenas ao painel de comandas.
