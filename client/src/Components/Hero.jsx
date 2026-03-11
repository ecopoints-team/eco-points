"use client";

import { ChevronDown, GraduationCapIcon } from "lucide-react";
// import { useEffect, useState } from "react";

export default function Hero() {
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
      className="relative min-h-screen deep-forest-bg flex item-center justify-center sm:px-6 md:px-6 lg:px-20 pt-28 sm:pt-32 overflow-hidden mb-8 scroll-mt-24"
    >
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');
      </style>

      {/* Grid Container Hero Section */}
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #1 */}
          <div className="">
            {/* Introducing EcoPoints */}
            <div className=" inline-flex items-center space-x-2 px-3 sm:px-4 py-2 accent-color-bg-20 border accent-color-border rounded-full mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-500 hover:translate-y-2 transition-transform duration-300 hover:scale-105">
              <GraduationCapIcon className="animate-bounce lg:w-7 lg:h-7 md:h-6 md:w-6 sm:w-6 sm:h-6 text-white" />
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
            <p className="sm:text-xl md:text-2xl lg:text-3xl text-white text-center max-w-3xl mx-auto sour-gummy-body-300 lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed ">
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
          <div className="relative order-2 w-full">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10 transition-transform delay-300 ease-out duration-700 hover:scale-90">
              <div className="rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5 transition-transform ease-in duration-300 hover:scale-110">
                {/* Container */}
                <img
                  src="SampleImage-Face1.jpeg"
                  alt="Sample"
                  className="w-full h-auto"
                />
                {/* Inside Container */}
              </div>
            </div>
          </div>

          {/* Floating Cards */}
        </div>
        {/* HEADER SECTION */}
        <div className=" max-w-7xl lg:py-20 sm:py-20 text-center relative w-full">
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
          <div className="flex lg:grid lg:grid-cols-3 soft-sage-bg rounded-lg sm:space-y-6 sm:space-x-6 sm:p-6 sm:mb-10 md:space-y-16 md:space-x-8 lg:w-auto lg:h-auto lg:p-6 lg:mb-10 lg:space-y-4 lg:space-x-8">
            {concept.map((concept) => (
              <div className="">
                {/* IMAGE SECTION */}
                <div className="flex w-full overflow-hidden">
                  <div className="relative group">
                    {/* INNER-CONTAINER (IMAGE) */}
                    {/* <div> secondary-color rounded-lg lg:w-auto lg:h-110 p-3 sm:p-4 font-mono text-xs sm:text-sm */}
                    {/* PICTURES */}
                    <div className="flex w-full transition-transform duration-300 hover:rotate-4 ">
                      {/* If mag lalagay ng Photo dito ilalagay */}
                      <img
                        src={concept.image}
                        alt={concept.image}
                        className="rounded-lg sm:w-120 sm:h-50 md:w-100 md:h-40 lg:w-100 lg:h-50"
                      />
                    </div>
                    {/* TEXT SECTION */}
                    <div className="flex w-full">
                      <div className="max-w-lg mx-auto lg:mx-0 text-center text-color lg:text-left">
                        <h3 className="text-4xl sm:text-4xl lg:text-3xl chewy-regular text-center sm:mb-6 sm:mt-6 md:mb-6 md:mt-6 lg:mb-2 lg:mt-2">
                          {concept.title}
                        </h3>
                        <p className="text-shadow-lg sour-gummy-body-500 text-center sm:text-xl md:text-lg lg:text-xl">
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
          <h2 className="text-4xl sm:text-6xl md:text-5xl lg:text-6xl lg:py-5 sm:py-8 chewy-regular sm:mb-6 md:mb-6 lg:mb-10  animate-in slide-in-from-bottom duration-700 delay-100">
            <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 text-center uppercase tracking-[0.2em]">
              How it Works?
            </span>
          </h2>
          {/* CONTAINERS AREA*/}
          <div className="flex flex-cols lg:grid lg:grid-cols-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:gap-0">
            {/* CONTAINER */}
            {howItWorks.map((howItWorks) => (
              <div className="">
                {/* IMAGE SECTION */}
                <div className="flex w-full ">
                  <div className="relative group">
                    {/* OUTER-CONTAINER (IMAGE) */}
                    <div className="soft-sage-bg rounded-lg text-xs sm:p-6 sm:w-85 sm:h-120 lg:w-75 lg:h-120">
                      {/* INNER-CONTAINER (PICTURES) */}
                      <div className=" champagne-bg rounded-lg px-4 py-4 transition-transform duration-700 hover:rotate-6 hover:scale-80 shadow-xl transition-shadow">
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
                        <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left text-color">
                          <h3 className="text-4xl sm:text-3xl lg:text-3xl chewy-regular text-center sm:mb-6 sm:mt-6 md:mb-6 md:mt-6 lg:mb-2 lg:mt-2">
                            {howItWorks.number}
                          </h3>
                          <h1 className="text-4xl sm:text-3xl lg:text-3xl chewy-regular text-center sm:mb-6 md:mb-6 lg:mb-2 lg:mt-2 ">
                            {howItWorks.title}
                          </h1>
                          <p className="text-shadow-lg sour-gummy-body-500 text-center sm:text-xl md:text-md lg:text-xl">
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
