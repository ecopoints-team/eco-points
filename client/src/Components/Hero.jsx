"use client";

import {
  ArrowRight,
  BottleWine,
  BottleWineIcon,
  ChevronDown,
  Play,
  QrCodeIcon,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex item-center justify-center pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, #e67d22b7, transparent 50%)`,
        }}
      />
      {/* Pulse Background */}
      {/* <div className="absolute top-30 left-4 sm:left-10 w-48 sm:w-72 h-48 sm: h-72 bg-teal-900/70 rounded-full blur-3xl animate-pulse"></div> */}
      {/* <div className="absolute top-15 right-4 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 accent-color-background rounded-full blur-3xl animate-pulse delay-1000"></div> */}

      {/*  */}
      {/* Grid Container Hero Section */}
      {/*  */}

      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #1 */}
          <div>
            {/* Introducing EcoPoints */}
            <div className="inline-flex item-center space-x-2 px-3 sm:px-4 py-2 bg-amber-600/40 border accent-color-border rounded-full mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-500 hover:translate-y-2 transition-transform duration-300 hover:scale-105">
              <QrCodeIcon className="w-5 h-5 text-white" />
              <span className="font-header lg:text-sm sm:text-md text-white">
                Introduction of EcoPoints
              </span>
            </div>
            {/* Header Text */}
            <h1 className="text-6xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 ">
                EcoPoints: A Smart
              </span>
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 ">
                Recycling Initiative
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed ">
              Bridging the gap between technology and environmental
              sustainability through an automated reward system.
            </p>

            {/* BUTTONS inside Grid #1
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 animate-in slide-in-from-bottom duration-700 delay-300">
                    <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-b from-green-400 to-orange-600 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-102 flex items-center justify-center space-x-2">
                        <div>Tanga Ka Ba? Pindutin mo na~</div>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>

                    <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-white/10 flex items-center justify-center space-x-2">
                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 duration-300 transition-colors">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                        </div>
                        <span>Tanga Ka (Watch)</span>
                    </button>
                </div> */}
          </div>

          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="relative order-2 w-full hover:translate-y-2 transition-transform duration-300 hover:scale-102">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
              <div className="backdrop-blur-sm rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5">
                {/* Container */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    {/* Three Circles */}
                    {/* <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-300" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600" />
                    </div> */}
                    <span className="text-cs font-medium sm:text-sm text-white"></span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                {/* Inside Container */}
              </div>
            </div>
          </div>

          {/* Floating Cards */}
        </div>
        <div className="max-w-7xl px-3 sm:px-4 lg:py-20 sm:py-20 text-center relative w-full">
          <h2 className="text-5xl sm:text3xl md:text-4xl lg:text-3xl xl:text-6xl text-center font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2">
              WELCOME TO THE OFFICIAL PLATFORM
            </span>
          </h2>
          <h2 className="text-5xl sm:text3xl md:text-4xl lg:text-3xl xl:text-6xl text-center font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2">
              FOR ECOPOINTS
            </span>
          </h2>
          <h2 className="text-4xl sm:text2xl md:text-3xl lg:text-4xl xl:text-5xl text-left lg:py-15 sm:py-8 font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 text-center">
              C O N C E P T
            </span>
          </h2>
          <p className="text-shadow-lg text-md sm:text-base lg:text-2xl text-white max-w-auto mx-auto font-body-black text-justify lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            EcoPoints is an Automated Reverse Vending Machine (RVM) prototype
            designed to address the critical issue of plastic waste management.
          </p>
          <p className="text-shadow-lg text-md sm:text-base lg:text-2xl text-white max-w-auto mx-auto font-body-black text-justify lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            By utilizing QR-based user authentication and embedded sensor
            technology, our machine verifies and compacts PET bottles,
            converting waste into digital currency. This website serves as the
            user portal where you can register, track your recycling history,
            and monitor your EcoPoints balance.
          </p>
          <p className="text-shadow-lg text-md sm:text-base lg:text-2xl text-white max-w-auto mx-auto font-body-black text-justify lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            This website serves as the user portal where you can register, track
            your recycling history, and monitor your EcoPoints balance.
          </p>
        </div>
      </div>
    </section>
  );
}
