"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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

  const features = [
    {
      title: "Pencil",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-Pencil.jpg",
      imagePosition: "left",
    },
    {
      title: "Notebook",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-Ntbk.jpg",
      imagePosition: "left",
    },
    {
      title: "Lanyard",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-Lanyard.jpg",
      imagePosition: "right",
    },
    {
      title: "Tote Bag",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-ToteBag.jpg",
      imagePosition: "right",
    },
    {
      title: "Stickers",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-Stickers.jpg",
      imagePosition: "right",
    },
    {
      title: "Keychain",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/SampleReward-Keychain.jpg",
      imagePosition: "right",
    },
    {
      title: "EXTRA1",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 10,
    },
    {
      title: "EXTRA2",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 11,
    },
    {
      title: "EXTRA3",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 12,
    },
    {
      title: "EXTRA4",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 13,
    },
    {
      title: "EXTRA5",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 14,
    },
    {
      title: "EXTRA6",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 15,
    },
    {
      title: "EXTRA7",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 16,
    },
    {
      title: "EXTRA8",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 17,
    },
    {
      title: "EXTRA9",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Esse dignissimos nesciunt accusantium ",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 18,
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(features.length / itemsPerPage);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % totalPages);
  };

  const previous = () => {
    setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <section className="relative min-h-screen background-color flex items-center justify-center pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Playpen+Sans+Deva:wght@100..800&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');{" "}
      </style>

      <div>
        {/* SAMPLE BUTTON */}
        <div className="mb-8">
          <Link href="/" className="text-white/80 hover:text-orange-400">
             Back to Home
          </Link>
        </div>
        <div className="max-w-7xl mx-auto flex text-center gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* COL-1 EXAMPLE CONTAINER */}
          <div className=" w-full transition-transform duration-300">
            {/* CONTAINER CONTENT */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 bg-gray-600/20 backdrop-blur-xl rounded-md sm:rounded-xl p-4 lg:p-6 sm:p-4 gap-20 mb-20 shadow-2xl border border-white/10">
              {/* Container */}
              {/* Inside Container */}
              <div className="order-1">
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
              {/* COL-2 CONTAINER */}
              <div className="order-2">
                <div>
                  <img
                    src="SampleImage-Face10.jpg"
                    alt="SampleImage-Face"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
        </div>
        {/* DESCRIPTION AREA */}
        <div className="flex flex-row lg:grid lg:grid-row-2 px-10 py-10">
          {/* HEADER */}
          <div className="text-center mb-2 sm:mb-6 lg:mb-2">
            <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6">
              <span className="chewy-regular text-color bg-clip-text text-transparent">
                Want to Start Earning Points?
              </span>
            </h2>
          </div>
          {/* CONTENT */}
          <div className="text-center mb-2 sm:mb-4 lg:mb-4 order-2">
            <p className="sour-gummy-body-300 text-color sm:text-4xl md:text-5xl lg:text-4xl">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Deserunt
              nobis eveniet quas incidunt nemo itaque omnis voluptate
              repudiandae quae neque distinctio dolor placeat aliquid
              cupiditate, inventore sunt enim alias officiis.
            </p>
          </div>
        </div>
        {/* VISUAL INTRUCTION */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 text-center mb-12 chewy-regular">
          {/* 1ST SECTION */}
          <div className="soft-sage-bg">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="deep-forest-bg">1 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">Sign In</h1>
              <p className="text-xl sour-gummy-body-400">
                You may already be a member. Try logging in with your Microsoft
                account, before creating a new one.
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                Sign In
              </button>
            </div>
          </div>
          {/* 2ND SECTION */}
          <div className="deep-forest-bg ">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="soft-sage-bg">2 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">
                Visit the Rewards Dashboard
              </h1>
              <p className="text-xl sour-gummy-body-400">
                This fully activates your account, so you can start earning
                instantly
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                Visit Rewards
              </button>
            </div>
          </div>
          {/* 3RD SECTION */}
          <div className="soft-sage-bg">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="deep-forest-bg">3 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">Recycle some PET Bottles!</h1>
              <p className="text-xl sour-gummy-body-400">
                Rack up points and redeem them for gift cards, cash donations to
                causes you care about, and more
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                View the Machine!
              </button>
            </div>
          </div>
        </div>

        {/* REWARDS */}
        <div className="relative max-w-6xl mx-auto">
          {/* TEXT CONTENT */}
          <div className="text-center mb-2 sm:mb-6 lg:mb-10">
            <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6">
              <span className="chewy-regular text-color bg-clip-text text-transparent">
                Here are some Rewards you can Redeem!
              </span>
              <br />
            </h2>
          </div>
          {/* CONTAINER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-10 space-y-8 sm:space-y-12 lg:space-y-12">
            {features
              .slice(
                activeIdx * itemsPerPage,
                activeIdx * itemsPerPage + itemsPerPage,
              )
              .map((feature, key) => (
                <div key={`${feature.title}-${key}`}>
                  {/* CONTAINER CONTENTS */}
                  <div className="flex-1 w-full hover:translate-y-4 hover:scale-110 transition-transform duration-500 ease-out">
                    <div className="relative group">
                      {/* OUTER CONTAINER */}
                      <div className="absolute inset-0 soft-sage-bg rounded-xl sm:rounded-2xl transition-opacity duration-300 group-hover:opacity-70 " />
                      <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 lg:h-auto rounded-xl sm:rounded-2xl sm:p-6 lg:px-2 lg:py-2 overflow-hidden transition-shadow duration-300 ease-out shadow-2xl group-hover:cursor-pointer">
                        {/* INNER CONTAINER */}
                        <div className="relative group bg-gray-800/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                          <img
                            src={feature.image}
                            alt={feature.image}
                            className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70 transition-transform duration-500 ease-out group-hover:scale-112 "
                          />
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                          <div className="flex-1 w-full">
                            {/* TITLE & DESCRIPTION */}
                            <div className="overflow-hidden max-h-[3.5rem] group-hover:max-h-[9rem] transition-[max-height] duration-500 ease-out max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                              <h3 className="chewy-regular text-4xl sm:text-3xl lg:text-5xl text-color">
                                {feature.title}
                              </h3>
                              <p className="sour-gummy-body-300 text-color text-base text-xl sm:text-lg leading-relaxed text-justify opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {/* NAVIGATION */}
          <div className="flex items-center justify-center gap-4 mb-8 cursor-pointer lg:mb-18">
            <button
              onClick={previous}
              className="p-3 rounded-full primary-color transition-all cursor-pointer"
            >
              <ChevronLeft />
            </button>

            <div className="flex gap-2 ">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeIdx
                      ? "w-8 primary-color"
                      : "w-2 primary-color"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full primary-color transition-all cursor-pointer"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        {/* INSTRUCTIONS */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 text-center mb-12 chewy-regular">
          {/* 1ST SECTION */}
          <div className="soft-sage-bg">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="deep-forest-bg">1 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">How to Earn EcoPoints?</h1>
              <p className="text-xl sour-gummy-body-400">
                There are a lot of ways to earn EcoPoints in your Account
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                Earn Here
              </button>
            </div>
          </div>
          {/* 2ND SECTION */}
          <div className="deep-forest-bg ">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="soft-sage-bg">2 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">Leaderboard & Challenges?</h1>
              <p className="text-xl sour-gummy-body-400">
                Don't let anyone keep you from being the best at recycling
                bottles
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                Click Here
              </button>
            </div>
          </div>
          {/* 3RD SECTION */}
          <div className="soft-sage-bg">
            <div className="px-10 py-10">
              {/* ICON */}
              <div className="deep-forest-bg">3 - ICON</div>
              {/* TEXT */}
              <h1 className="text-4xl mb-4 mt-4">Discover Rewards!</h1>
              <p className="text-xl sour-gummy-body-400">
                Curious on these rewards, essentials, ammenities
              </p>
              <button className="px-4 py-4 mt-6 hover:underline">
                Explore the Rewards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAMPLE CODE */}
      {/* <div className="max-w-6xl mx-auto w-full">
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
      </div> */}
    </section>
  );
}
