-- ============================================================
-- cardap.io — Schema do banco de dados
-- Execute: npm run migrate
-- ============================================================

CREATE TABLE IF NOT EXISTS mesas (
  id        SERIAL PRIMARY KEY,
  numero    INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL CHECK (role IN ('admin', 'funcionario')),
  ativo       BOOLEAN       NOT NULL DEFAULT true,
  criado_em   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cardapio_itens (
  id                SERIAL PRIMARY KEY,
  nome              VARCHAR(100)   NOT NULL,
  descricao         TEXT,
  preco             NUMERIC(10, 2) NOT NULL,
  categoria         VARCHAR(50),
  disponivel        BOOLEAN        DEFAULT true,
  imagem_url        TEXT,
  imagem_public_id  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS comandas (
  id           SERIAL PRIMARY KEY,
  mesa_id      INTEGER REFERENCES mesas(id),
  status       VARCHAR(30)   DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechamento_solicitado', 'encerrada', 'fechada')),
  criado_em    TIMESTAMPTZ   DEFAULT NOW(),
  encerrada_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id             SERIAL PRIMARY KEY,
  comanda_id     INTEGER REFERENCES comandas(id),
  item_id        INTEGER REFERENCES cardapio_itens(id),
  item_nome      VARCHAR(100) NOT NULL,
  quantidade     INTEGER      NOT NULL DEFAULT 1,
  observacao     TEXT         DEFAULT '',
  status         VARCHAR(20)  DEFAULT 'pendente', -- pendente | preparando | pronto | entregue
  criado_em      TIMESTAMPTZ  DEFAULT NOW(),
  preco_unitario NUMERIC(10, 2)
);

-- ── Seed: Mesas ───────────────────────────────────────────
INSERT INTO mesas (numero) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8)
-- ON CONFLICT
ON CONFLICT (numero) DO NOTHING;

-- ── Seed: Cardápio ────────────────────────────────────────
INSERT INTO cardapio_itens (nome, descricao, preco, categoria, disponivel, imagem_url) VALUES
  ('X-Treme Burger',      'Blend 180g, queijo cheddar duplo, bacon crocante, alface, tomate e molho especial da casa.',  38.90, 'Burgers',          true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'),
  ('Smash Classic',       'Smash burger 120g smashado na chapa, queijo americano, cebola caramelizada e picles.',         28.90, 'Burgers',          true, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80'),
  ('Double Stack',        'Dois blends 120g, queijo prato, alface americana, mostarda e ketchup artesanal.',              44.90, 'Burgers',          true, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80'),
  ('Fries Clássico',      'Batata palito crocante com sal grosso e molho aioli.',                                         18.90, 'Acompanhamentos',  true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80'),
  ('Truffle Fries',       'Batata frita com azeite de trufas, parmesão ralado e salsinha.',                               26.90, 'Acompanhamentos',  true, 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80'),
  ('Onion Rings',         'Anéis de cebola empanados com panko, crocantes e levíssimos.',                                 22.90, 'Acompanhamentos',  true, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80'),
  ('Craft Lager',         'Cerveja lager artesanal gelada — 500ml, produção local.',                                      16.90, 'Bebidas',          true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80'),
  ('Milkshake Baunilha',  'Milkshake cremoso de baunilha com chantilly e calda de caramelo.',                             24.90, 'Bebidas',          true, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80'),
  ('Refrigerante Lata',   'Coca-Cola, Guaraná Antarctica ou Sprite — 350ml.',                                              8.90, 'Bebidas',          true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80'),
  ('Brownie Quente',      'Brownie de chocolate belga quentinho com sorvete de creme e calda de chocolate.',              22.90, 'Sobremesas',       true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80')
ON CONFLICT DO NOTHING;

-- ── Seed: Usuários padrão ─────────────────────────────────
INSERT INTO usuarios (nome, email, senha_hash, role) VALUES
  ('Administrador', 'admin@cardap.io',   '$2b$12$2MoHQINY7A5O1CDlQV2fJug42pNSFM8TRcA7wsAumayxkmPb.b9rq', 'admin'),
  ('Cozinha',       'cozinha@cardap.io', '$2b$12$yMv0rdSQaoxsErP7Fu.L2OJ9fcMEVOxA3u4h683lgxYgUfu1iRWfC', 'funcionario')
ON CONFLICT (email) DO NOTHING;

-- ── Tabelas de Sessão e QR Code ───────────────────────────
CREATE TABLE IF NOT EXISTS qr_codes (
  id         SERIAL PRIMARY KEY,
  mesa_id    INTEGER REFERENCES mesas(id) NOT NULL,
  token      UUID UNIQUE NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessoes_cliente (
  id            SERIAL PRIMARY KEY,
  qr_code_id    INTEGER REFERENCES qr_codes(id) NOT NULL,
  mesa_id       INTEGER REFERENCES mesas(id) NOT NULL,
  iniciada_em   TIMESTAMPTZ DEFAULT NOW(),
  encerrada_em  TIMESTAMPTZ
);

ALTER TABLE comandas ADD COLUMN IF NOT EXISTS sessao_id INTEGER REFERENCES sessoes_cliente(id);

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_mesa_id ON qr_codes(mesa_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_cliente_qr_code_id ON sessoes_cliente(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_comandas_sessao_id ON comandas(sessao_id);

-- ── Seed: QR Codes ativos para cada mesa ─────────────────
INSERT INTO qr_codes (mesa_id, token, ativo)
SELECT m.id, gen_random_uuid(), true
FROM mesas m
WHERE NOT EXISTS (SELECT 1 FROM qr_codes q WHERE q.mesa_id = m.id)
ON CONFLICT DO NOTHING;

-- ── Updates para bancos existentes ───────────────────────
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS encerrada_em TIMESTAMPTZ;
ALTER TABLE comandas DROP CONSTRAINT IF EXISTS chk_comandas_status;
ALTER TABLE comandas ADD CONSTRAINT chk_comandas_status CHECK (status IN ('aberta', 'fechamento_solicitado', 'encerrada', 'fechada'));

-- Garante a coluna preco_unitario em pedido_itens para preservar histórico de preços
ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS preco_unitario NUMERIC(10, 2);

-- Migra dados existentes se houver registros sem preco_unitario
UPDATE pedido_itens pi
SET preco_unitario = ci.preco
FROM cardapio_itens ci
WHERE pi.item_id = ci.id AND pi.preco_unitario IS NULL;

-- Define preco_unitario como NOT NULL após a migração (se houver dados sem correspondência, usa fallback 0.00)
UPDATE pedido_itens SET preco_unitario = 0.00 WHERE preco_unitario IS NULL;
ALTER TABLE pedido_itens ALTER COLUMN preco_unitario SET NOT NULL;

-- Garante a coluna imagem_public_id em cardapio_itens
ALTER TABLE cardapio_itens ADD COLUMN IF NOT EXISTS imagem_public_id VARCHAR(255);
