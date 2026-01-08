'use client'

import { MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function NavBar() {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const rewardsDomain =
    process.env.NEXT_PUBLIC_REWARDS_DOMAIN ?? "https://rewards.ecopoints.com";
  const navLinks = [
    { label: "Home", target: "home" },
    { label: "Features", target: "features" },
    { label: "Services", target: "services" },
    { label: "Showcase", target: "rewards" },
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
  const openLoginModal = useCallback(() => {
    if (isLoggedIn) {
      return;
    }
    setIsLoginModalOpen(true);
    setMobileMenuIsOpen(false);
  }, [isLoggedIn, setMobileMenuIsOpen]);

  const handleMockLogin = useCallback(() => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-lime-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
           <Link href="/">
            <div className="flex items-center space-x-1 group cursor-pointer hover:translate-y-1 transition-transform duration-400">
              <div>
                {/* LOGO HERE */}
                <img
                  src="/Logo Elements (Light).png"
                  alt="Logo"
                  className="w-6 h-8 sm:w-6 sm:h-10"
                />
              </div>
              {/* CAPSTONE PROJECT NAME */}
              <span className="text-lg sm:text-xl md:text-2xl">
                <img
                  src="/EcoPoints Primary Logo (Light version).png"
                  alt="Logo"
                  className="w-6 h-8 sm:w-30 sm:h-8"
                />
                {/* <span className="text-amber-500 font-medium">Eco</span>
                <span className="text-green-500 font-bold">Points</span> */}
              </span>
            </div>
          </Link>

          {/* NAV LINKS + LOG IN TAB */}
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
          <div className="sm:w-auto px-1 sm:px-2 py-1 sm:py-0.8 rounded-lg border border:white/20 font-light hidden md:flex items-center space-x-6 lg:space-x-8 transition-all duration-300 hover:bg-amber-700/80 hover:rounded-lg hover:font-medium">
            {isLoggedIn ? (
              <span
                className="w-9 h-9 rounded-full bg-amber-400/90 border border-white/40 inline-flex items-center justify-center"
                aria-label="Logged in"
              ></span>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="text-white text-sm lg:text-base"
              >
                Log In
              </button>
            )}
          </div>
          {/* MENU FOR SMALL DEVICES (PHONE, TABLET, etc.) */}
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

      {/* FUNCTION FOR THE MENU */}
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
              {isLoggedIn ? (
                <span
                  className="inline-flex w-9 h-9 rounded-full bg-amber-400/90 border border-white/30"
                  aria-label="Logged in"
                ></span>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="block text-left text-white hover:text-orange-600 text-sm lg:text-base"
                >
                  Log In
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </nav>

      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="10 rounded-2xl p-6 max-w-sm w-full space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
            </div>
            <div className="bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-white/20 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMockLogin}
                className="px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Mock Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
