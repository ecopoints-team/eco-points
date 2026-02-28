"use client";

import { ChevronDown, GraduationCapIcon } from "lucide-react";
// import { useEffect, useState } from "react";

export default function Hero() {
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // useEffect(() => {
  //   function handleMouseMove(e) {
  //     setMousePosition({ x: e.clientX, y: e.clientY });
  //   }

  //   window.addEventListener("mousemove", handleMouseMove);

  //   return () => window.removeEventListener("mousemove", handleMouseMove);
  // }, []);
  const concept = [
    {
      title: "Automation",
      description:
        " EcoPoints is an Automated Reverse Vending Machine (RVM) prototype designed to address the critical issue of plastic waste management.",
      image: "/SampleImage-Features-four.jpg",
    },
    {
      title: "QR-Based Authentication",
      description:
        "QR-Based User Authentication and Embedded Sensor Technology our machine verifies and compacts PET bottles, converting waste into digital currency.",
      image: "/SampleImage-QRAuthentication.jpeg",
    },
    {
      title: "User Portal",
      description:
        "This website serves as the user portal where you can register, track your recycling history, and monitor your EcoPoints balance.",
      image: "/SampleImage-Tracking.jpg",
    },
  ];

  const howItWorks = [
    {
      number: "01",
      title: "Scan QR Code",
      description: "Authenticate instantly with your unique QR code",
      image: "/SampleImage-Scan.png",
    },
    {
      number: "02",
      title: "Insert Bottle",
      description: "Place your clean PET bottle for automated verification",
      image: "/SampleImage-Features-four.jpg",
    },
    {
      number: "03",
      title: "Earn Points",
      description: "Points received is instantly credited to your account!",
      image: "/SampleImage-CurrentPoints.png",
    },
    {
      number: "04",
      title: "Redeem Rewards",
      description: "Browse catalog and redeem items with your points",
      image: "/SampleImage-UserIcon.png",
    },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen deep-forest-bg flex item-center justify-center  sm:px-6 md:px-6 lg:px-20 pt-28 sm:pt-32 overflow-hidden scroll-mt-28"
    >
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');
      </style>

      {/* MOUSE GRADIENT */}
      {/* <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, #e67d22b7, transparent 50%)`,
        }}
      /> */}

      {/* Pulse Background */}
      {/* <div className="absolute top-30 left-4 sm:left-10 w-48 sm:w-72 h-48 sm: h-72 bg-teal-900/70 rounded-full blur-3xl animate-pulse"></div> */}
      {/* <div className="absolute top-15 right-4 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 accent-color-background rounded-full blur-3xl animate-pulse delay-1000"></div> */}

      {/*  */}
      {/* Grid Container Hero Section */}
      {/*  */}
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #1 */}
          <div className="">
            {/* Introducing EcoPoints */}
            <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-amber-600/40 border accent-color-border rounded-full mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-500 hover:translate-y-2 transition-transform duration-300 hover:scale-105">
              <GraduationCapIcon className="lg:w-7 lg:h-7 md:h-6 md:w-6 sm:w-6 sm:h-6 text-white" />
              <span className="sour-gummy-body-600 lg:text-lg md:text-sm sm:text-lg text-white text-center">
                PUP Institute of Technology Research Project
              </span>
            </div>
            {/* Header Text */}
            <h1 className="text-6xl sm:text-5xl md:text-6xl lg:text-5xl chewy-regular text-center mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg accent-color-text sm:text-8xl md:text-9xl lg:text-9xl  bg-clip-text text-transparent block mb-1 sm:2 ">
                EcoPoints:
              </span>
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 ">
                A Smart Recycling Initiative
              </span>
            </h1>
            {/* Content Text */}
            <p className="sm:text-xl md:text-2xl lg:text-3xl text-color-content text-center max-w-3xl mx-auto sour-gummy-body-300 lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed ">
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
          <div className="relative order-2 w-full transition-transform duration-300 hover:scale-102 hover:skew-1 hover:rotate-4 ">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
              <div className="backdrop-blur-sm rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5">
                {/* Container */}
                <div className="flex items-center justify-between lg:px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
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
        {/* HEADER SECTION */}
        <div className="max-w-7xl lg:py-20 sm:py-20 text-center relative w-full">
          {/* BACKGROUND IF MAGLALAGAY */}
          <div className="">
            <h2 className="sm:text-4xl md:text-5xl lg:text-5xl text-center chewy-regular mt-10 lg:mb-6 md:mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2">
                WELCOME TO THE OFFICIAL PLATFORM
              </span>
            </h2>
            <h2 className="sm:text-6xl md:text-7xl lg:text-8xl text-center chewy-regular mb-4 sm:mb-20 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-10 sm:2">
                FOR ECOPOINTS
              </span>
            </h2>
          </div>
          {/* CONCEPT AREA */}
          <h2 className="text-4xl sm:text-7xl md:text-5xl lg:text-6xl lg:py-5 sm:py-8 chewy-regular mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 text-center uppercase tracking-[0.2em]">
              Concept
            </span>
          </h2>
          {/* CONTAINERS AREA*/}
          {/* CONTAINER */}
          <div className="flex lg:grid lg:grid-cols-3 soft-sage-bg rounded-lg sm:space-y-6 sm:space-x-6 sm:p-6 sm:mb-10 md:space-y-16 md:space-x-8 lg:w-auto lg:h-auto lg:p-6 mb-10 lg:space-y-4 lg:space-x-8">
            {concept.map((concept) => (
              <div className="">
                {/* IMAGE SECTION */}
                <div className="flex w-full overflow-hidden">
                  <div className="relative group">
                    {/* INNER-CONTAINER (IMAGE) */}
                    {/* <div> secondary-color rounded-lg lg:w-auto lg:h-110 p-3 sm:p-4 font-mono text-xs sm:text-sm */}
                    {/* PICTURES */}
                    <div className="flex w-full transition-transform duration-300 hover:skew-2 hover:rotate-6 ">
                      {/* If mag lalagay ng Photo dito ilalagay */}
                      <img
                        src={concept.image}
                        alt={concept.image}
                        className="rounded-lg sm:w-120 sm:h-50 md:w-100 md:h-40 lg:w-100 lg:h-50"
                      />
                    </div>
                    {/* TEXT SECTION */}
                    <div className="flex w-full">
                      <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                        <h3 className="text-4xl sm:text-4xl lg:text-3xl text-color-content chewy-regular text-center sm:mb-6 sm:mt-6 md:mb-6 md:mt-6 lg:mb-2 lg:mt-2">
                          {concept.title}
                        </h3>
                        <p className="text-shadow-lg text-color-content sour-gummy-body-500 text-center sm:text-xl md:text-lg lg:text-xl">
                          {concept.description}
                        </p>
                      </div>
                    </div>
                    {/* </div> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* HOW IT WORKS AREA */}
          <h2 className="text-4xl sm:text-6xl md:text-5xl lg:text-4xl xl:text-5xl lg:py-5 sm:py-8 chewy-regular mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 text-center uppercase tracking-[0.2em]">
              How it Works?
            </span>
          </h2>
          {/* CONTAINERS AREA*/}
          {/* CIRCUIT-LINE  */}
          <div dir="ltr">
            {/* FROM LEFT - 1ST LINE*/}
            <div className="absolute sm:opacity-0  md:start-20 md:top-320 lg:start-0 lg:top-310 ">
              <img
                src="/SampleBorder(Circuit-Line-Left).png"
                className="rounded-lg sm:w-60 sm:h-40 md:w-50 md:h-40 lg:w-130 lg:h-70"
              />
            </div>
            {/* 2ND LINE */}
            <div className="absolute sm:opacity-0 md:start-98 md:top-300 lg:start-45 lg:top-270">
              <img
                src="/SampleBorder(Circuit-Line-Left).png"
                className="rounded-lg sm:w-60 sm:h-40 md:w-50 md:h-40 lg:w-130 lg:h-70"
              />
            </div>
            {/* 3RD LINE */}
            <div className="absolute sm:opacity-0 md:start-150 md:top-340 lg:start-180 lg:top-290 ">
              <img
                src="/SampleBorder(Circuit-Line-Left).png"
                className="rounded-lg sm:w-60 sm:h-40 md:w-50 md:h-40 lg:w-130 lg:h-70"
              />
            </div>
          </div>
          <div className="flex flex-cols lg:grid lg:grid-cols-4 sm:grid sm:grid-cols-2 lg:space-y-32 lg:space-x-8 md:space-y-16 md:space-x-8  sm:space-y-4 sm:space-x-4">
            {/* CONTAINER */}
            {howItWorks.map((howItWorks) => (
              <div className="">
                {/* IMAGE SECTION */}
                <div className="flex w-full ">
                  <div className="relative group">
                    {/* INNER-CONTAINER (IMAGE) */}
                    <div className="secondary-color rounded-lg text-xs sm:p-6 sm:w-85 sm:h-120 lg:w-75 lg:h-120 ">
                      {/* PICTURES */}
                      <div className="accent-color-background rounded-lg px-4 py-4 transition-transform duration-700 hover:rotate-6 hover:scale-90 overflow-hidden shadow-xl transition-shadow">
                        <div className="flex w-full ">
                          {/* If mag lalagay ng Photo dito ilalagay */}
                          <img
                            src={howItWorks.image}
                            alt={howItWorks.image}
                            className="rounded-lg sm:w-120 sm:h-50 md:w-100 md:h-40 lg:w-100 lg:h-50"
                          />
                        </div>
                      </div>
                      {/* TEXT SECTION */}
                      <div className="flex w-full">
                        <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                          <h3 className="text-4xl sm:text-3xl lg:text-3xl chewy-regular text-center sm:mb-6 sm:mt-6 md:mb-6 md:mt-6 lg:mb-2 lg:mt-2 text-color">
                            {howItWorks.number}
                          </h3>
                          <h1 className="text-4xl sm:text-3xl lg:text-3xl chewy-regular text-center sm:mb-6 md:mb-6 lg:mb-2 lg:mt-2 text-color">
                            {howItWorks.title}
                          </h1>
                          <p className="text-shadow-lg text-color sour-gummy-body-500 text-center sm:text-xl md:text-md lg:text-xl">
                            {howItWorks.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* LEAF BORDER */}
      </div>
    </section>
  );
}
