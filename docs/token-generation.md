# Geração e Ciclo de Vida do Token do Cliente (QR Code)

Este documento detalha o funcionamento, arquitetura de banco de dados, fluxos de validação e ciclo de vida do token único (UUID v4) associado aos QR Codes das mesas.

---

## 1. O Conceito

Para viabilizar uma experiência **zero-fricção** e segura para o cliente final:
1. O cliente **não precisa** criar uma conta (e-mail/senha) nem preencher dados cadastrais para fazer pedidos.
2. O acesso ao cardápio e à comanda de uma mesa é concedido através de um **token exclusivo** contido no QR Code impresso e fixado na mesa física.
3. Este token é um **UUID v4** persistido no banco de dados na tabela `qr_codes` e exposto na URL do QR Code.
4. Quando o cliente escaneia o QR Code, ele acessa a URL `/entrar?token=UUID`, que inicia uma sessão temporária do cliente (`sessoes_cliente`) no backend e gera um cookie HTTP-Only seguro.

---

## 2. Modelagem de Dados

### Tabela `qr_codes`
Cada mesa física possui um ou mais registros de QR Codes na tabela `qr_codes`. Apenas um QR Code ativo por mesa é gerado na inicialização do sistema, mas novos podem ser criados se o anterior for desativado/expirado.

* **`id`** (`SERIAL PRIMARY KEY`): Identificador único do registro.
* **`mesa_id`** (`INTEGER REFERENCES mesas(id)`): Chave estrangeira que vincula o código a uma mesa física.
* **`token`** (`UUID UNIQUE`): O token único autogerado (UUID v4) incluído na URL.
* **`ativo`** (`BOOLEAN DEFAULT true`): Determina se o token ainda pode ser usado para abrir novas sessões.
* **`criado_em`** (`TIMESTAMPTZ DEFAULT NOW()`): Carimbo de data/hora de criação.

### Tabela `sessoes_cliente`
Toda vez que um cliente entra validamente usando um QR Code, uma nova sessão é registrada no banco.

* **`id`** (`SERIAL PRIMARY KEY`): ID da sessão (e valor armazenado no cookie `sessao_id`).
* **`qr_code_id`** (`INTEGER REFERENCES qr_codes(id)`): O QR Code específico usado para entrar.
* **`mesa_id`** (`INTEGER REFERENCES mesas(id)`): A mesa física correspondente.
* **`iniciada_em`** (`TIMESTAMPTZ DEFAULT NOW()`): Momento de início da sessão.
* **`encerrada_em`** (`TIMESTAMPTZ`): Nulo enquanto a comanda estiver aberta. Preenchido com o carimbo de data/hora quando o funcionário confirma o fechamento e pagamento da comanda, invalidando a sessão.

---

## 3. Fluxo de Geração de Tokens

### Inicialização (Seed)
Durante a migração inicial do banco de dados, o script `schema.sql` executa uma inserção automática garantindo que todas as mesas ativas tenham exatamente 1 QR Code ativo associado:

```sql
INSERT INTO qr_codes (mesa_id, token, ativo)
SELECT m.id, gen_random_uuid(), true
FROM mesas m
WHERE NOT EXISTS (SELECT 1 FROM qr_codes q WHERE q.mesa_id = m.id)
ON CONFLICT DO NOTHING;
```

---

## 4. Ciclo de Vida do Acesso

### Passo 1: Leitura do QR Code
A URL contida no QR Code físico aponta para o endpoint do frontend:
`https://cardap.io/entrar?token=<UUID>`

### Passo 2: Validação e Criação de Sessão (Backend)
Quando o frontend recebe o token, ele faz uma chamada à API `/entrar?token=<UUID>`:
1. O backend verifica se o token existe na tabela `qr_codes` e se o campo `ativo` é `true`.
2. Se válido:
   * Cria um novo registro em `sessoes_cliente` com o `qr_code_id` e o `mesa_id`.
   * Associa a comanda ativa da mesa a essa `sessao_id` (se a comanda ainda não existir, ela é criada).
   * Retorna um cookie HTTP-Only seguro chamado `sessao_id` contendo o ID da sessão criada, com validade máxima de 4 horas.
3. Se inválido ou inativo, o backend retorna `400 Bad Request` com o erro `Token inválido ou inativo`.

### Passo 3: Navegação Protegida (Cardápio / Comanda)
* O cliente é redirecionado para `/mesa/[id]` no frontend.
* Toda requisição do cliente para visualizar a comanda (`/comanda/[id]`) ou submeter itens ao carrinho (`POST /pedidos`) passa pelo middleware `requireSessaoCliente` que valida a existência e ativadade da sessão no cookie `sessao_id`.
* Se o cookie de sessão estiver ausente ou a sessão já estiver encerrada no banco de dados (`encerrada_em IS NOT NULL`), o backend retorna `401 Unauthorized`.

### Passo 4: Encerramento e Revogação
Quando a comanda é fechada e paga pelo painel do staff:
1. O backend define o campo `encerrada_em = NOW()` na respectiva `sessoes_cliente`.
2. Opcionalmente, o token do `qr_code` pode ser mantido ativo (para ser reutilizado pelo próximo cliente que sentar na mesa) ou regenerado se for um QR Code impresso descartável de uso único.
3. Qualquer requisição futura utilizando o cookie daquela sessão antiga receberá `401 Unauthorized` e o frontend redirecionará para a tela de erro de sessão expirada.
