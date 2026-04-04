"use client";

export default function NavBar({ onLoginClick }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-lime-950/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* LOGO */}
          <div className="flex items-center">
            <img
              src="/EcoPoints Logo Mark with Name (Light Version).png"
              alt="EcoPoints Logo"
              className="h-10 md:h-12 w-auto"
            />
          </div>

          {/* LOGIN BUTTON */}
          <div>
            <button
              id="navbar-login-btn"
              type="button"
              onClick={onLoginClick}
              className="px-5 py-2 rounded-lg border border-white/20 text-white text-sm md:text-base font-body-regular hover:bg-amber-700/80 transition-colors duration-200 cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
