"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FeedType, Noticia } from "@/types/news";
import LoadingSpinner from "./loadingComponent";
import NewsCardComponent from "./newsCardComponent";

interface HighlightComponentProps {
  title: string;
  feedType?: FeedType;
  limit?: number;
  showFeatured?: boolean;
}

export default function HighlightComponent({
  title,
  feedType = "latest",
  limit = 4,
  showFeatured = true,
}: HighlightComponentProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/news/feed?feedType=${feedType}&skip=0&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar notícias");
      }

      const data = await response.json();
      setNoticias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [feedType, limit]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Estado de loading
  if (loading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="font-semibold text-gray-800 mb-2 block hover:text-blue-600 transition-colors">
          {title}
        </h2>

        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="md" />
        </div>
      </section>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
        <div className="flex justify-center items-center h-48">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  // Sem notícias
  if (noticias.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">Nenhuma notícia encontrada</p>
        </div>
      </section>
    );
  }

  // Separa a notícia em destaque das demais
  const [featuredNews, ...restNews] = noticias;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>

      {/* Notícia em destaque */}
      {showFeatured && featuredNews && (
        <div className="mb-8">
          <NewsCardComponent
            big={true}
            title={featuredNews.titulo}
            summary={featuredNews.resumo}
            imageUrl={featuredNews.imagem}
            link={featuredNews.url}
            date={new Date(featuredNews.data_postagem).toLocaleDateString(
              "pt-BR",
            )}
          />
        </div>
      )}

      {/* Grid de notícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(showFeatured ? restNews : noticias).map((noticia) => (
          <NewsCardComponent
            key={noticia.id}
            big={false}
            title={noticia.titulo}
            summary={noticia.resumo}
            imageUrl={noticia.imagem}
            link={noticia.url}
            date={new Date(noticia.data_postagem).toLocaleDateString("pt-BR")}
          />
        ))}
      </div>
    </section>
  );
}
