"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
export default function UserRewards() {
  const features = [
    {
      title: "Pencil",
      description: "",
      image: "/SampleReward-Pencil.jpg",
      imagePosition: "left",
      id: 1,
    },
    {
      title: "Notebook",
      description: "",
      image: "/SampleReward-Ntbk.jpg",
      imagePosition: "left",
      id: 2,
    },
    {
      title: "Lanyard",
      description: "",
      image: "/SampleReward-Lanyard.jpg",
      imagePosition: "right",
      id: 3,
    },
    {
      title: "Tote Bag",
      description: "",
      image: "/SampleReward-ToteBag.jpg",
      imagePosition: "right",
      id: 4,
    },
    {
      title: "Shirt",
      description: "",
      image: "/SampleReward-Shirt.jpg",
      imagePosition: "right",
      id: 5,
    },
    {
      title: "Mug",
      description: "",
      image: "/SampleReward-Mug.jpg",
      imagePosition: "right",
      id: 6,
    },
    {
      title: "Stickers",
      description: "",
      image: "/SampleReward-Stickers.jpg",
      imagePosition: "right",
      id: 7,
    },
    {
      title: "Keychain",
      description: "",
      image: "/SampleReward-Keychain.jpg",
      imagePosition: "right",
      id: 8,
    },
    {
      title: "Pins",
      description: "",
      image: "/SampleReward-Pins.jpg",
      imagePosition: "right",
      id: 9,
    },
    {
      title: "EXTRA1",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 10,
    },
    {
      title: "EXTRA2",
      description: "",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 11,
    },
    {
      title: "EXTRA3",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 12,
    },
    {
      title: "EXTRA4",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 13,
    },
    {
      title: "EXTRA5",
      description: "",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 14,
    },
    {
      title: "EXTRA6",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 15,
    },
    {
      title: "EXTRA7",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 16,
    },
    {
      title: "EXTRA8",
      description: "",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 17,
    },
    {
      title: "EXTRA9",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 18,
    },
  ];

  // FOR PAGINATION
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // HANDLES THE SEARCH BAR
  const handleSearch = useCallback(
    debounce((term) => {
      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      const results = features.filter((item) =>
        item.title.toLowerCase().includes(term.toLowerCase()),
      );

      setSearchResults(results);
    }, 300),
    [features],
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // EXAMPLE FOR PAGINATION
  const [activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(features.length / itemsPerPage);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % totalPages);
  };

  const previous = () => {
    setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <section className="relative min-h-screen pt-30 sm:pt-34 overflow-hidden scroll-mt-28">
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Playpen+Sans+Deva:wght@100..800&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');{" "}
      </style>
      {/* USER SUMMARY SECTION */}
      <div className="secondary-color relative">
        {/* CONTENT */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 px-12 py-12 justify-center">
          {/* USER CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="/SampleImage-UserIcon.png" />
            <span className="relative text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl font-body-bold lg:mx-0 lg:mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              HI! User
              {/* TODO: Connect to user data from DB */}
              <span className="">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* SUMMARY CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="/SampleImage-EcoPoints.png" />
            <span className="relative order-2 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl font-body-bold lg:mx-0 lg:mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              SUMMARY OF POINTS:
              {/* TODO: Connect to points data from DB */}
              <span className="">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* POINTS CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="SampleImage-CurrentPoints.png" />
            <span className="relative order-3 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl font-body-bold lg:mx-0 lg:mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              TODAY'S POINTS:
              {/* TODO: Connect to daily points from DB */}
              <span className="">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* STREAK CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="SampleImage-Streak.png" />
            <span className="relative order-4 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl font-body-bold lg:mx-0 lg:mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              STREAK:
              {/* TODO: Connect to streak data from DB */}
              <span className="">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
        </div>
      </div>
      <section
        id="userRewards"
        className="bg-gradient-to-l from-lime-900 to-lime-950 relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28"
      >
        <div className="relative flex-col item-center justify-center overflow-hidden scroll-mt-28">
          {/* TEXT Above Container */}
          <div className="py-8 sm:py-12 text-4xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-center font-body-black ">
            <span className="relative flex-col item-center justify-center overflow-hidden">
              Earn Points by Recycling and Helping the Environment!
            </span>
          </div>
          {/* SEARCH BAR */}
          <div className="flex flex-col items-center">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mb-8 w-full max-w-2xl"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="w-full rounded-full border border-white accent-color-background px-5 py-3 pr-20 text-base shadow-md transition-shadow duration-200 hover:shadow-lg focus:border-gray-300 focus:outline-none"
                  placeholder="Search For Your Desired Rewards!"
                />
                <div className="absolute right-0 top-0 mr-4 mt-3 flex items-center">
                  <button type="submit" className="primary-color-header">
                    <Search size={20} />
                  </button>
                </div>
              </div>
            </form>
            {/* SEARCH RESULT */}
            {searchResults.length > 0 && (
              <div className="w-full max-w-2xl rounded-lg bg-white/20 p-4 shadow-md">
                {/* <h2 className="mb-4 text-xl text-blue-600 font-bold">
                  Search Results:
                </h2> */}
                <ul className="grid grid-cols-3 gap-4">
                  {searchResults.map((feature) => (
                    <li key={feature.id}>
                      <div className="flex-1 w-full transition-transform duration-500 hover:scale-105">
                        <div className="relative group">
                          <div className="absolute inset-0 secondary-color rounded-xl transition-all duration-500" />
                          <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 overflow-hidden">
                            <div className="bg-gray-900/20 rounded-lg p-4 text-center">
                              <img
                                src={feature.image}
                                alt={feature.title}
                                className="mx-auto mb-4 max-h-40 object-contain"
                              />

                              <h3 className="text-2xl font-bold text-color mb-2">
                                {feature.title}
                              </h3>

                              <p className="text-color text-sm">
                                {feature.description ||
                                  "No description available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="relative order-2 w-full transition-transform duration-300">
            {/* Container */}
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-md sm:rounded-xl p-3 sm:p-4 shadow-2xl border border-white/10">
              <div className="grid grid-row-3 mb:grid-row-6 grid-flow-col gap-10">
                {/*  */}
                {/* Inside Container */}
                {/*  */}
                {/* CATEGORIES */}
                {/* COLUMN 1 */}
                <div className="text-center col-start-1">
                  <div className="shadow-lg py-3 sm:py-4">CATEGORIES:</div>
                  <div className="relative order-2 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
                    <button className="group w-full shadow-lg sm:w-100% px-6 sm:px-8 py-3 sm:py-4 accent-color-background rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:border text-center cursor-pointer">
                      School Supplies
                    </button>
                  </div>
                  <div className="relative text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
                    <button className="group w-full shadow-lg sm:w-100% px-6 sm:px-8 py-3 sm:py-4 accent-color-background rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:border text-center cursor-pointer">
                      Essentials
                    </button>
                  </div>
                  <div className="relative text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
                    <button className="group w-full shadow-lg sm:w-100% px-6 sm:px-8 py-3 sm:py-4 accent-color-background rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:border text-center cursor-pointer">
                      Extras
                    </button>
                  </div>
                </div>

                {/* GRID REWARDS */}
                {/* COLUMN 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 col-start-2 gap-2 sm:gap-3 lg:gap-5 space-y-4 sm:space-y-6 lg:space-y-6">
                  {features
                    .slice(
                      activeIdx * itemsPerPage,
                      activeIdx * itemsPerPage + itemsPerPage,
                    )
                    .map((feature, key) => (
                      <div key={`${feature.title}-${key}`}>
                        {/* Container Contents */}
                        <div className="flex-1 w-full hover:translate-y-2 hover:scale-105 transition-transform duration-500 hover:translate-x-1">
                          <div className="relative group">
                            {/* Outer Container */}
                            <div className="absolute inset-0 secondary-color  rounded-xl sm:rounded-2xl transition-all duration-500" />
                            <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition">
                              {/* Inner Container */}
                              <div className="relative group bg-gray-800/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm ">
                                <img
                                  src={feature.image}
                                  alt={feature.image}
                                  className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70"
                                />
                                <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                                <div className="flex-1 w-full">
                                  {/* Title & Description */}
                                  <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                                    <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-color">
                                      {feature.title}
                                    </h3>
                                    <p className="text-color text-base text-xl sm:text-lg leading-relaxed text-justify">
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
              </div>
              {/* PAGINATION AREA */}
              <div className="grid-flow-row row-start-3 col-start-2">
                <div className="flex items-center justify-center gap-4 mt-8 mb-8">
                  <button
                    onClick={previous}
                    className="p-3 rounded-full primary-color transition-all cursor-pointer"
                  >
                    <ChevronLeft />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIdx(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
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
            </div>
          </div>
          <div className="mb-8">
            <Link href="/" className="text-white/80 hover:text-orange-400">
               Back to Home
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
