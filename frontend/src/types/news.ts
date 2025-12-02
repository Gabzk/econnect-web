export interface Fonte {
  nome: string;
  url: string;
}

export interface Noticia {
  id: number;
  titulo: string;
  resumo: string;
  imagem: string;
  data_postagem: string;
  url: string;
  id_fonte: number;
  data_coleta: string;
  qtd_curtidas: number;
  curtido: boolean;
  fonte: Fonte;
}

export type FeedType = "latest" | "hottest" | "liked";
