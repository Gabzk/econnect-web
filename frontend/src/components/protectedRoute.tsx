"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
  showLoginPrompt = true,
}: {
  children: React.ReactNode;
  showLoginPrompt?: boolean;
}) {
  const { isAuthenticated, hasRefreshToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar prompt para login ao invés de bloquear
  if (!isAuthenticated && !hasRefreshToken && showLoginPrompt) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-emerald-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Ícone de acesso restrito"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Conteúdo Exclusivo
          </h2>
          <p className="text-gray-600 mb-6">
            Esta funcionalidade requer que você esteja logado. Faça login para
            ter acesso completo!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              Fazer Login
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
