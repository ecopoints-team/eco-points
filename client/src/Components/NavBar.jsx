'use client'

import { MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useEffect } from "react";

export default function NavBar({ onLoginClick }) {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const navLinks = [
    { label: "Home", target: "home" },
    { label: "Features", target: "features" },
    { label: "Services", target: "services" },
    { label: "Showcase", target: "showcase" },
    { label: "About Us", target: "about" },
  ];

  // --- FRIEND'S SCROLL SPY LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => document.getElementById(link.target));
      
      // Find the first section that is roughly near the top of the viewport
      const current = sections.find(section => {
        if (section) {
          const rect = section.getBoundingClientRect();
          // Check if top is within view (between -150px and half screen height)
          return rect.top >= -150 && rect.top < window.innerHeight / 2;
        }
        return false;
      });

      if (current) {
        setActiveSection(current.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback((target) => {
      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/#${target}`);
      }
      setMobileMenuIsOpen(false);
      setActiveSection(target);
    }, []);

  const handleNavLinkClick = useCallback((link) => {
      if (link.external && link.href) {
        setMobileMenuIsOpen(false);
        if (typeof window !== "undefined") {
          window.location.assign(link.href);
        }
        return;
      }
      handleNavClick(link.target);
    }, [handleNavClick]);

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-lime-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          
          {/* LOGO SECTION */}
          <Link href="/">
            <div className="flex items-center space-x-1 group cursor-pointer hover:scale-105 transition-transform duration-300">
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

          {/* DESKTOP NAV LINKS (With Friend's Animation) */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 font-medium text-white">
            {navLinks.map((link) => {
              const isActive = activeSection === link.target;
              return (
                <button
                  key={link.target}
                  type="button"
                  onClick={() => handleNavLinkClick(link)}
                  className={`relative group text-sm lg:text-base transition-colors duration-300 ${
                    isActive ? "text-orange-300" : "text-white hover:text-orange-300"
                  }`}
                >
                  {link.label}
                  {/* Underline Animation */}
                <span 
                  className={`absolute bottom-0 h-0.5 bg-orange-300 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${
                    isActive ? "w-full" : "w-0"
                  }`}
                ></span>
                </button>
              );
            })}
          </div>

          {/* DESKTOP LOGIN BUTTON */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <div className="sm:w-auto px-1 sm:px-2 py-1 sm:py-0.8 rounded-lg border border-white/20 font-light transition-all duration-300 hover:bg-amber-700/80 hover:rounded-lg hover:font-medium">
              <button
                type="button"
                onClick={onLoginClick}
                className="text-white text-sm lg:text-base px-2"
              >
                Log In
              </button>
            </div>
          </div>

          {/* MOBILE MENU TOGGLE */}
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
                className={`block text-sm lg:text-base text-left w-full ${
                  activeSection === link.target ? "text-orange-400 font-bold" : "text-white hover:text-orange-600"
                }`}
              >
                {link.label}
              </button>
            ))}
            
            {/* Mobile Login Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuIsOpen(false);
                onLoginClick();
              }}
              className="block text-left text-white hover:text-orange-600 text-sm lg:text-base w-full mt-2 pt-2 border-t border-white/10"
            >
              Log In
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}