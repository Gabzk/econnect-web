"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { FeedType, Noticia } from "@/types/news";

interface CacheEntry {
  noticias: Noticia[];
  hasMore: boolean;
  lastFetched: number;
}

interface NewsCacheContextType {
  getCache: (feedType: FeedType) => CacheEntry | null;
  setCache: (feedType: FeedType, noticias: Noticia[], hasMore: boolean) => void;
  appendCache: (
    feedType: FeedType,
    noticias: Noticia[],
    hasMore: boolean,
  ) => void;
  clearCache: (feedType?: FeedType) => void;
  isCacheValid: (feedType: FeedType, maxAge?: number) => boolean;
}

const NewsCacheContext = createContext<NewsCacheContextType | null>(null);

// Tempo de validade do cache em milissegundos (5 minutos)
const DEFAULT_CACHE_MAX_AGE = 5 * 60 * 1000;

export function NewsCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<FeedType, CacheEntry>>(
    {} as Record<FeedType, CacheEntry>,
  );

  const getCache = useCallback(
    (feedType: FeedType): CacheEntry | null => {
      return cache[feedType] || null;
    },
    [cache],
  );

  const setCacheEntry = useCallback(
    (feedType: FeedType, noticias: Noticia[], hasMore: boolean) => {
      setCache((prev) => ({
        ...prev,
        [feedType]: {
          noticias,
          hasMore,
          lastFetched: Date.now(),
        },
      }));
    },
    [],
  );

  const appendCache = useCallback(
    (feedType: FeedType, noticias: Noticia[], hasMore: boolean) => {
      setCache((prev) => {
        const existing = prev[feedType];
        if (existing) {
          // Filtra notícias duplicadas baseado no id
          const existingIds = new Set(existing.noticias.map((n) => n.id));
          const newNoticias = noticias.filter((n) => !existingIds.has(n.id));
          return {
            ...prev,
            [feedType]: {
              noticias: [...existing.noticias, ...newNoticias],
              hasMore,
              lastFetched: Date.now(),
            },
          };
        }
        return {
          ...prev,
          [feedType]: {
            noticias,
            hasMore,
            lastFetched: Date.now(),
          },
        };
      });
    },
    [],
  );

  const clearCache = useCallback((feedType?: FeedType) => {
    if (feedType) {
      setCache((prev) => {
        const newCache = { ...prev };
        delete newCache[feedType];
        return newCache;
      });
    } else {
      setCache({} as Record<FeedType, CacheEntry>);
    }
  }, []);

  const isCacheValid = useCallback(
    (feedType: FeedType, maxAge: number = DEFAULT_CACHE_MAX_AGE): boolean => {
      const entry = cache[feedType];
      if (!entry) return false;
      return Date.now() - entry.lastFetched < maxAge;
    },
    [cache],
  );

  return (
    <NewsCacheContext.Provider
      value={{
        getCache,
        setCache: setCacheEntry,
        appendCache,
        clearCache,
        isCacheValid,
      }}
    >
      {children}
    </NewsCacheContext.Provider>
  );
}

export function useNewsCache() {
  const context = useContext(NewsCacheContext);
  if (!context) {
    throw new Error("useNewsCache must be used within a NewsCacheProvider");
  }
  return context;
}
