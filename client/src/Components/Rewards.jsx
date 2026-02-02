"use client";
import Link from "next/link";

import { QrCodeIcon, ChevronDown, ArrowRight, Play } from "lucide-react";

export default function RewardsOrg() {
  const rewards = [
    {
      title: "Sample Reward",
      description: "Replace this with the real rewards.ecopoints.org content.",
      image: "/Omniman.jpg",
    },
    {
      title: "Another Reward",
      description:
        "You can list reward details, costs, and redemption rules here.",
      image: "/Omniman.jpg",
    },
    {
      title: "Limited Offer",
      description: "This is just placeholder content for the rewards portal.",
      image: "/Omniman.jpg",
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div>
        <div className="max-w-7xl mx-auto flex text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="relative order-2 w-full transition-transform duration-300">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-md sm:rounded-xl p-3 sm:p-4 shadow-2xl border border-white/10">
              {/* Container */}
              {/* Inside Container */}
              <div>
                {/* Header Text */}
                <h1 className="text-6xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
                  <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 ">
                    EcoPoints: Rewards
                  </span>
                </h1>
                {/* Content Text */}
                <p className="text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
                  Earn rewards with EcoPoints. Just by simply recycling. Sign in
                  or create an EcoPoints account and get points for
                  School-Related rewards, Essentials, and more.
                </p>

                {/* BUTTONS Inside Grid #1 */}
                <div className="flex flex-row items-center justify-center mt-4 sm:mt-6 lg:mt-10">
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 ">
                    <Link
                      href="/userRewards"
                      className="group w-full shadow-lg sm:w-auto px-6 sm:px-8 py-3 sm:py-4 accent-color-background rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-110 hover:border text-center"
                    >
                      Start Earning EcoPoints!
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
        </div>

        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <Link href="/" className="text-white/80 hover:text-orange-400">
               Back to Home
            </Link>
          </div>

          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h1 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-header">
              <span className="accent-color-text bg-clip-text text-transparent">
                Rewards Portal
              </span>
            </h1>
            <p className="text-md sm:text-base lg:text-lg text-white max-w-2xl mx-auto font-body-regular leading-relaxed">
              This page is the in-app version of the rewards site. Add here
              content you want for rewards.ecopoints.org.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-10">
            {rewards.map((reward, index) => (
              <div key={`${reward.title}-${index}`} className="w-full">
                <div className="flex-1 w-full hover:translate-y-2 transition-transform duration-500 hover:scale-105">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-600/20 rounded-xl sm:rounded-2xl transition-all duration-500" />
                    <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition">
                      <div className="relative group bg-gray-900/20 rounded-lg p-3 sm:p-4">
                        <img
                          src={reward.image}
                          alt={reward.title}
                          className="w-full rounded-md"
                        />
                        <div className="mt-4">
                          <h2 className="text-2xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white font-header">
                            {reward.title}
                          </h2>
                          <p className="text-white/90 text-base sm:text-lg leading-relaxed font-body-regular">
                            {reward.description}
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
      </div>
    </section>
  );
}
