# TAREFA-06 — Upload de Imagens dos Itens do Cardápio

> **Prioridade:** 🟡 Média  
> **User Story:** US-06  
> **Estimativa:** 3–5 pontos  
> **Dependências:** TAREFA-05 (CRUD de cardápio deve estar implementado).

---

## Contexto

Atualmente, as imagens dos itens do cardápio são URLs externas hardcoded no seed (Unsplash). Para que o admin possa gerenciar o cardápio de forma independente, ele precisa conseguir fazer upload das fotos dos pratos diretamente na interface.

Conforme a spec em `user-stories.md` (US-06):
- Formatos aceitos: JPG e PNG.
- Tamanho máximo: 5 MB por imagem.
- Se não houver imagem cadastrada, exibir imagem padrão genérica.
- Admin pode substituir a imagem de qualquer item sem recriar o item.

---

## Objetivo

Integrar um serviço de armazenamento de objetos para upload e servir imagens dos itens do cardápio de forma confiável e escalável.

---

## Serviço de Storage Recomendado

**Cloudinary** (plano Free suficiente para MVP):
- Upload via API REST.
- Transformações de imagem on-the-fly (resize, crop, otimização automática).
- CDN global incluído.
- SDK oficial para Node.js.

Alternativas: AWS S3 + CloudFront, Supabase Storage.

---

## Escopo

### Backend

- [ ] **Variáveis de ambiente**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- [ ] **Dependência**: `cloudinary` (npm).
- [ ] **Rota `POST /admin/cardapio/upload-imagem`** (requer `requireRole('admin')`):
  - Recebe o arquivo via `multipart/form-data`.
  - Valida formato (MIME type: `image/jpeg` ou `image/png`) e tamanho (≤ 5 MB).
  - Faz upload para Cloudinary na pasta `cardapio/`.
  - Retorna a `secure_url` gerada pelo Cloudinary.
- [ ] Ao criar/editar um item (TAREFA-05), o campo `imagem_url` recebe a URL retornada pelo upload.
- [ ] Ao substituir a imagem de um item existente, a imagem antiga é deletada do Cloudinary via `cloudinary.uploader.destroy(publicId)`.

### Frontend — Admin Panel

- [ ] No formulário de criação/edição de item (TAREFA-05), substituir o campo "URL da imagem" por um **input de arquivo**:
  - Drag-and-drop ou clique para selecionar.
  - Preview da imagem selecionada antes do upload.
  - Barra de progresso durante o upload.
  - Após upload bem-sucedido, o campo `imagem_url` é preenchido automaticamente com a URL retornada.
- [ ] Validação no frontend: rejeitar arquivos que não sejam JPG/PNG ou acima de 5 MB com mensagem de erro clara.
- [ ] Imagem padrão: se `imagem_url` for `null`, exibir placeholder padronizado do estabelecimento.

---

## Critérios de Aceitação

1. Admin seleciona um JPG de 2 MB → imagem sobe para Cloudinary e aparece no cardápio.
2. Admin tenta subir um arquivo PDF → frontend rejeita antes de enviar ao backend.
3. Admin tenta subir uma imagem de 8 MB → frontend rejeita com mensagem "Imagem deve ter no máximo 5 MB".
4. Admin substitui a imagem de um item → a imagem antiga é removida do Cloudinary e a nova é exibida.
5. Item sem imagem cadastrada → exibe imagem padrão do estabelecimento, não um ícone quebrado.

---

## Notas de Implementação

- Usar `multer` (middleware Express) para processar `multipart/form-data` no backend antes de enviar ao Cloudinary.
- O `public_id` da imagem no Cloudinary deve ser salvo junto com a `imagem_url` (ou derivável da URL) para possibilitar a deleção posterior.
- Configurar transformações automáticas no Cloudinary: `f_auto,q_auto,w_600` — conversão automática para WebP, qualidade otimizada e largura máxima de 600px — para manter a performance do cardápio dentro do RNF-01 (carregamento ≤ 2s).
