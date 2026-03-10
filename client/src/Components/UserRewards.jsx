"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, MenuIcon } from "lucide-react";
import Link from "next/link";
export default function UserRewards({ onLoginClick }) {
  // REWARDS
  const rewards = [
    {
      title: "Pencil",
      description: "",
      image: "/SampleReward-Pencil.jpg",
      id: 1,
      catID: "SchoolSupplies",
    },
    {
      title: "Notebook",
      description: "",
      image: "/SampleReward-Ntbk.jpg",
      id: 2,
      catID: "SchoolSupplies",
    },
    {
      title: "Lanyard",
      description: "",
      image: "/SampleReward-Lanyard.jpg",
      id: 3,
      catID: "SchoolSupplies",
    },
    {
      title: "Tote Bag",
      description: "",
      image: "/SampleReward-ToteBag.jpg",
      id: 4,
      catID: "Essentials",
    },
    {
      title: "Shirt",
      description: "",
      image: "/SampleReward-Shirt.jpg",
      id: 5,
      catID: "Essentials",
    },
    {
      title: "Mug",
      description: "",
      image: "/SampleReward-Mug.jpg",
      id: 6,
      catID: "Essentials",
    },
    {
      title: "Stickers",
      description: "",
      image: "/SampleReward-Stickers.jpg",
      id: 7,
      catID: "Extra",
    },
    {
      title: "Keychain",
      description: "",
      image: "/SampleReward-Keychain.jpg",
      id: 8,
      catID: "Extra",
    },
    {
      title: "Pins",
      description: "",
      image: "/SampleReward-Pins.jpg",
      id: 9,
      catID: "Extra",
    },
    {
      title: "EXTRA1",
      description: "",
      image: "/Stkrs.jpg",
      id: 10,
      catID: "Extra",
    },
    {
      title: "EXTRA2",
      description: "",
      image: "/Kychn.jpg",
      id: 11,
      catID: "Extra",
    },
    {
      title: "EXTRA3",
      description: "",
      image: "/Stkrs.jpg",
      id: 12,
      catID: "Extra",
    },
    {
      title: "EXTRA4",
      description: "",
      image: "/Stkrs.jpg",
      id: 13,
      catID: "Extra",
    },
    {
      title: "EXTRA5",
      description: "",
      image: "/Kychn.jpg",
      id: 14,
      catID: "Extra",
    },
    {
      title: "EXTRA6",
      description: "",
      image: "/Stkrs.jpg",
      id: 15,
      catID: "Extra",
    },
    {
      title: "EXTRA7",
      description: "",
      image: "/Stkrs.jpg",
      id: 16,
      catID: "Extra",
    },
    {
      title: "EXTRA8",
      description: "",
      image: "/Kychn.jpg",
      id: 17,
      catID: "Extra",
    },
    {
      title: "EXTRA9",
      description: "",
      image: "/Stkrs.jpg",
      id: 18,
      catID: "Extra",
    },
  ];

  // LEADERBOARD CATEGORIES
  const leadCategories = [
    {
      title: "DAILY",
    },
    {
      title: "WEEKLY",
    },
    { title: "ALL TIME" },
  ];

  // CHALLENGES
  const challenges = [
    {
      title: "Sample Challenge #1",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face3.jpg",
      id: 1,
    },
    {
      title: "Sample Challenge #2",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face2.jpg",
      id: 2,
    },
    {
      title: "Sample Challenge #3",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face1.jpeg",
      id: 3,
    },
    {
      title: "Sample Challenge #4",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face10.jpg",
      id: 4,
    },
    {
      title: "Sample Challenge #5",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face8.jpg",
      id: 5,
    },
    {
      title: "Sample Challenge #6",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face9.png",
      id: 6,
    },
    {
      title: "Sample Challenge #7",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
      image: "/SampleImage-Face4.avif",
      id: 7,
    },
  ];

  // FOR CATEGORIES
  const categories = [
    { label: "All Rewards", value: "All" },
    { label: "School Supplies", value: "SchoolSupplies" },
    { label: "Essentials", value: "Essentials" },
    { label: "Extras", value: "Extra" },
  ];

  // FOR CATEGORIES (REWARDS)
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredRewards =
    selectedCategory === "All"
      ? rewards
      : rewards.filter((reward) => reward.catID === selectedCategory);

  // LEADERBAORD
  const leaderboard = [
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Tyrion Lannister",
      university: "Kings Landing University",
      points: "19,900",
    },
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Jaime Lannister",
      university: "Kings Landing University",
      points: "18,900",
    },
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Tywin Lannister",
      university: "Kings Landing University",
      points: "18,900",
    },
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Jon Snow",
      university: "Winterfell University",
      points: "18,900",
    },
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Brienne of Tarth",
      university: "Kings Landing University",
      points: "18,900",
    },
    {
      icon: "/SampleImage-UserIcon.png",
      name: "Arya Stark",
      university: "Braavos University",
      points: "18,900",
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

      const results = rewards.filter((item) =>
        item.title.toLowerCase().includes(term.toLowerCase()),
      );

      setSearchResults(results);
    }, 300),
    [rewards],
  );

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // EXAMPLE FOR PAGINATION
  const [activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % totalPages);
  };

  const previous = () => {
    setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // NAVIGATION LINKS
  const navLinks = [
    { label: "Rewards", target: "home" },
    { label: "Challenges", target: "challenges" },
    { label: "Leaderboard", target: "leaderboard" },
    { label: "Redeem", target: "redeem" },
  ];

  // Mobile Setting Nav
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Nav Color Change (Scrolled)
  const [color, setColor] = useState(false);

  useEffect(() => {
    const changeColor = () => {
      setColor(window.scrollY >= 90);
    };
    window.addEventListener("scroll", changeColor);
    return () => window.removeEventListener("scroll", changeColor);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) =>
        document.getElementById(link.target),
      );
      const current = sections.find((section) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom > 120;
        }
        return false;
      });

      if (current) {
        setActiveSection(current.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close Menu of Click
  const handleNavClick = useCallback((target) => {
    const section = document.getElementById(target);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/#${target}`);
    }
    setMobileMenuIsOpen(false);
    setActiveSection(target);
  }, []);

  const handleNavLinkClick = useCallback(
    (link) => {
      if (link.external && link.href) {
        setMobileMenuIsOpen(false);
        if (typeof window !== "undefined") {
          window.location.assign(link.href);
        }
        return;
      }
      handleNavClick(link.target);
    },
    [handleNavClick],
  );

  return (
    <section className="relative background-color min-h-screen pt-30 sm:pt-34 overflow-hidden scroll-mt-28">
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
        @import
        url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Playpen+Sans+Deva:wght@100..800&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');{" "}
      </style>
      {/* NAVIGATION SECTION */}
      <section>
        <nav
          className={
            color
              ? "nav nav-bg backdrop-blur-sm"
              : "fixed top-1 w-full z-50 transition-all duration-300"
          }
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="relative flex justify-between items-center sm:h-16 md:h-20 lg:h-20">
              {/* LOGO SECTION */}
              <Link href="/">
                <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform duration-300">
                  <span className="">
                    <img
                      src="/EcoPoints Logo Mark with Name (Light Version).png"
                      alt="Logo"
                      className="w-30 lg:w-auto lg:h-15 sm:h-12 md:h-12"
                    />
                  </span>
                </div>
              </Link>
              {/* DESKTOP NAV LINKS - CENTERED ABSOLUTELY */}
              <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-6 lg:space-x-8 sour-gummy-body-500 text-white">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.target;
                  return (
                    <button
                      key={link.target}
                      type="button"
                      onClick={() => handleNavLinkClick(link)}
                      className={`relative group lg:text-md lg:text-base transition-colors duration-300 cursor-pointer ${
                        isActive
                          ? "text-color-header lg:text-xl"
                          : "text-white hover:text-color-header"
                      }`}
                    >
                      {link.label}
                      <span
                        className={`absolute bottom-0 h-0.5 bg-orange-300 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${
                          isActive ? "w-full" : "w-0"
                        }`}
                      ></span>
                    </button>
                  );
                })}
              </div>
              {/* DESKTOP LOGIN BUTTON */}
              <div className="hidden md:flex items-center space-x-6 lg:space-x-8 group cursor-pointer">
                <div className="w-20 flex justify-center items-center px-1 py-1 rounded-lg border border-white/20 transition-all duration-100 font-body-regular hover:font-body-bold hover:bg-amber-700/80">
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="text-white text-sm lg:text-base px-2 w-full text-center group cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                className="md:hidden items-center p-2 text-gray-300 hover:text-white"
                onClick={() => setMobileMenuIsOpen((prev) => !prev)}
              >
                {mobileMenuIsOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>

          {/* MOBILE MENU DROPDOWN */}
          {mobileMenuIsOpen && (
            <div className="md:hidden bg-lime-950/90 backdrop-blur-lg border-t border-white animate-in slide-in-from-top duration-500">
              <div className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                {navLinks.map((link) => (
                  <button
                    key={link.target}
                    type="button"
                    onClick={() => handleNavLinkClick(link)}
                    className={`block text-sm lg:text-base text-left w-full ${
                      activeSection === link.target
                        ? "text-orange-400 font-bold"
                        : "text-white hover:text-orange-600"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuIsOpen(false);
                    onLoginClick();
                  }}
                  className="block text-left text-white hover:text-orange-600 text-sm lg:text-base w-full mt-2 pt-2 border-t border-white/10"
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </nav>
      </section>
      {/* USER SUMMARY SECTION */}
      <div id="home" className="secondary-color relative scroll-mt-35">
        {/* CONTENT */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 px-2 py-16 justify-center animate-in slide-in-from-bottom duration-700 delay-200">
          {/* USER CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="/SampleImage-UserIcon.png" />
            <span className="relative text-xl sm:text-base lg:text-3xl sour-gummy-body-500 text-white leading-relaxed">
              Hi! User
              {/* TODO: Connect to user data from DB */}
              <span className="sour-gummy-body-400">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* SUMMARY CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="/SampleImage-EcoPoints.png" />
            <span className="relative order-2 text-xl sm:text-base lg:text-2xl sour-gummy-body-500 text-white leading-relaxed">
              SUMMARY OF POINTS:
              {/* TODO: Connect to points data from DB */}
              <span className="sour-gummy-body-400">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* POINTS CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="SampleImage-CurrentPoints.png" />
            <span className="relative order-3 text-xl sm:text-base lg:text-2xl text-white sour-gummy-body-500 leading-relaxed">
              TODAY'S POINTS:
              {/* TODO: Connect to daily points from DB */}
              <span className="sour-gummy-body-400">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
          {/* STREAK CLASS */}
          <div className="lg:grid lg:grid-cols-2">
            <img src="SampleImage-Streak.png" />
            <span className="relative order-4  text-xl sm:text-base lg:text-2xl text-white sour-gummy-body-500 leading-relaxed">
              STREAK:
              {/* TODO: Connect to streak data from DB */}
              <span className="sour-gummy-body-400">
                <p>&mdash;</p>
              </span>
            </span>
          </div>
        </div>
      </div>
      {/* INNER CONTAINER */}
      <div className="secondary-color items-center mt-10  grid grid-cols-2">
        {/* CONTENT */}
        <h1 className="absolute sour-gummy-body-400 text-3xl mx-10">
          Don’t miss out! This is to Remind you to collect PET Bottles and
          unlock your EcoPoints
        </h1>
        {/* BUTTONS Inside Grid #1 */}
        <div className="flex items-center justify-center translate-x-240">
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12">
            <Link
              href="/"
              className="group w-full shadow-lg sm:w-auto px-6 sm:px-6 py-3 sm:py-4 mt-10 accent-color-background rounded-lg sour-gummy-body-400 text-color text-xl transition-transform duration-500 hover:scale-110 hover:border hover:underline text-center"
            >
              Send Reminders
            </Link>
          </div>
        </div>
      </div>
      {/* CHALLENGES SECTION */}
      <section id="challenges" className="scroll-mt-25">
        <div>
          {/* OUTER CONTAINER */}
          <div className="mt-10 mb-10 mx-20 px-4 py-4 max-w-auto">
            {/* CONTENT */}
            <div className="background-color text-color">
              <div className="grid grid-cols-4 gap-4">
                {/* CONTENT #1 */}
                {challenges
                  .slice(
                    activeIdx * itemsPerPage,
                    activeIdx * itemsPerPage + itemsPerPage,
                  )
                  .map((challenges, index) => (
                    <div
                      key={`${challenges.title}-${index}`}
                      className={index === 0 ? "col-span-2" : "col-span-1"}
                    >
                      {/* OUTER CONTENT */}
                      <div className="secondary-color px-2 py-2">
                        {/* INNER CONTENT */}
                        <div
                          className={
                            index >= 1
                              ? "grid grid-row-2 gap-2 group"
                              : "grid grid-cols-2 gap-2 group"
                          }
                        >
                          {/* IMAGE AREA */}
                          <div className="">
                            <img
                              src={challenges.image}
                              className={
                                index >= 1
                                  ? "w-80 h-70 transition-transform duration-500 ease-in group-hover:scale-105 group-hover:rotate-2"
                                  : "w-100 h-115 transition-transform duration-500 ease-out delay-300 group-hover:scale-90 group-hover:-rotate-2"
                              }
                            />
                          </div>
                          {/* HEADER & DESCRIPTION */}
                          <div className="primary-color grid grid-row-3 px-4 py-4">
                            <div className="text-2xl text-white sour-gummy-body-300">
                              <h1
                                className={index >= 1 ? "text-md" : "text-5xl"}
                              >
                                {challenges.title}
                              </h1>
                            </div>
                            <div className="text-md text-white sour-gummy-body-300">
                              <p
                                className={
                                  index >= 1 ? "text-md mb-2 mt-2" : "text-3xl"
                                }
                              >
                                {challenges.description}
                              </p>
                            </div>
                            {/* REDEEM POINTS */}
                            <div className="text-xl text-white sour-gummy-body-300">
                              <button
                                className={
                                  index === 0
                                    ? "soft-sage-bg rounded-lg text-md px-8 py-2 duration-300 transition-transform delay-300 group-hover:scale-110 hover:underline"
                                    : "soft-sage-bg rounded-lg text-md p-2 duration-300 transition-transform delay-300 group-hover:scale-110 hover:underline hover:cursor-pointer"
                                }
                              >
                                POINTS
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* LEADERBOARD SECTION */}
      <section id="leaderboard" className="scroll-mt-25 mt-10 mb-10 mx-20">
        {/* CONTAINER */}
        <div className="primary-color grid grid-row-4 px-4 py-4">
          {/* HEADER */}
          <div className="relative grid text-center justify-center gap-4 mb-10">
            {/* AREA LEADERBOARD (LIKE KUNG SA RIZAL PA MANILA O KAYA PWEDE DIN PER UNIVERSITIES) */}
            <div className="soft-sage-bg ">
              <div className="flex justify-between px-2 py-2">
                <button className="hover:cursor-pointer">
                  <ChevronLeft></ChevronLeft>
                </button>
                <h1 className="sour-gummy-body-500 text-5xl">UNIVERSITY</h1>
                <button className="hover:cursor-pointer">
                  <ChevronRight></ChevronRight>
                </button>
              </div>
            </div>
            <p className="sour-gummy-body-400 text-3xl mt-4">
              Think you're the best Recycler?
            </p>
            <p className="sour-gummy-body-400 text-xl">
              Compete with fellow students and faculties alike to climb the
              leaderboard
            </p>
            <h1 className="sour-gummy-body-400 text-6xl mt-10">
              Top Recyclers
            </h1>
          </div>
          {/* LEADERBOARD CATEGORIES */}
          <div className="grid grid-cols-3 text-center mb-6">
            {leadCategories.map((leadCategories, index) => (
              <div className="flex items-center justify-center group">
                <div className="transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-2 ">
                  <button className="secondary-color rounded-lg w-95 px-2 py-2 hover:cursor-pointer">
                    <div className="sour-gummy-body-500 text-2xl">
                      {leadCategories.title}
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* LEADERBOARD ITSELF */}
          {/* CONTAINER */}
          {/* HERE LALAGAY YUNG SA ARRAY */}
          {leaderboard.map((leaderboard, index) => (
            <div
              key={`${index}`}
              className={
                index >= 3
                  ? "relative"
                  : index === 0
                    ? "relative"
                    : index === 1
                      ? "relative mx-6"
                      : "relative mx-12"
              }
            >
              {/* CONTENT */}
              <div
                className={
                  index >= 3
                    ? "grid grid-cols-3 items-center gap-8 mx-30 my-2 secondary-color"
                    : index === 0
                      ? "grid grid-cols-3 items-center my-2 background-color"
                      : index === 1
                        ? "grid grid-cols-3 items-center my-2 accent-color-background"
                        : "grid grid-cols-3 items-center my-2 soft-sage-bg"
                }
              >
                {/* PLACEMENT */}
                <div className="soft-sage-bg px-4 py-4 ">
                  <img
                    src="SampleImage-UserIcon.png"
                    className={
                      index >= 3
                        ? "bg-gray-400"
                        : index === 0
                          ? "bg-green-400/20"
                          : index === 1
                            ? "bg-blue-400/20"
                            : "bg-red-500/30"
                    }
                  />
                </div>
                {/* NAME */}
                <div
                  className={
                    index >= 3
                      ? "relative flex justify-start"
                      : index === 0
                        ? "relative px-4 py-4"
                        : index === 1
                          ? "relative px-4 py-4"
                          : "relative px-4 py-4"
                  }
                >
                  <h1
                    className={
                      index >= 3
                        ? "absolute sour-gummy-body-500 text-4xl text-color"
                        : index === 0
                          ? "absolute sour-gummy-body-500 text-5xl text-color"
                          : index === 1
                            ? "absolute sour-gummy-body-500 text-5xl text-color"
                            : "absolute sour-gummy-body-500 text-5xl text-color"
                    }
                  >
                    {leaderboard.name}
                  </h1>
                  <p
                    className={
                      index >= 3
                        ? "text-md sour-gummy-body-300 mt-10 text-color"
                        : index === 0
                          ? "text-xl sour-gummy-body-500 mt-13 text-color"
                          : index === 1
                            ? "text-md sour-gummy-body-500 mt-13 text-color"
                            : "text-md sour-gummy-body-300 mt-13 text-color"
                    }
                  >
                    {leaderboard.university}
                  </p>
                </div>
                {/* ALL-TIME ECOPOINTS */}
                <h1 className="flex justify-end text-2xl sour-gummy-body-500 mx-20 text-color">
                  {leaderboard.points}
                </h1>
              </div>
            </div>
          ))}
          {/*  */}
          {/* VIEW FULL LEADERBOARD (BUTTON) */}
          <div className="flex justify-center mt-10 group">
            <button className="text-xl sour-gummy-body-500 transition-transform duration-500 ease-out hover:cursor-pointer hover:scale-110 hover:-translate-y-2 ">
              <div className="soft-sage-bg px-4 py-4 rounded-lg hover:underline">
                View the Full Leaderboard
              </div>
            </button>
          </div>
        </div>
      </section>
      {/* USER REWARDS REDEMPTION SECTION */}
      <section
        id="redeem"
        className="background-color relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 mx-10 sm:px-6 lg:px-8 overflow-hidden scroll-mt-12"
      >
        <div className="relative justify-center overflow-hidden scroll-mt-28">
          {/* TEXT Above Container */}
          <div className="px-6 py-6 mb-10 sm:text-4xl md:text-4xl lg:text-6xl text-color text-center chewy-regular">
            <span className="relative flex-col item-center justify-center overflow-hidden">
              Earn Points by Recycling and Helping the Environment!
            </span>
          </div>
          {/* SEARCH BAR */}
          <div className="relative grid grid-cols-2 max-w-7xl">
            <div className="flex flex-col items-center">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mb-8 w-full max-w-xl"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="w-full rounded-full border border-white accent-color-background px-5 py-3 pr-20 text-base shadow-md transition-all duration-300 shadow-lg focus:border-gray-300 focus:outline-none"
                    placeholder="Search For Your Desired Rewards!"
                  />
                  <div className="absolute right-0 top-0 mr-4 mt-3 flex items-center">
                    <button type="submit" className="primary-color-header">
                      <Search size={20} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            {/* CATEGORIES */}
            <div className="relative order-2 text-center">
              <div className="grid grid-cols-4 gap-4 mb-10">
                {categories.map((cat, index) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setActiveIdx(0);
                    }}
                    className={
                      index === 0
                        ? "w-full px-4 py-4 primary-color rounded-lg sour-gummy-body-500 text-white text-sm sm:text-base shadow-lg transition-all duration-300 hover:border hover:scale-105 hover:-translate-y-2"
                        : "w-full px-4 py-4 accent-color-background rounded-lg sour-gummy-body-500 text-color text-sm sm:text-base shadow-lg transition-all duration-300 hover:border hover:scale-105 hover:-translate-y-2"
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* SEARCH RESULT */}
          {searchResults.length > 0 && (
            <div className="px-6 py-6">
              <ul className="grid grid-cols-3 gap-4 mb-20">
                {searchResults.map((rewards) => (
                  <li key={rewards.id}>
                    {/* Container Contents */}
                    <div className="w-full">
                      <div className="relative group">
                        {/* Outer Container */}
                        <div className="absolute inset-0 secondary-color rounded-xl sm:rounded-2xl transition-all duration-500" />
                        <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-6 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition">
                          {/* Inner Container */}
                          <img
                            src={rewards.image}
                            alt={rewards.image}
                            className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70 hover:-translate-y-2 group-hover:scale-115 transition-transform duration-500"
                          />
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                          <div className=" w-full">
                            {/* Title & Description */}
                            <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                              <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-color">
                                {rewards.title}
                              </h3>
                              <p className="text-color text-base text-xl sm:text-lg leading-relaxed text-justify">
                                {rewards.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="relative order-2 w-full transition-transform duration-300">
            {/* Container */}
            <div className="grid grid-row-3 mb:grid-row-6 grid-flow-col gap-10">
              {/*  */}
              {/* Inside Container */}
              {/*  */}
              {/* GRID REWARDS */}
              {/* COLUMN 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 col-start-1 gap-2 sm:gap-3 lg:gap-5 space-y-4 sm:space-y-6 lg:space-y-6">
                {filteredRewards
                  .slice(
                    activeIdx * itemsPerPage,
                    activeIdx * itemsPerPage + itemsPerPage,
                  )
                  .map((rewards, key) => (
                    <div key={`${rewards.title}-${key}`}>
                      {/* Container Contents */}
                      <div className=" w-full">
                        <div className="relative group">
                          {/* Outer Container */}
                          <div className="absolute inset-0 secondary-color rounded-xl sm:rounded-2xl transition-all duration-500 " />
                          <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition-transform">
                            {/* Inner Container */}
                            <img
                              src={rewards.image}
                              alt={rewards.image}
                              className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-125 lg:h-70 hover:-translate-y-2 group-hover:scale-115 transition-transform duration-500"
                            />
                            <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                            <div className="w-full">
                              {/* Title & Description */}
                              <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                                <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-color">
                                  {rewards.title}
                                </h3>
                                <p className="text-color text-base text-xl sm:text-lg leading-relaxed text-justify">
                                  {rewards.description}
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
