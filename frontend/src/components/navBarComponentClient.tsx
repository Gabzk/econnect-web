"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function NavBarComponent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const _router = useRouter();

  const handleLogout = async () => {
    await logout();
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
                  className="text-white transition-colors hover:text-amber-100"
                >
                  Home
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/feed"
                      className="text-emerald-200 transition-colors hover:text-amber-100"
                    >
                      Feed
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/feed"
                      className="text-emerald-200 transition-colors hover:text-amber-100"
                    >
                      Mais Curtidas
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* User Menu - Sempre no canto direito */}
          <div className="flex items-center gap-3 ml-auto">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  {/* User Avatar */}
                  <button
                    type="button"
                    className="rounded-full focus:outline-none focus:ring-4 focus:ring-emerald-600"
                    aria-label="User menu"
                  >
                    <Image
                      className="h-10 w-10 rounded-full ring-2 ring-emerald-600"
                      src="/tigreen.png"
                      alt="User profile"
                      width={40}
                      height={40}
                    />
                  </button>

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
              className="block rounded-lg px-4 py-2 text-white hover:bg-emerald-700"
            >
              Home
            </Link>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <Link
                  href="/feed"
                  className="block rounded-lg px-4 py-2 text-emerald-200 hover:bg-emerald-700"
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/feed"
                  className="block rounded-lg px-4 py-2 text-emerald-200 hover:bg-emerald-700"
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
