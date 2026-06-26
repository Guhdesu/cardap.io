import { randomUUID } from 'crypto';

export interface CriarItemCardapioDTO {
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: string;
  imagemUrl?: string;
}

export class ItemCardapio {
  readonly id: string;
  nome: string;
  descricao: string;
  readonly categoriaId: string;

  private _preco: number;
  private _imagemUrl?: string;
  private _disponivel: boolean;

  constructor(dados: CriarItemCardapioDTO) {
    if (dados.preco <= 0) {
      throw new Error('O preço deve ser maior que zero.');
    }

    this.id = randomUUID();
    this.nome = dados.nome;
    this.descricao = dados.descricao;
    this.categoriaId = dados.categoriaId;
    this._preco = dados.preco;
    this._imagemUrl = dados.imagemUrl;
    this._disponivel = true;
  }

  get preco(): number {
    return this._preco;
  }

  get imagemUrl(): string | undefined {
    return this._imagemUrl;
  }

  get disponivel(): boolean {
    return this._disponivel;
  }

  atualizarPreco(novoPreco: number): void {
    if (novoPreco <= 0) {
      throw new Error('O preço deve ser maior que zero.');
    }
    this._preco = novoPreco;
  }

  atualizarImagem(url: string): void {
    const urlTrimada = url?.trim();
    if (!urlTrimada) {
      throw new Error('A URL da imagem não pode ser vazia.');
    }
    this._imagemUrl = urlTrimada;
  }

  marcarIndisponivel(): void {
    this._disponivel = false;
  }

  marcarDisponivel(): void {
    this._disponivel = true;
  }
}
