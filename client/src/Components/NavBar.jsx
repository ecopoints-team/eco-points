'use client'

import { MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

// 1. Accept the 'onLoginClick' prop from page.js
export default function NavBar({ onLoginClick }) {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);

  const navLinks = [
    { label: "Home", target: "home" },
    { label: "Features", target: "features" },
    { label: "Services", target: "services" },
    { label: "Showcase", target: "showcase" },
    { label: "About Us", target: "about" },
  ];

  const handleNavClick = useCallback(
    (target) => {
      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/#${target}`);
      }
      setMobileMenuIsOpen(false);
    },
    [setMobileMenuIsOpen]
  );

  const handleNavLinkClick = useCallback(
    (link) => {
      if (link.external && link.href) {
        setMobileMenuIsOpen(false);
        if (typeof window !== "undefined") {
          window.location.assign(link.href);
        }
        return;
      }
      handleNavClick(link.target);
    },
    [handleNavClick, setMobileMenuIsOpen]
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-lime-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
            <Link href="/">
              <div className="flex items-center space-x-1 group cursor-pointer hover:translate-y-1 transition-transform duration-400">
                <div>
                  <img
                    src="/Logo Elements (Light).png"
                    alt="Logo"
                    className="w-6 h-8 sm:w-6 sm:h-10"
                  />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl">
                  <img
                    src="/EcoPoints Primary Logo (Light version).png"
                    alt="Logo"
                    className="w-6 h-8 sm:w-30 sm:h-8"
                  />
                </span>
              </div>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 font-medium text-white ">
              {navLinks.map((link) => (
                <button
                  key={link.target}
                  type="button"
                  onClick={() => handleNavLinkClick(link)}
                  className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* LOGIN BUTTON (Desktop) */}
            <div className="sm:w-auto px-1 sm:px-2 py-1 sm:py-0.8 rounded-lg border border:white/20 font-light hidden md:flex items-center space-x-6 lg:space-x-8 transition-all duration-300 hover:bg-amber-700/80 hover:rounded-lg hover:font-medium">
              <button
                type="button"
                onClick={onLoginClick} // 👈 2. Calls the function passed from page.js
                className="text-white text-sm lg:text-base"
              >
                Log In
              </button>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="md:hidden items-center p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuIsOpen((prev) => !prev)}
            >
              {mobileMenuIsOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuIsOpen && (
          <div className="md:hidden bg-lime-950/90 backdrop-blur-lg border-t border-white animate-in slide-in-from-top duration-500">
            <div className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.target}
                  type="button"
                  onClick={() => handleNavLinkClick(link)}
                  className="block text-white hover:text-orange-600 text-sm lg:text-base text-left w-full"
                >
                  {link.label}
                </button>
              ))}
              <span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuIsOpen(false); // Close menu first
                    onLoginClick(); // Then open login modal
                  }}
                  className="block text-left text-white hover:text-orange-600 text-sm lg:text-base"
                >
                  Log In
                </button>
              </span>
            </div>
          </div>
        )}
      </nav>
      
      {/* 3. The "Mock Log In" white box code is completely REMOVED from here */}
    </>
  );
}