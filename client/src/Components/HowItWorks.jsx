// Home Page
// How It Works Section

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ScanQrCodeIcon,
  BottleWineIcon,
  CoinsIcon,
  HandCoinsIcon,
  Leaf,
} from "lucide-react";

export default function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionRef = useRef(null);

  // SCROLL-TRIGGERED STEP REVEAL ANIMATION
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // First reveal header
            setHeaderVisible(true);

            // Then reveal steps one by one with delay after header animation
            setTimeout(() => {
              steps.forEach((_, index) => {
                setTimeout(() => {
                  setVisibleSteps((prev) => [...prev, index]);
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
      const scrollY = window.scrollY;
      const bigCircle1 = document.getElementById("big-circle-1");
      const bigCircle2 = document.getElementById("big-circle-2");
      const smallCircle1 = document.getElementById("small-circle-1");

      const bigLeaf1 = document.getElementById("big-leaf-1");
      const bigLeaf2 = document.getElementById("big-leaf-2");
      const smallLeaf1 = document.getElementById("small-leaf-1");
      const smallLeaf2 = document.getElementById("small-leaf-2");

      // CIRCLES - slower parallax
      if (bigCircle1) {
        bigCircle1.style.transform = `translateY(${scrollY * -0.3}px)`;
      }
      if (bigCircle2) {
        bigCircle2.style.transform = `translateY(${scrollY * -0.3}px)`;
      }
      if (smallCircle1) {
        smallCircle1.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
      //   LEAFS WITH DIFFERENT SPEEDS AND DIRECTIONS FOR MORE DYNAMIC EFFECT
      if (bigLeaf1) {
        bigLeaf1.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
      if (bigLeaf2) {
        bigLeaf2.style.transform = `translateY(${scrollY * -0.3}px)`;
      }
      if (smallLeaf1) {
        smallLeaf1.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
      if (smallLeaf2) {
        smallLeaf2.style.transform = `translateY(${scrollY * -0.2}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const steps = [
    {
      number: "Step 1",
      title: "Scan QR Code",
      description: "Authenticate instantly with your unique QR code",
      icon: (
        <ScanQrCodeIcon className="w-42 h-42 text-amber-400 mb-8 justify-self-center" />
      ),
    },
    {
      number: "Step 2",
      title: "Insert Bottle Here",
      description: "Place your clean PET bottle for automated verification",
      icon: (
        <BottleWineIcon className="w-42 h-42 text-amber-400 mb-8 justify-self-center" />
      ),
    },
    {
      number: "Step 3",
      title: "Earn Points",
      description: "Points received is instantly credited to your account!",
      icon: (
        <CoinsIcon className="w-42 h-42 text-amber-400 mb-8 justify-self-center" />
      ),
    },
    {
      number: "Step 4",
      title: "Redeem Rewards",
      description: "Browse catalog and redeem items with your points",
      icon: (
        <HandCoinsIcon className="w-42 h-42 text-amber-400 mb-8 justify-self-center" />
      ),
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="mb-32 min-h-300 flex items-center justify-center relative border border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl px-2 py-12 md:px-12 md:py-16 overflow-hidden"
    >
      {/* PARALLAX CIRCLE GRADIENT */}
      <div
        id="big-circle-1"
        className="absolute gradient-circle-lg blur-3xl -bottom-150 -right-100 w-full h-full"
      />
      <div
        id="big-circle-2"
        className="absolute gradient-circle-lg blur-3xl top-60 -left-80 w-full h-full"
      />
      <div
        id="small-circle-1"
        className="absolute gradient-circle-md blur-3xl -top-70 -right-10 w-full h-full"
      />

      {/* PARALLAX LEAF ELEMENTS */}
      <Leaf
        size={200}
        id="big-leaf-1"
        className="pointer-events-none absolute -top-50 -right-10 text-lime-400/8 rotate-12"
        fill="currentColor"
      />
      <Leaf
        size={180}
        id="big-leaf-2"
        className="pointer-events-none absolute -bottom-60 -left-10 text-lime-400/8 rotate-12"
        fill="currentColor"
      />
      <Leaf
        size={90}
        id="small-leaf-1"
        className="pointer-events-none absolute top-70 right-15 text-lime-400/8 rotate-180"
        fill="currentColor"
      />
      <Leaf
        size={120}
        id="small-leaf-2"
        className="pointer-events-none absolute -top-50 -left-10 text-lime-400/8 rotate-180"
        fill="currentColor"
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* HEADER */}
        <div className="text-center mb-16">
          <span
            className={`mx-2 sm:text-4xl md:text-5xl lg:text-8xl font-bold text-white mb-4 transition-all duration-700 ease-out ${headerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
              }`}
          >
            How It
          </span>
          <span
            className={` mx-2 sm:text-4xl md:text-5xl lg:text-8xl font-bold text-transparent bg-clip-text bg-amber-400 transition-all duration-700 ease-out ${headerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
              }`}
          >
            Works
          </span>
          <p
            className={`my-4 text-gray-300 max-w-5xl mx-auto text-lg md:text-xl lg:text-2xl transition-all duration-700 ease-out delay-200 ${headerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
              }`}
          >
            Join the movement towards a more sustainable future by following
            these simple steps.
          </p>
        </div>

        {/* GRID AREA */}
        <div className="grid grid-cols-8 gap-16 w-full max-w-7xl justify-items-center">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`overflow-hidden group col-span-2 border border-white/30 bg-white/10 px-6 py-12 rounded-lg flex flex-col items-center text-center w-full h-full transition-all duration-700 ease-out hover:scale-110 ${visibleSteps.includes(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                }`}
            >
              <div className="rounded-lg w-full h-full flex flex-col items-center">
                {step.icon}
                <div className="absolute -z-10 gradient-circle-sm blur-2xl transition-opacity group-hover:opacity-60 " />
                {/* {step.image && (
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-auto mb-4"
                  />
                )} */}
                <h2 className="text-lg font-bold text-white mb-4">
                  {step.number}
                </h2>
                <h2 className="text-2xl font-bold text-amber-400">
                  {step.title}
                </h2>
                <p className="text-white text-lg">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
