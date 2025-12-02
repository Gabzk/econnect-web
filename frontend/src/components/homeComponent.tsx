"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import HighlightComponent from "./highlightComponent";

export default function HomeComponent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <h1 className="text-4xl font-bold text-emerald-700 text-center mt-12">
        Econnect
      </h1>
      <p className="text-lg text-gray-600 text-center mt-4">
        Sua fonte confiável de notícias em um só lugar
      </p>

      {!isLoading && !isAuthenticated && (
        <div className="text-center mt-8 mb-8">
          <div className="inline-block bg-amber-100 border-2 border-emerald-600 rounded-lg p-6 shadow-lg">
            <p className="text-emerald-800 font-semibold mb-4">
              Faça login para ter acesso completo às notícias e recursos
              exclusivos!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-amber-200 text-emerald-800 rounded-lg hover:bg-amber-300 transition-colors font-medium"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      )}

      <HighlightComponent
        title="Notícias mais curtidas"
        feedType="hottest"
        limit={4}
      />

      <HighlightComponent
        title="Últimas Notícias"
        feedType="latest"
        limit={4}
      />
    </div>
  );
}
