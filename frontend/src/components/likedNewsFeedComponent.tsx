"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNewsCache } from "@/contexts/NewsCacheContext";
import type { Noticia } from "@/types/news";
import LoadingSpinner from "./loadingComponent";
import NewsCardComponent from "./newsCardComponent";

interface LikedNewsFeedComponentProps {
  className?: string;
}

export default function LikedNewsFeedComponent({
  className = "",
}: LikedNewsFeedComponentProps) {
  const { getCache, setCache, appendCache, isCacheValid } = useNewsCache();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const feedType = "liked";

  // Função para buscar notícias curtidas
  const fetchLikedNews = useCallback(async (skip: number) => {
    try {
      if (skip > 0) setLoadingMore(true);

      const limit = skip === 0 ? 8 : 8;

      const response = await fetch(
        `/api/news/feed?feedType=${feedType}&skip=${skip}&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar notícias curtidas");
      }

      const data = await response.json();

      if (data.length === 0) {
        setHasMore(false);
        // Atualiza cache com hasMore = false
        const cached = getCache(feedType);
        if (cached) {
          setCache(feedType, cached.noticias, false);
        }
      } else {
        if (skip === 0) {
          setNoticias(data);
          setCache(feedType, data, true);
        } else {
          // Filtra notícias duplicadas baseado no id
          setNoticias((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newNoticias = data.filter(
              (n: Noticia) => !existingIds.has(n.id),
            );
            return [...prev, ...newNoticias];
          });
          appendCache(feedType, data, true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getCache, setCache, appendCache]);

  // Carrega as notícias curtidas iniciais
  useEffect(() => {
    setError(null);

    // Verifica se tem cache válido
    if (isCacheValid(feedType)) {
      const cached = getCache(feedType);
      if (cached) {
        setNoticias(cached.noticias);
        setHasMore(cached.hasMore);
        setLoading(false);
        return;
      }
    }

    // Sem cache válido, busca da API
    setNoticias([]);
    setHasMore(true);
    setLoading(true);
    fetchLikedNews(0);
  }, [fetchLikedNews, getCache, isCacheValid]);

  // Configura o Intersection Observer para infinite scroll
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchLikedNews(noticias.length);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, noticias.length, fetchLikedNews]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <h2 className="text-2xl font-semibold text-[#1F4F25] mb-6">
        Notícias Curtidas
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center flex-1">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && noticias.length === 0 && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-gray-400 text-center">
            Você ainda não curtiu nenhuma notícia
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && noticias.length > 0 && (
        <>
          {/* News Grid */}
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            {noticias.map((noticia) => (
              <div key={noticia.id} className="w-full">
                <NewsCardComponent
                  big={false}
                  title={noticia.titulo}
                  summary={noticia.resumo}
                  imageUrl={noticia.imagem}
                  link={noticia.url}
                  date={new Date(noticia.data_postagem).toLocaleDateString("pt-BR")}
                  id={noticia.id}
                  likes={noticia.qtd_curtidas}
                  liked={noticia.curtido}
                />
              </div>
            ))}
          </div>

          {/* Elemento sentinela para infinite scroll */}
          <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
            {loadingMore && <LoadingSpinner size="md" />}
            {!hasMore && noticias.length > 0 && (
              <p className="text-gray-400 text-sm">
                Você chegou ao fim das notícias curtidas
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
