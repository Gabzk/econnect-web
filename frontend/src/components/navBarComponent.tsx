"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function NavBarContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string, sortParam?: string) => {
    if (path === "/") return pathname === "/";
    if (pathname === path) {
      const currentSort = searchParams.get("sort");
      return sortParam ? currentSort === sortParam : !currentSort;
    }
    return false;
  };

  const linkClasses = (active: boolean) =>
    `transition-colors hover:text-amber-100 ${
      active ? "text-white font-bold" : "text-emerald-200"
    }`;

  const mobileLinkClasses = (active: boolean) =>
    `block rounded-lg px-4 py-2 hover:bg-emerald-700 ${
      active ? "text-white bg-emerald-700" : "text-emerald-200"
    }`;

  return (
    <nav className="bg-emerald-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden text-emerald-200 hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>

          {/* Spacer esquerdo para balancear o layout no desktop */}
          <div className="hidden md:block md:flex-1" />

          {/* Desktop Navigation Links - Centralizados */}
          <ul className="hidden md:flex items-center gap-6 font-medium">
            <li>
              <Link href="/" className={linkClasses(isActive("/"))}>
                Home
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link href="/feed" className={linkClasses(isActive("/feed"))}>
                    Feed
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hottest"
                    className={linkClasses(isActive("/hottest"))}
                  >
                    Mais Curtidas
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* User Menu */}
          <div className="md:flex-1 flex justify-end items-center gap-2">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-full"
                    aria-label="User menu"
                  >
                    <Image
                      className="h-8 w-8 rounded-full ring-2 ring-emerald-600"
                      src="/tigreen.png"
                      alt="User profile"
                      width={32}
                      height={32}
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-sm text-white bg-emerald-700 hover:bg-emerald-600 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-1.5 text-sm text-white bg-emerald-700 hover:bg-emerald-600 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg px-3 py-1.5 text-sm text-emerald-800 bg-amber-100 hover:bg-amber-200 transition-colors font-medium"
                  >
                    Cadastrar
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "max-h-48 opacity-100 border-t border-emerald-700"
            : "max-h-0 opacity-0"
        }`}
      >
        <ul className="space-y-1 px-4 py-3">
          <li>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileLinkClasses(isActive("/"))}
            >
              Home
            </Link>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <Link
                  href="/feed"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileLinkClasses(isActive("/feed"))}
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/hottest"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileLinkClasses(isActive("/hottest"))}
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

function NavBarFallback() {
  return (
    <nav className="bg-emerald-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6 font-medium">
            <span className="text-emerald-200">Home</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-emerald-700 rounded-lg animate-pulse" />
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
