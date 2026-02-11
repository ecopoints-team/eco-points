"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, Mic } from "lucide-react";
import Link from "next/link";
export default function UserRewards() {
  const features = [
    {
      title: "Pencil",
      description: "",
      image: "/Pencil.jpg",
      imagePosition: "left",
      id: 1,
    },
    {
      title: "Notebook",
      description: "",
      image: "/Ntbk.jpg",
      imagePosition: "left",
      id: 2,
    },
    {
      title: "Lanyard",
      description: "",
      image: "/Lanyard.jpg",
      imagePosition: "right",
      id: 3,
    },
    {
      title: "Tote Bag",
      description: "",
      image: "/TBag.jpg",
      imagePosition: "right",
      id: 4,
    },
    {
      title: "Shirt",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 5,
    },
    {
      title: "Mug",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 6,
    },
    {
      title: "Stickers",
      description: "",
      image: "/Stkrs.jpg",
      imagePosition: "right",
      id: 7,
    },
    {
      title: "Keychain",
      description: "",
      image: "/Kychn.jpg",
      imagePosition: "right",
      id: 8,
    },
    {
      title: "Pins",
      description: "",
      image: "/Stkrs.jpg",
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

  const handleSearch = useCallback(
    debounce((term) => {
      if (term.trim() === "") {
        setSearchResults([]);
      } else {
        const results = features.filter((item) =>
          item.title.toLowerCase().includes(term.toLowerCase()),
        );
        setSearchResults(results);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <section className="relative min-h-screen flex-row pt-30 sm:pt-34 overflow-hidden scroll-mt-28">
      {/* USER SUMMARY SECTION */}
      <div className="accent-color-background relative">
        {/* Content */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 justify-center">
          <span className="relative text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            HI! User
            {/* TODO: Connect to user data from DB */}
            <span className="">
              <p>&mdash;</p>
            </span>
          </span>
          <span className="relative order-2 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            SUMMARY OF POINTS:
            {/* TODO: Connect to points data from DB */}
            <span className="">
              <p>&mdash;</p>
            </span>
          </span>
          <span className="relative order-3 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            POINTS OBTAINED TODAY:
            {/* TODO: Connect to daily points from DB */}
            <span className="">
              <p>&mdash;</p>
            </span>
          </span>
          <span className="relative order-4 text-shadow-lg text-xl sm:text-base lg:text-2xl text-white max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
            STREAK:
            {/* TODO: Connect to streak data from DB */}
            <span className="">
              <p>&mdash;</p>
            </span>
          </span>
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
              <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-md">
                <h2 className="mb-4 text-xl font-bold"> Search Results: </h2>
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.id} className="mb-2">
                      <a
                        href={result.url}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {result.title}
                      </a>
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
                  {features.map((feature, key) => (
                    <div key={`${feature.title}-${key}`}>
                      <div className="flex-1 w-full hover:translate-y-2 transition-transform duration-500 hover:scale-105 transition-transform duration-500 hover:translate-x-1">
                        <div className="relative group">
                          <div className="absolute inset-0 secondary-color rounded-xl sm:rounded-2xl transition-all duration-500" />
                          <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition">
                            <div className="relative group bg-gray-900/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm ">
                              <img src={feature.image} alt={feature.image} />
                              <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                              <div className="flex-1 w-full">
                                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                                  <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-color">
                                    {feature.title}
                                  </h3>
                                  <p className="text-color text-base text-xl sm:text-lg leading-relaxed">
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
                {/* PAGINATION AREA */}
                <div className="grid-flow-row row-start-3">PLACEHOLDER</div>
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
