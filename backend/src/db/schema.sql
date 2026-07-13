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
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100)   NOT NULL,
  descricao   TEXT,
  preco       NUMERIC(10, 2) NOT NULL,
  categoria   VARCHAR(50),
  disponivel  BOOLEAN        DEFAULT true,
  imagem_url  TEXT
);

CREATE TABLE IF NOT EXISTS comandas (
  id         SERIAL PRIMARY KEY,
  mesa_id    INTEGER REFERENCES mesas(id),
  status     VARCHAR(20)  DEFAULT 'aberta',   -- aberta | fechada
  criado_em  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id          SERIAL PRIMARY KEY,
  comanda_id  INTEGER REFERENCES comandas(id),
  item_id     INTEGER REFERENCES cardapio_itens(id),
  item_nome   VARCHAR(100) NOT NULL,
  quantidade  INTEGER      NOT NULL DEFAULT 1,
  observacao  TEXT         DEFAULT '',
  status      VARCHAR(20)  DEFAULT 'pendente', -- pendente | preparando | pronto | entregue
  criado_em   TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Seed: Mesas ───────────────────────────────────────────
INSERT INTO mesas (numero) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8)
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
-- ATENÇÃO: hashes gerados com bcrypt custo 12
-- admin123   → admin@cardap.io
-- cozinha123 → cozinha@cardap.io
-- Para regen: node -e "const b=require('bcrypt'); console.log(b.hashSync('admin123',12))"
INSERT INTO usuarios (nome, email, senha_hash, role) VALUES
  ('Administrador', 'admin@cardap.io',   '$2b$12$2MoHQINY7A5O1CDlQV2fJug42pNSFM8TRcA7wsAumayxkmPb.b9rq', 'admin'),
  ('Cozinha',       'cozinha@cardap.io', '$2b$12$yMv0rdSQaoxsErP7Fu.L2OJ9fcMEVOxA3u4h683lgxYgUfu1iRWfC', 'funcionario')
ON CONFLICT (email) DO NOTHING;
