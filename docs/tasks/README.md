# Índice de Tarefas — cardap.io

> Planejamento de desenvolvimento ordenado por prioridade.  
> Cada arquivo de tarefa contém: contexto, objetivo, escopo detalhado (backend + frontend), critérios de aceitação e notas de implementação.

---

## Visão Geral

| # | Tarefa | Prioridade | US Relacionada | Estimativa | Depende de |
|---|--------|-----------|----------------|-----------|------------|
| [TAREFA-01](TAREFA-01-autenticacao-staff.md) | Autenticação do Staff (Login + JWT) | 🔴 Alta | US-09 | 5–8 pts | — |
| [TAREFA-02](TAREFA-02-sessao-cliente-qrcode.md) | Sessão Seamless do Cliente via QR Code | 🔴 Alta | US-01, US-10 | 5–8 pts | — |
| [TAREFA-03](TAREFA-03-separacao-mesa-comanda.md) | Separação de Mesa e Comanda no Frontend | 🔴 Alta | US-01, US-08 | 8–13 pts | TAREFA-02 |
| [TAREFA-04](TAREFA-04-checkout-fechamento-comanda.md) | Fluxo de Checkout e Fechamento de Comanda | 🟠 Alta-Média | US-08 | 5–8 pts | TAREFA-02, TAREFA-03 |
| [TAREFA-05](TAREFA-05-crud-cardapio-admin.md) | CRUD de Cardápio para o Administrador | 🟡 Média | US-05 | 5–8 pts | TAREFA-01 |
| [TAREFA-06](TAREFA-06-upload-imagens.md) | Upload de Imagens dos Itens do Cardápio | 🟡 Média | US-06 | 3–5 pts | TAREFA-05 |
| [TAREFA-07](TAREFA-07-dashboards-metricas.md) | Dashboards e Métricas de Negócio | 🟢 Baixa | — | 8–13 pts | TAREFA-01, TAREFA-04 |

---

## Grafo de Dependências

```
TAREFA-01 (Auth Staff)
    └── TAREFA-05 (CRUD Cardápio)
            └── TAREFA-06 (Upload Imagens)

TAREFA-02 (Sessão Cliente QR)
    └── TAREFA-03 (Mesa vs Comanda)
            └── TAREFA-04 (Checkout)
                    └── TAREFA-07 (BI / Métricas)
```

> **TAREFA-01** e **TAREFA-02** podem ser iniciadas em paralelo, pois não possuem dependências entre si.

---

## Contexto das Decisões de Design

Estas tarefas são guiadas pelas seguintes decisões arquiteturais estabelecidas:

1. **Auth do cliente = zero fricção**: QR Code gera sessão automática — sem cadastro, sem senha. A identidade é o cartão físico.
2. **Auth do staff = e-mail + senha + JWT**: Usuários predefinidos via seed, com roles `admin` e `funcionario`.
3. **Mesa ≠ Comanda**: Mesa é a entidade física permanente. Comanda é a sessão de consumo individual — uma mesa pode ter N comandas simultâneas.
4. **Snapshot de preço**: O preço unitário de cada item é registrado no momento do pedido, nunca referenciando o preço atual do cardápio.
5. **WebSocket para tudo em tempo real**: Mudanças de status, solicitações de fechamento e atualizações de cardápio chegam ao cliente sem necessidade de reload.
