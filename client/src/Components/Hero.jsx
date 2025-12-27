'use client'

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
    <section className="relative min-h-screen flex item-center justify-center pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, #ff7b00d4, transparent 50%)`,
        }}
      />
      {/* Pulse Background */}
      {/* <div className="absolute top-30 left-4 sm:left-10 w-48 sm:w-72 h-48 sm: h-72 bg-teal-900/70 rounded-full blur-3xl animate-pulse"></div> */}
      <div className="absolute top-15 right-4 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 bg-orange-500/40 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/*  */}
      {/* Grid Container Hero Section */}
      {/*  */}

      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #1 */}
          <div>
            {/* Introducing EcoPoints */}
            <div className="inline-flex item-center space-x-2 px-3 sm:px-4 py-2 bg-amber-600/40 border border-orange-700/60 rounded-full mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-500 hover:translate-y-2 transition-transform duration-300 hover:scale-105">
              <QrCodeIcon className="w-5 h-5 text-white" />
              <span className="font-medium text-xs sm:text-sm text-white">
                Introducing EcoPoints
              </span>
            </div>
            {/* Header Text */}
            <h1 className="text-5xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2">
                Reduce, Use,
              </span>
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2">
                and Explore
              </span>
              <span className="font-bold bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2">
                With EcoPoints
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-md sm:text-base lg:text-lg text-white max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              A SMART RECYCLING SOLUTION. Lorem ipsum, dolor sit amet
              consectetur adipisicing elit. Illo error eos nisi, provident modi
              quidem amet ab eum voluptas numquam debitis, sunt quaerat in
              incidunt, repellat fuga. Maiores, harum aut.
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
              </div>
            </div>
          </div>
          

          {/* Floating Cards */}
        </div>
      </div>
    </section>
  );
}
