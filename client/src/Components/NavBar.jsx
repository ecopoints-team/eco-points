'use client'

import { Menu, MenuIcon, X } from "lucide-react";
import { useState} from "react";
import Link from "next/link";

export default function NavBar() {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-lime-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          <Link href="/">
            <div className="flex item-center space-x-1 group cursor-pointer hover:translate-y-1 transition-transform duration-400">
              <div>
                {/* LOGO HERE */}
                <img
                  src="/logo-removebg-preview.png"
                  alt="EcoPoints"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
              </div>
              {/* CAPSTONE PROJECT NAME */}
              <span className="text-lg sm:text-xl md:text-2xl">
                <span className="text-amber-500 font-medium">Eco</span>
                <span className="text-green-500 font-bold">Points</span>
              </span>
            </div>
          </Link>

          {/* NAV LINKS + LOG IN TAB */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 font-medium text-white ">
            <Link
              href="/"
              className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
            >
              Home
            </Link>
            <Link
              href="/features"
              className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
            >
              Features
            </Link>
            <Link
              href="/services"
              className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
            >
              Services
            </Link>
            <Link
              href="/rewards"
              className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
            >
              Rewards
            </Link>
            <Link
              href="/about"
              className="hover:text-orange-400 hover:translate-y-2 transition-transform duration-400 hover:scale-110 hover:font-medium text-sm lg:text-base"
            >
              About Us
            </Link>
          </div>
          <div className="sm:w-auto px-1 sm:px-2 py-1 sm:py-0.8 rounded-lg border border:white/20 font-light hidden md:flex items-center space-x-6 lg:space-x-8 transition-all duration-300 hover:bg-amber-700/80 hover:rounded-lg hover:font-medium">
            <Link href="/login">Log In</Link>
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
            <Link
              href="/"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-white hover:text-orange-600 text-sm lg:text-base"
            >
              Home
            </Link>
            <Link
              href="/features"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-white hover:text-orange-600 text-sm lg:text-base"
            >
              Features
            </Link>
            <Link
              href="/services"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-white hover:text-orange-600 text-sm lg:text-base"
            >
              Services
            </Link>
            <Link
              href="/rewards"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-white hover:text-orange-600 text-sm lg:text-base"
            >
              Rewards
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuIsOpen(false)}
              className="block text-white hover:text-orange-600 text-sm lg:text-base"
            >
              About Us
            </Link>
            <span>
              <Link
                href="/login"
                onClick={() => setMobileMenuIsOpen(false)}
                className="block text-white hover:text-orange-600 text-sm lg:text-base"
              >
                Log In
              </Link>
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
