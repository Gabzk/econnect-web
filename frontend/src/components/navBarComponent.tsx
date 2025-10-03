export default function NavBarComponent() {
  return (
    <nav className="bg-emerald-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Navigation Links - Desktop centered, Mobile hidden */}
        <div className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-8 font-medium">
            <li>
              <a
                href="#"
                className="text-white transition-colors hover:text-amber-100"
                aria-current="page"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-emerald-200 transition-colors hover:text-amber-100"
              >
                Mais Recentes
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-emerald-200 transition-colors hover:text-amber-100"
              >
                Mais Curtidas
              </a>
            </li>
          </ul>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* User Avatar */}
          <button
            type="button"
            className="rounded-full focus:outline-none focus:ring-4 focus:ring-emerald-600"
            aria-label="User menu"
          >
            <img
              className="h-10 w-10 rounded-full ring-2 ring-emerald-600"
              src="/docs/images/people/profile-picture-3.jpg"
              alt="User profile"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu - Hidden by default */}
      <div className="hidden border-t border-emerald-700 md:hidden">
        <ul className="space-y-1 p-4">
          <li>
            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-white hover:bg-emerald-700"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-emerald-200 hover:bg-emerald-700"
            >
              Mais Recentes
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block rounded-lg px-4 py-2 text-emerald-200 hover:bg-emerald-700"
            >
              Mais Curtidas
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
