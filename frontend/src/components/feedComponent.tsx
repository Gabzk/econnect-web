"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNewsCache } from "@/contexts/NewsCacheContext";
import type { FeedType, Noticia } from "@/types/news";
import LoadingSpinner from "./loadingComponent";
import NewsCardComponent from "./newsCardComponent";
import TimeFilterDropdown from "./timeFilterDropdown";

interface FeedComponentProps {
  feedType?: FeedType;
}

export default function FeedComponent({
  feedType = "latest",
}: FeedComponentProps) {
  const { getCache, setCache, appendCache, isCacheValid } = useNewsCache();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const currentFeedType = useRef(feedType);

  // Função para buscar notícias
  const fetchNews = useCallback(
    async (skip: number, type: FeedType, time_filter?: string) => {
      try {
        if (skip > 0) setLoadingMore(true);

        const limit = skip === 0 ? 10 : 9;

        let response;

        if (time_filter) {
          response = await fetch(
            `/api/news/feed?feedType=${type}&skip=${skip}&limit=${limit}&time_filter=${time_filter}`,
          );
        } else {
          response = await fetch(
            `/api/news/feed?feedType=${type}&skip=${skip}&limit=${limit}`,
          );
        }

        if (!response.ok) {
          throw new Error("Erro ao carregar notícias");
        }

        const data = await response.json();

        // Verifica se o feedType ainda é o mesmo (evita race conditions)
        if (currentFeedType.current !== type) return;

        if (data.length === 0) {
          setHasMore(false);
          // Atualiza cache com hasMore = false
          const cached = getCache(type);
          if (cached) {
            setCache(type, cached.noticias, false);
          }
        } else {
          if (skip === 0) {
            setNoticias(data);
            setCache(type, data, true);
          } else {
            // Filtra notícias duplicadas baseado no id
            setNoticias((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const newNoticias = data.filter(
                (n: Noticia) => !existingIds.has(n.id),
              );
              return [...prev, ...newNoticias];
            });
            appendCache(type, data, true);
          }
        }
      } catch (err) {
        if (currentFeedType.current === type) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
      } finally {
        if (currentFeedType.current === type) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [getCache, setCache, appendCache],
  );

  // Carrega as notícias iniciais quando feedType muda
  useEffect(() => {
    currentFeedType.current = feedType;
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
    fetchNews(0, feedType);
  }, [feedType, fetchNews, getCache, isCacheValid]);

  // Configura o Intersection Observer para infinite scroll
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNews(noticias.length, currentFeedType.current);
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
  }, [loading, hasMore, loadingMore, noticias.length, fetchNews]);

  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter);
    setNoticias([]);
    setHasMore(true);
    setLoading(true);
    fetchNews(0, feedType, newFilter);
  };

  const [featuredNews, ...restNews] = noticias;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Time Filter - Apenas para hottest */}
      {feedType === "hottest" && (
        <div className="mb-6">
          <TimeFilterDropdown value={timeFilter} onChange={handleTimeFilterChange} />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Featured/Hero Section */}
          {featuredNews && (
            <section className="mb-10">
              <NewsCardComponent
                big={true}
                title={featuredNews.titulo}
                summary={featuredNews.resumo}
                imageUrl={featuredNews.imagem}
                link={featuredNews.url}
                date={new Date(featuredNews.data_postagem).toLocaleDateString(
                  "pt-BR",
                )}
                id={featuredNews.id}
                likes={featuredNews.qtd_curtidas}
                liked={featuredNews.curtido}
              />
            </section>
          )}

          {/* News Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restNews.map((noticia) => (
              <NewsCardComponent
                key={noticia.id}
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
            ))}
          </section>

          {/* Elemento sentinela para infinite scroll */}
          <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
            {loadingMore && <LoadingSpinner size="md" />}
            {!hasMore && noticias.length > 0 && (
              <p className="text-gray-400 text-sm">
                Você chegou ao fim das notícias
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
