"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";

function NavBarContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const _router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    await logout();
  };

  // Função auxiliar para verificar se o link está ativo
  const isActive = (path: string, sortParam?: string) => {
    if (path === "/") return pathname === "/";

    // Verifica se estamos na rota correta
    if (pathname === path) {
      const currentSort = searchParams.get("sort");
      // Se exige um parametro de sort, verifica se é igual. Se não exige, verifica se não tem nenhum.
      return sortParam ? currentSort === sortParam : !currentSort;
    }
    return false;
  };

  return (
    <nav className="bg-emerald-800">
      <div className="mx-auto max-w-7xl p-4 relative">
        <div className="flex items-center justify-center">
          {/* Navigation Links - Desktop centered, Mobile hidden */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex items-center gap-8 font-medium">
              <li>
                <Link
                  href="/"
                  className={`transition-colors hover:text-amber-100 ${
                    isActive("/") ? "text-white font-bold" : "text-emerald-200"
                  }`}
                >
                  Home
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/feed"
                      className={`transition-colors hover:text-amber-100 ${
                        isActive("/feed")
                          ? "text-white font-bold"
                          : "text-emerald-200"
                      }`}
                    >
                      Feed
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/hottest"
                      className={`transition-colors hover:text-amber-100 ${
                        isActive("/hottest")
                          ? "text-white font-bold"
                          : "text-emerald-200"
                      }`}
                    >
                      Mais Curtidas
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* User Menu - Sempre no canto direito */}
          <div className="flex items-center gap-3 ml-auto ">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  {/* User Avatar */}
                  <Link
                    href="/profile"
                    className="rounded-full"
                    aria-label="User menu"
                  >
                    <Image
                      className="h-10 w-10 rounded-full ring-2 ring-emerald-600"
                      src="/tigreen.png"
                      alt="User profile"
                      width={40}
                      height={40}
                    />
                  </Link>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-600 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-600 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg px-4 py-2 text-emerald-800 bg-amber-100 hover:bg-amber-200 transition-colors font-medium"
                  >
                    Cadastrar
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Hidden by default */}
      <div className="hidden border-t border-emerald-700 md:hidden">
        <ul className="space-y-1 p-4">
          <li>
            <Link
              href="/"
              className={`block rounded-lg px-4 py-2 hover:bg-emerald-700 ${
                isActive("/") ? "text-white bg-emerald-700" : "text-emerald-200"
              }`}
            >
              Home
            </Link>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <Link
                  href="/feed"
                  className={`block rounded-lg px-4 py-2 hover:bg-emerald-700 ${
                    isActive("/feed")
                      ? "text-white bg-emerald-700"
                      : "text-emerald-200"
                  }`}
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/feed?sort=most-liked"
                  className={`block rounded-lg px-4 py-2 hover:bg-emerald-700 ${
                    isActive("/feed", "most-liked")
                      ? "text-white bg-emerald-700"
                      : "text-emerald-200"
                  }`}
                >
                  Mais Curtidas
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

// Fallback simples para o Suspense
function NavBarFallback() {
  return (
    <nav className="bg-emerald-800">
      <div className="mx-auto max-w-7xl p-4 relative">
        <div className="flex items-center justify-center">
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex items-center gap-8 font-medium">
              <li>
                <span className="text-emerald-200">Home</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="h-10 w-24 bg-emerald-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function NavBarComponent() {
  return (
    <Suspense fallback={<NavBarFallback />}>
      <NavBarContent />
    </Suspense>
  );
}
