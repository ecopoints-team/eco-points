"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MenuIcon } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

export default function RewardsOrg({ onLoginClick }) {
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

  const visualInstruction = [
    {
      title: "Sign In",
      description:
        "Try logging in with your EcoPoints account, before creating a new one.",
      visualLink: "Sign In Here",
      image: "/SampleImage-UserIcon.png",
    },
    {
      title: "Visit the Rewards Dashboard",
      description:
        "This fully activates your account, so you can start earning instantly.",
      visualLink: "Visit Rewards",
      image: "/SampleImage-UserIcon.png",
    },
    {
      title: "Recycle PET Bottles to Earn Points!",
      description:
        "Rack up points and redeem them for school supplies, essentials and more",
      visualLink: "View the Machine",
      image: "/SampleImage-UserIcon.png",
    },
  ];

  // PAGINATION FOR REWARDS
  const [activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(features.length / itemsPerPage);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % totalPages);
  };

  const previous = () => {
    setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

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

  // NAVIGATION LINKS
  const navLinks = [
    { label: "Services", target: "home" },
    { label: "Start Earning", target: "earnPoints" },
    { label: "Rewards", target: "rewards" },
    { label: "How to Earn Points?", target: "howEarn" },
  ];

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

  // START EARNING POINTS LINKS
  const howToEarnLinks = [
    {
      title: "How to Earn EcoPoints?",
      alt: "How to Earn EcoPoints",
      description: "There are a lot of ways to earn EcoPoints in your Account",
      clickableLink: "Earn Here",
      howToEarnID: "EarnHere",
      image: "/SampleImage-Streak.png",
    },
    {
      title: "Leaderboards & Challenges",
      alt: "Leaderboards & Challenges",
      description:
        "Don't let anyone keep you from being the best at recycling bottles",
      clickableLink: "Click Here",
      howToEarnID: "ClickHere",
      image: "/SampleImage-Streak.png",
    },
    {
      title: "Discover Rewards!",
      alt: "Discover Rewards!",
      description:
        "Rack up points and redeem them for gift cards, cash donations to causes you care about, and more.",
      clickableLink: "Explore the Rewards",
      howToEarnID: "Explore",
      image: "/SampleImage-Streak.png",
    },
  ];

  const howToEarnSection = [
    {
      title: "Earn Here",
      description:
        " Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus ut id nulla illo. Porro ea vitae accusamus dolorem eveniet, incidunt qui iusto natus explicabo aliquid temporibus, obcaecati, nobis laudantium fugit!",
      image: "/SampleImage-Streak.png",
      id: "EarnHere",
    },
    {
      title: "Leaderboard & Challenges",
      description:
        " Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus ut id nulla illo. Porro ea vitae accusamus dolorem eveniet, incidunt qui iusto natus explicabo aliquid temporibus, obcaecati, nobis laudantium fugit!",
      image: "/SampleImage-Streak.png",
      id: "ClickHere",
    },
    {
      title: "Discover Rewards",
      description:
        " Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus ut id nulla illo. Porro ea vitae accusamus dolorem eveniet, incidunt qui iusto natus explicabo aliquid temporibus, obcaecati, nobis laudantium fugit!",
      image: "/SampleImage-Streak.png",
      id: "Explore",
    },
  ];

  return (
    <section className="relative flex flex-grid lg:grid lg:grid-row-2 min-h-screen deep-forest-bg flex items-center justify-center lg:pt-28 sm:pt-32 px-4 sm:px-6 lg:px-0 overflow-hidden">
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
              : "fixed top-1 w-full z-50 transition-all duration-300 opacity-0"
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
      {/* TOP SETION */}
      {/* COL-1 EXAMPLE CONTAINER */}
      <div
        id="home"
        className="scroll-mt-28 flex text-center deep-forest-bg items-center p-4 py-12 lg:px-10 justify-center transition-transform duration-300"
      >
        {/* CONTAINER CONTENT */}
        <div className="lg:grid lg:grid-cols-2 secondary-color backdrop-blur-xl rounded-md sm:rounded-xl p-4 lg:p-6 sm:p-4 gap-20 mb-10 shadow-2xl border border-white/10">
          {/* Container */}
          {/* Inside Container */}
          <div className="order-1">
            {/* Header Text */}
            <h2 className="text-6xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl chewy-regular mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg text-color bg-clip-text text-transparent block mb-1 sm:2 ">
                EcoPoints: Rewards
              </span>
            </h2>
            {/* Content Text */}
            <p className="text-xl sm:text-base lg:text-2xl text-color text-justify max-w-2xl sour-gummy-body-400 lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              Earn rewards with EcoPoints. Just by simply recycling. Sign in or
              create an EcoPoints account and get points for School-Related
              rewards, Essentials, and more.
            </p>

            {/* BUTTONS Inside Grid #1 */}
            <div className="flex flex-row items-center justify-center mt-4 sm:mt-6 lg:mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 ">
                <Link
                  href="/userRewards"
                  className="group w-full shadow-lg sm:w-auto px-6 sm:px-8 py-3 sm:py-4 accent-color-background text-color rounded-lg sour-gummy-body-400 text-xl transition-transform duration-500 hover:scale-110 hover:border hover:underline text-center"
                >
                  Start Earning EcoPoints!
                </Link>
              </div>
            </div>
          </div>

          {/* COL-2 CONTAINER */}
          <div className="relative order-2 w-full">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10 transition-transform delay-300 ease-out duration-700 hover:scale-90">
              <div className="rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[320px] border border-white/5 transition-transform delay-300 ease-in duration-300 hover:scale-140">
                {/* Container */}
                <img
                  src="SampleImage-UserIcon.png"
                  alt="Sample"
                  className="w-full h-auto"
                />
                {/* Inside Container */}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cards */}
      </div>

      {/* WHOLE CONTENT SECTION */}
      <section id="" className="px-10 py-10">
        <div>
          {/* VISUAL AREA SECTION */}
          <section id="earnPoints" className="scroll-mt-20">
            {/* DESCRIPTION AREA */}
            <section id="" className="">
              <div className="flex flex-row lg:grid lg:grid-row-2 px-10 py-10">
                {/* HEADER */}
                <div className="text-center mb-2 sm:mb-6 lg:mb-2">
                  <h2 className="sm:text-4xl lg:text-7xl font-bold mb-4 sm:mb-6">
                    <span className="chewy-regular accent-color-text bg-clip-text text-transparent">
                      Want to Start Earning Points?
                    </span>
                  </h2>
                </div>
                {/* CONTENT */}
                <div className="text-center mb-2 sm:mb-4 lg:mb-4 order-2">
                  <p className="sour-gummy-body-300 text-white text-xl sm:text-3xl lg:text-2xl">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Deserunt nobis eveniet quas incidunt nemo itaque omnis
                    voluptate repudiandae quae neque distinctio dolor placeat
                    aliquid cupiditate, inventore sunt enim alias officiis.
                  </p>
                </div>
              </div>
            </section>
            {/* VISUAL INSTRUCTION */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 text-center mb-12 gap-6 chewy-regular">
              {/* 1ST SECTION */}
              {visualInstruction.map((visualInstruction) => (
                <div key="" className="soft-sage-bg">
                  <div className="px-2 py-2">
                    {/* ICON */}
                    <div className="secondary-color">
                      <img src={visualInstruction.image} />
                    </div>
                    {/* TEXT */}
                    <h1 className="text-color text-3xl mb-4 mt-4">
                      {visualInstruction.title}
                    </h1>
                    <p className="text-color text-xl sour-gummy-body-400">
                      {visualInstruction.description}
                    </p>
                    <button className="text-color text-xl px-2 py-2 mt-6 cursor-pointer hover:underline">
                      {visualInstruction.visualLink}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* REWARDS SECTION */}
          <section id="rewards" className="scroll-mt-24 mt-20">
            {/* TEXT CONTENT */}
            <div className="relative text-center mb-2 sm:mb-6 lg:mb-6 lg:px-0 lg:py-0 ">
              <h2 className="sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
                <span className="chewy-regular accent-color-text bg-clip-text text-transparent">
                  Here are some Rewards you can Redeem!
                </span>
                <br />
              </h2>
            </div>
            {/* REWARDS */}
            <div className="relative max-w-6xl mx-auto">
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
                          <div className="relative soft-sage-bg backdrop-blur-sm border border-gray-700/50 lg:h-auto rounded-xl sm:rounded-2xl sm:p-6 lg:px-2 lg:py-2 overflow-hidden transition-shadow duration-300 ease-out shadow-2xl group-hover:cursor-pointer">
                            {/* INNER CONTAINER */}
                            <div className="relative group bg-gray-800/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                              <img
                                src={feature.image}
                                alt={feature.image}
                                className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-100 lg:h-60 transition-transform duration-500 ease-out group-hover:scale-112 group-hover:-translate-y-1"
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
              <div className="flex items-center justify-center gap-4 mb-8 cursor-pointer text-color lg:mb-18">
                <button
                  onClick={previous}
                  className="p-3 rounded-full soft-sage-bg transition-all cursor-pointer"
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
                          ? "w-8 soft-sage-bg"
                          : "w-2 soft-sage-bg"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="p-3 rounded-full soft-sage-bg transition-all cursor-pointer"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </section>
          {/* INSTRUCTION SECTION*/}
          <section id="howEarn" className="scroll-mt-22 ">
            {/* HEADER */}
            <div className="text-center mb-2 sm:mb-6 lg:mb-2">
              <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-7xl mb-4">
                <span className="chewy-regular accent-color-text bg-clip-text text-transparent">
                  There are Many Ways to Earn EcoPoints!
                </span>
              </h2>
              <p className="text-4xl sour-gummy-body-400 text-white mb-10">
                Click Below and discover all the possible ways of earning points
              </p>
            </div>
            <div className="flex flex-col lg:grid lg:grid-cols-3 text-center mb-12 gap-6 chewy-regular">
              {/* 1ST SECTION */}
              {howToEarnLinks.map((howToEarnLinks) => (
                <div className="soft-sage-bg">
                  <div className="px-2 py-2">
                    {/* ICON */}
                    <div className="background-color rounded-lg p-2">
                      <img
                        src={howToEarnLinks.image}
                        alt={howToEarnLinks.alt}
                      />
                    </div>
                    {/* TEXT */}
                    <h1 className="text-3xl text-color mb-4 mt-4">
                      {howToEarnLinks.title}
                    </h1>
                    <p className="text-lg text-color sour-gummy-body-400">
                      {howToEarnLinks.description}
                    </p>
                    {/* CLICKABLE BUTTON */}
                    <button
                      onClick={() => {
                        const section = document.getElementById(
                          howToEarnLinks.howToEarnID,
                        );
                        if (section) {
                          section.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                      className="text-xl text-color px-4 py-4 mt-6 cursor-pointer hover:underline"
                    >
                      {howToEarnLinks.clickableLink}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* CONTAINER SECTION */}
          {/* CONTAINER */}
          <div className="mx-10 mb-20">
            {/* INNER CONTAINER */}
            <div className="grid lg:grid lg:grid-row-3 gap-10">
              {/* SECTION 1 */}
              {howToEarnSection.map((howToEarnSection, key) => (
                <section
                  id={howToEarnSection.id}
                  className="background-color scroll-mt-28"
                >
                  <div className="order-1">
                    {/* INNER SECTION */}
                    <div className="flex lg:grid lg:grid-cols-2 mx-2 my-2 gap-2">
                      {/* COLUMN 1 (EARN HERE) */}
                      <div className="text-color px-4 py-4">
                        <h1 className="text-center chewy-regular text-4xl mt-4 mb-2">
                          {howToEarnSection.title}
                        </h1>
                        <p className="text-center sour-gummy-body-400 text-xl">
                          {howToEarnSection.description}
                        </p>
                      </div>
                      {/* COLUMN 2 */}
                      <div className="secondary-color px-4 py-4">
                        <img src={howToEarnSection.image} />
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
