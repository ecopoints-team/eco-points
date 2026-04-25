// Home Page
// Footer

"use client";

import { useState, useEffect, useRef } from "react";

export default function Footer() {
  const footerQuickLinks = [
    { name: "Home", link: "#home" },
    { name: "How It Works", link: "#how-it-works" },
    { name: "Features", link: "#features" },
    { name: "Leaderboard", link: "#leaderboard" },
    { name: "Rewards", link: "#rewards" },
  ];

  const footerResources = [
    { name: "FAQs", link: "#" },
    { name: "Terms and Conditions", link: "#" },
    { name: "Documentation and Support", link: "#" },
  ];

  const footerContactDetails = [
    {
      name: "Jana Louise C. Soriano",
      position: "Project Manager & Automation Engineer",
      personalEmail: "soriano.janalouise@gmail.com",
    },
    {
      name: "Justine James S. Ibale",
      position: "Project Manager & System Integrator",
      personalEmail: "ibalejustine03@gmail.com",
    },
    {
      name: "John Paul D. Elias",
      position: "Backend Developer",
      personalEmail: "johnpaul.elias101@gmail.com",
    },
    {
      name: "Jaydine C. Nuval",
      position: "Frontend Developer",
      personalEmail: "jaydinenuval@gmail.com",
    },
    {
      name: "Rodge Steven Jude D. Funtalba",
      position: "Frontend Developer",
      personalEmail: "rodgestevenjude.funtalba@gmail.com",
    },
  ];

  const year = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#064e3b] text-white pt-20 pb-8 px-4 md:px-8 relative z-10">
      <div className={`max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        {/* Logo & Description */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/EcoPoints Primary Logo (Light version).png"
              alt="EcoPoints Logo"
              className="h-12 w-auto"
            />
          </div>
          <p
            className="text-[rgba(255,255,255,0.8)] leading-relaxed"
            style={{ fontFamily: "'Quicksand'" }}
          >
            A smart recycling initiative powered by technology and
            sustainability.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            className="mb-4 font-bold text-lg text-white"
            style={{ fontFamily: "'Fredoka'" }}
          >
            Quick Links
          </h4>
          <ul className="list-none space-y-3">
            {footerQuickLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.link}
                  className="text-[rgba(255,255,255,0.8)] no-underline hover:text-[#34d399] transition-colors duration-300"
                  style={{ fontFamily: "'Quicksand'" }}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4
            className="mb-4 font-bold text-lg text-white"
            style={{ fontFamily: "'Fredoka'" }}
          >
            Resources
          </h4>
          <ul className="list-none space-y-3">
            {footerResources.map((resource) => (
              <li key={resource.name}>
                <a
                  href={resource.link}
                  className="text-[rgba(255,255,255,0.8)] no-underline hover:text-[#34d399] transition-colors duration-300"
                  style={{ fontFamily: "'Quicksand'" }}
                >
                  {resource.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4
            className="mb-4 font-bold text-lg text-white"
            style={{ fontFamily: "'Fredoka'" }}
          >
            Contact Us
          </h4>
          <ul className="list-none space-y-4">
            {footerContactDetails.slice(0, 3).map((contact) => (
              <li key={contact.name}>
                <p
                  className="text-[#34d399] text-sm font-bold"
                  style={{ fontFamily: "'Fredoka'" }}
                >
                  {contact.name}
                </p>
                <p
                  className="text-[rgba(255,255,255,0.7)] text-xs"
                  style={{ fontFamily: "'Quicksand'" }}
                >
                  {contact.position}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div
        className="max-w-[1400px] mx-auto pt-8 border-t border-[rgba(255,255,255,0.1)] text-center text-[rgba(255,255,255,0.7)]"
        style={{ fontFamily: "'Quicksand'" }}
      >
        &copy; {year} EcoPoints. A PUP Institute of Technology Research
        Project.
      </div>
    </footer>
  );
}
