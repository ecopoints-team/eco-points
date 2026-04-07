"use client";

import {
  ScanEye,
  HandshakeIcon,
  ScanQrCode,
  MonitorCloud,
  RectangleVertical,
  SquareSquare,
  Leaf,
} from "lucide-react";

import React, { useEffect, useRef, useState } from "react";

export default function Features() {
  const featuresList = [
    {
      title: "Vision System",
      listDescription: [
        "Intelligent sensors verify valid PET bottles.",
        "Rejects non-plastic or invalid items.",
        "Prevents contamination in the bin.",
      ],
      icon: <ScanEye className="w-[6rem] h-[6rem] justify-self-center" />,
      iconDetails: "Camera and Image Processing",
    },
    {
      title: "User-Friendly Experience",
      listDescription: [
        "Designed with ergonomic, user-first flow.",
        "Guides users through recycling quickly.",
        "Easy to use for everyone without training.",
      ],
      icon: <HandshakeIcon className="w-[6rem] h-[6rem] justify-self-center" />,
      iconDetails: "User-Friendly",
    },

    {
      title: "Reverse Vending Machine (RVM)",
      listDescription: [
        "Automates bottle sorting and compaction.",
        "Reduces bottle volume for more storage.",
        "Identifies PET materials and rejects contaminants.",
      ],
      icon: <SquareSquare className="w-[6rem] h-[6rem] justify-self-center" />,

      iconDetails: "RVM-Showcase",
    },
    {
      title: "Web-Connected Rewards System",
      listDescription: [
        "IoT-enabled machine updates rewards instantly.",
        "Recycling actions sync to the cloud.",
        "Check points on your dashboard anytime.",
      ],
      icon: <MonitorCloud className="w-[6rem] h-[6rem] justify-self-center" />,
      iconDetails: "Rewards-Showcase",
    },
    {
      title: "QR-Based User Authentication System",
      listDescription: [
        "Secure QR login for instant access.",
        "Each user has a unique QR code.",
        "Scan to identify your account touch-free.",
      ],
      icon: <ScanQrCode className="w-[8rem] h-[8rem] justify-self-center" />,
      iconDetails: "QR-Code",
    },
  ];

  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionRef = useRef(null);

  // SCROLL-TRIGGERED FEATURES REVEAL ANIMATION
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // First reveal header
            setHeaderVisible(true);

            // Then reveal steps one by one with delay after header animation
            setTimeout(() => {
              featuresList.forEach((_, index) => {
                setTimeout(() => {
                  setVisibleFeatures((prev) => [...prev, index]);
                }, index * 300); // 300ms delay between each step
              });
            }, 600); // Wait 600ms after header starts animating
          }
        });
      },
      { threshold: 0.3 }, // Trigger when 30% of section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // PARALLAX SCROLL EFFECT
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const offset = rect.top;

      const topLeaf1 = document.getElementById("top-leaf-1");
      const topLeaf2 = document.getElementById("top-leaf-2");
      const bottomLeaf1 = document.getElementById("bottom-leaf-1");
      const bottomLeaf2 = document.getElementById("bottom-leaf-2");

      // PARALLAX BASED ON SECTION POSITION (not window scroll)
      if (topLeaf1) {
        topLeaf1.style.transform = `translateY(${offset * 0.15}px)`;
      }
      if (topLeaf2) {
        topLeaf2.style.transform = `translateY(${offset * -0.1}px)`;
      }
      if (bottomLeaf1) {
        bottomLeaf1.style.transform = `translateY(${offset * 0.08}px)`;
      }
      if (bottomLeaf2) {
        bottomLeaf2.style.transform = `translateY(${offset * -0.06}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // FEATURES SECTION
    <section
      ref={sectionRef}
      id="features"
      className="relative mb-32 min-h-300 flex items-center justify-center bg-slate-50 rounded-lg"
    >
      {/* ROOT DIV */}
      <div className="p-10">
        <Leaf
          id="top-leaf-1"
          className="pointer-events-none absolute left-10 top-10 h-[3rem] w-[3rem] text-emerald-400 opacity-50 rotate-12 will-change-transform"
        />

        <Leaf
          id="top-leaf-2"
          className="pointer-events-none absolute right-16 top-20 h-[5rem] w-[5rem] text-emerald-500 opacity-40 -rotate-12 will-change-transform"
        />

        <Leaf
          id="bottom-leaf-1"
          className="pointer-events-none absolute left-20 bottom-20 h-[2.5rem] w-[2.5rem] text-emerald-600 opacity-40 rotate-45 will-change-transform"
        />

        <Leaf
          id="bottom-leaf-2"
          className="pointer-events-none absolute right-10 bottom-16 h-[4rem] w-[4rem] text-emerald-500 opacity-35 rotate-90 will-change-transform"
        />
        <h2
          className={`text-4xl md:text-5xl font-bold text-emerald-900 col-span-2 mb-4 justify-self-center transition-all duration-500 ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Features
        </h2>
        <p
          className={`text-xl font-medium text-gray-500 col-span-2 mb-10 justify-self-center transition-all duration-700 ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Our smart recycling bin combines cutting-edge technology to make
          recycling easier and more efficient.
        </p>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-600 opacity-20 blur-3xl rounded-full"></div>
        </div>
        {/* CONTENT ROOT */}
        <div className="max-w-6xl grid grid-cols-2 gap-4 items-center">
          {featuresList.map((feature, index) => (
            // FEATURE CARD
            <div
              key={index}
              className={index >= 4 ? "col-span-2" : "col-span-1"}
            >
              {/* FEATURE CONTENT */}
              <div
                key={index}
                className={`grid grid-cols-1 gap-6 mb-4 p-10 rounded-lg border border-green-500/50 bg-green-50/5 backdrop-blur-sm shadow-md overflow-hidden transition-all duration-300 ${
                  visibleFeatures.includes(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                {/* ICON */}
                <div className="mb-4">{feature.icon}</div>
                {/* TITLE */}
                <h3
                  className={
                    index >= 4
                      ? "text-4xl justify-self-center font-semibold text-emerald-900"
                      : "text-2xl justify-self-center font-semibold text-emerald-900"
                  }
                >
                  {feature.title.toUpperCase()}
                </h3>
                {/* DESCRIPTION LIST */}
                <ul>
                  {feature.listDescription.map((description, i) => (
                    <li
                      key={i}
                      className={
                        index >= 4
                          ? "text-xl justify-self-center text-gray-500 mb-4"
                          : "text-md justify-self-center text-gray-500 mb-4"
                      }
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* GRADIENT BACKGROUND */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-[120px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#10b981" // emerald-500
            fillOpacity="0.3"
            d="M0,192L60,186.7C120,181,240,171,360,165.3C480,160,600,160,720,170.7C840,181,960,203,1080,202.7C1200,203,1320,181,1380,170.7L1440,160V320H0Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}
