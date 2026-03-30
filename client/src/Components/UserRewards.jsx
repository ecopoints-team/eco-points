"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, MenuIcon, X, Trophy, Medal } from "lucide-react";
import Link from "next/link";

// --- MOCK DATA FOR LEADERBOARD ---
const leaderboardData =[
  { id: 1, name: "Tyrion Lannister", university: "Kings Landing University", scores: { daily: 500, weekly: 2500, 'all time': 19900 }, color: "bg-emerald-400" },
  { id: 2, name: "Jaime Lannister", university: "Kings Landing University", scores: { daily: 450, weekly: 2800, 'all time': 18900 }, color: "bg-amber-400" },
  { id: 3, name: "Jon Snow", university: "Winterfell College", scores: { daily: 300, weekly: 1500, 'all time': 17500 }, color: "bg-blue-400" },
  { id: 4, name: "Arya Stark", university: "Winterfell College", scores: { daily: 600, weekly: 2100, 'all time': 16200 }, color: "bg-purple-400" },
  { id: 5, name: "Daenerys Targaryen", university: "Dragonstone Tech", scores: { daily: 100, weekly: 900, 'all time': 15800 }, color: "bg-rose-400" },
  { id: 6, name: "Sansa Stark", university: "Winterfell College", scores: { daily: 200, weekly: 1200, 'all time': 14500 }, color: "bg-indigo-400" },
  { id: 7, name: "Bran Stark", university: "Winterfell College", scores: { daily: 50, weekly: 400, 'all time': 13900 }, color: "bg-teal-400" },
  { id: 8, name: "Samwell Tarly", university: "Citadel Academy", scores: { daily: 150, weekly: 1100, 'all time': 12100 }, color: "bg-orange-400" },
  { id: 9, name: "Juan Dela Cruz", university: "Arellano University", scores: { daily: 700, weekly: 3000, 'all time': 15000 }, color: "bg-blue-600" },
  { id: 10, name: "Maria Clara", university: "Arellano University", scores: { daily: 400, weekly: 2200, 'all time': 11000 }, color: "bg-pink-400" },
];

const TIMEFRAMES =['daily', 'weekly', 'all time'];

export default function UserRewards({ onLoginClick }) {
  // REWARDS
  const rewards =[
    { title: "Pencil", description: "A high-quality graphite pencil.", image: "/SampleReward-Pencil.jpg", id: 1, catID: "SchoolSupplies", points: "50 Points" },
    { title: "Notebook", description: "Eco-friendly lined notebook.", image: "/SampleReward-Ntbk.jpg", id: 2, catID: "SchoolSupplies", points: "120 Points" },
    { title: "Lanyard", description: "Durable university lanyard.", image: "/SampleReward-Lanyard.jpg", id: 3, catID: "SchoolSupplies", points: "80 Points" },
    { title: "Tote Bag", description: "Reusable canvas tote bag.", image: "/SampleReward-ToteBag.jpg", id: 4, catID: "Essentials", points: "250 Points" },
    { title: "Shirt", description: "Comfortable cotton t-shirt.", image: "/SampleReward-Shirt.jpg", id: 5, catID: "Essentials", points: "300 Points" },
    { title: "Mug", description: "Ceramic mug for your coffee.", image: "/SampleReward-Mug.jpg", id: 6, catID: "Essentials", points: "150 Points" },
    { title: "Stickers", description: "Cool vinyl stickers.", image: "/SampleReward-Stickers.jpg", id: 7, catID: "Extra", points: "30 Points" },
    { title: "Keychain", description: "Metal engraved keychain.", image: "/SampleReward-Keychain.jpg", id: 8, catID: "Extra", points: "60 Points" },
    { title: "Pins", description: "Collectible enamel pins.", image: "/SampleReward-Pins.jpg", id: 9, catID: "Extra", points: "45 Points" },
    { title: "EXTRA1", description: "Bonus item 1.", image: "/Stkrs.jpg", id: 10, catID: "Extra", points: "100 Points" },
    { title: "EXTRA2", description: "Bonus item 2.", image: "/Kychn.jpg", id: 11, catID: "Extra", points: "100 Points" },
    { title: "EXTRA3", description: "Bonus item 3.", image: "/Stkrs.jpg", id: 12, catID: "Extra", points: "100 Points" },
    { title: "EXTRA4", description: "Bonus item 4.", image: "/Stkrs.jpg", id: 13, catID: "Extra", points: "100 Points" },
    { title: "EXTRA5", description: "Bonus item 5.", image: "/Kychn.jpg", id: 14, catID: "Extra", points: "100 Points" },
    { title: "EXTRA6", description: "Bonus item 6.", image: "/Stkrs.jpg", id: 15, catID: "Extra", points: "100 Points" },
    { title: "EXTRA7", description: "Bonus item 7.", image: "/Stkrs.jpg", id: 16, catID: "Extra", points: "100 Points" },
    { title: "EXTRA8", description: "Bonus item 8.", image: "/Kychn.jpg", id: 17, catID: "Extra", points: "100 Points" },
    { title: "EXTRA9", description: "Bonus item 9.", image: "/Stkrs.jpg", id: 18, catID: "Extra", points: "100 Points" },
  ];

  // CHALLENGES
  const challenges =[
    { title: "Sample Challenge #1", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "15 Points", id: 1 },
    { title: "Sample Challenge #2", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "10 Points", id: 2 },
    { title: "Sample Challenge #3", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "10 Points", id: 3 },
    { title: "Sample Challenge #4", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "5 Points", id: 4 },
    { title: "Sample Challenge #5", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "5 Points", id: 5 },
    { title: "Sample Challenge #6", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "5 Points", id: 6 },
    { title: "Sample Challenge #7", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", image: "/SampleImage-UserIcon.png", points: "5 Points", id: 7 },
  ];

  // FOR CATEGORIES (REWARDS)
  const categories =[
    { label: "All Rewards", value: "All" },
    { label: "School Supplies", value: "SchoolSupplies" },
    { label: "Essentials", value: "Essentials" },
    { label: "Extras", value: "Extra" },
  ];

  const[selectedCategory, setSelectedCategory] = useState("All");

  const filteredRewards = selectedCategory === "All"
    ? rewards
    : rewards.filter((reward) => reward.catID === selectedCategory);

  // --- LEADERBOARD STATE & LOGIC ---
  const[timeframe, setTimeframe] = useState('all time');

  const filteredLeaderboard = useMemo(() => {
    let list =[...leaderboardData];
    return list.sort((a, b) => b.scores[timeframe] - a.scores[timeframe]);
  },[timeframe]);

  const topThree = filteredLeaderboard.slice(0, 3);

  // FOR PAGINATION (REWARDS)
  const[searchTerm, setSearchTerm] = useState("");
  const[searchResults, setSearchResults] = useState([]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

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
    }, 300),[rewards],
  );

  useEffect(() => {
    handleSearch(searchTerm);
  },[searchTerm, handleSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const[activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);

  const next = () => setActiveIdx((prev) => (prev + 1) % totalPages);
  const previous = () => setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);

  // NAVIGATION LINKS
  const navLinks =[
    { label: "Rewards", target: "home" },
    { label: "Challenges", target: "challenges" },
    { label: "Leaderboard", target: "leaderboard" },
    { label: "Redeem", target: "redeem" },
  ];

  const[mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const[activeSection, setActiveSection] = useState("home");
  const [color, setColor] = useState(false);

  useEffect(() => {
    const changeColor = () => setColor(window.scrollY >= 90);
    window.addEventListener("scroll", changeColor);
    return () => window.removeEventListener("scroll", changeColor);
  },[]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) => document.getElementById(link.target));
      const current = sections.find((section) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          return rect.top <= 120 && rect.bottom > 120;
        }
        return false;
      });
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  },[]);

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
  },[]);

  const handleNavLinkClick = useCallback((link) => {
    if (link.external && link.href) {
      setMobileMenuIsOpen(false);
      if (typeof window !== "undefined") window.location.assign(link.href);
      return;
    }
    handleNavClick(link.target);
  },[handleNavClick]);

  return (
    <section className="relative background-color min-h-screen pt-30 sm:pt-34 overflow-hidden scroll-mt-28 flex flex-col">
     <style suppressHydrationWarning dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Chewy&family=Instrument+Serif:ital@0;1&family=Playpen+Sans+Deva:wght@100..800&family=Sour+Gummy:ital,wght@0,100..900;1,100..900&display=swap');
        `
      }} />
      
      {/* NAVIGATION SECTION */}
      <section>
        <nav className={color ? "nav nav-bg backdrop-blur-sm" : "fixed top-1 w-full z-50 transition-all duration-300"}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="relative flex justify-between items-center sm:h-16 md:h-20 lg:h-20">
              <Link href="/">
                <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform duration-300">
                  <span className="">
                    <img src="/EcoPoints Logo Mark with Name (Light Version).png" alt="Logo" className="w-30 lg:w-auto lg:h-15 sm:h-12 md:h-12" />
                  </span>
                </div>
              </Link>
              <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-6 lg:space-x-8 sour-gummy-body-500 text-white">
                <Link href="/">
                  <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform duration-300">
                    <span className="">Back to Home</span>
                  </div>
                </Link>
                {navLinks.map((link) => {
                  const isActive = activeSection === link.target;
                  return (
                    <button
                      key={link.target}
                      type="button"
                      onClick={() => handleNavLinkClick(link)}
                      className={`relative group lg:text-md lg:text-base transition-colors duration-300 cursor-pointer ${
                        isActive ? "text-color-header lg:text-xl" : "text-white hover:text-color-header"
                      }`}
                    >
                      {link.label}
                      <span className={`absolute bottom-0 h-0.5 bg-orange-300 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${isActive ? "w-full" : "w-0"}`}></span>
                    </button>
                  );
                })}
              </div>
              <div className="hidden md:flex items-center space-x-6 lg:space-x-8 group cursor-pointer">
                <div className="w-20 flex justify-center items-center px-1 py-1 rounded-lg border border-white/20 transition-all duration-100 font-body-regular hover:font-body-bold hover:bg-amber-700/80">
                  <button type="button" onClick={onLoginClick} className="text-white text-sm lg:text-base px-2 w-full text-center group cursor-pointer">
                    Log In
                  </button>
                </div>
              </div>

              <button className="md:hidden items-center p-2 text-gray-300 hover:text-white" onClick={() => setMobileMenuIsOpen((prev) => !prev)}>
                {mobileMenuIsOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuIsOpen && (
            <div className="md:hidden bg-lime-950/90 backdrop-blur-lg border-t border-white animate-in slide-in-from-top duration-500">
              <div className="px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                {navLinks.map((link) => (
                  <button key={link.target} type="button" onClick={() => handleNavLinkClick(link)} className={`block text-sm lg:text-base text-left w-full ${activeSection === link.target ? "text-orange-400 font-bold" : "text-white hover:text-orange-600"}`}>
                    {link.label}
                  </button>
                ))}
                <button type="button" onClick={() => { setMobileMenuIsOpen(false); onLoginClick(); }} className="block text-left text-white hover:text-orange-600 text-sm lg:text-base w-full mt-2 pt-2 border-t border-white/10">
                  Log In
                </button>
              </div>
            </div>
          )}
        </nav>
      </section>

      {/* USER SUMMARY SECTION */}
      <div id="home" className="bg-[#41744B] rounded-[2.5rem] mx-4 md:mx-10 mt-10 shadow-xl border-2 border-white/10 relative scroll-mt-35">
        <div className="flex flex-col lg:grid lg:grid-cols-4 px-6 py-16 justify-center animate-in slide-in-from-bottom duration-700 delay-200 gap-8 lg:gap-4">
          <div className="lg:grid lg:grid-cols-2 items-center">
            <img src="/SampleImage-UserIcon.png" className="w-16 h-16 lg:w-auto lg:h-auto mx-auto lg:mx-0" />
            <span className="relative text-xl sm:text-base lg:text-3xl sour-gummy-body-500 text-white leading-relaxed text-center lg:text-left mt-4 lg:mt-0">
              Hi! User
              <span className="sour-gummy-body-400 block"><p>&mdash;</p></span>
            </span>
          </div>
          <div className="lg:grid lg:grid-cols-2 items-center">
            <img src="/SampleImage-EcoPoints.png" className="w-16 h-16 lg:w-auto lg:h-auto mx-auto lg:mx-0" />
            <span className="relative order-2 text-xl sm:text-base lg:text-2xl sour-gummy-body-500 text-white leading-relaxed text-center lg:text-left mt-4 lg:mt-0">
              SUMMARY OF POINTS:
              <span className="sour-gummy-body-400 block"><p>&mdash;</p></span>
            </span>
          </div>
          <div className="lg:grid lg:grid-cols-2 items-center">
            <img src="SampleImage-CurrentPoints.png" className="w-16 h-16 lg:w-auto lg:h-auto mx-auto lg:mx-0" />
            <span className="relative order-3 text-xl sm:text-base lg:text-2xl text-white sour-gummy-body-500 leading-relaxed text-center lg:text-left mt-4 lg:mt-0">
              TODAY'S POINTS:
              <span className="sour-gummy-body-400 block"><p>&mdash;</p></span>
            </span>
          </div>
          <div className="lg:grid lg:grid-cols-2 items-center">
            <img src="SampleImage-Streak.png" className="w-16 h-16 lg:w-auto lg:h-auto mx-auto lg:mx-0" />
            <span className="relative order-4 text-xl sm:text-base lg:text-2xl text-white sour-gummy-body-500 leading-relaxed text-center lg:text-left mt-4 lg:mt-0">
              STREAK:
              <span className="sour-gummy-body-400 block"><p>&mdash;</p></span>
            </span>
          </div>
        </div>
      </div>

      {/* REMINDERS SECTION */}
      <div className="bg-[#41744B] items-center mt-10 grid grid-cols-1 md:grid-cols-2 rounded-[2.5rem] mx-4 md:mx-10 shadow-xl border-2 border-white/10 p-8">
        <h1 className="sour-gummy-body-400 text-white text-2xl text-center md:text-left md:pr-10 leading-relaxed">
          Don’t miss out! This is to Remind you to collect PET Bottles and unlock your EcoPoints
        </h1>
        <div className="flex items-center justify-center md:justify-end mt-6 md:mt-0">
          <Link href="/" className="group shadow-lg px-8 py-4 bg-[#66C68E] text-white rounded-[1.5rem] sour-gummy-body-500 text-xl transition-all duration-500 hover:scale-105 hover:bg-green-400 text-center border-2 border-transparent hover:border-white/50">
            Send Reminders
          </Link>
        </div>
      </div>

      {/* CHALLENGES SECTION */}
      <section id="challenges" className="scroll-mt-25">
        <div className="max-w-7xl mx-auto mt-10 mb-10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-color">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {challenges.slice(activeIdx * itemsPerPage, activeIdx * itemsPerPage + itemsPerPage).map((challenges, index) => (
                  <div key={`${challenges.title}-${index}`} className={index === 0 ? "md:col-span-2 h-full" : "col-span-1 h-full"}>
                    
                    {/* OUTER CONTENT - Dark Green Outside */}
                    <div className="bg-[#41744B] p-2.5 sm:p-3 h-full flex flex-col rounded-[2rem] shadow-xl border-2 border-white/10">
                      <div className={`group h-full ${index === 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" : "flex flex-col gap-2 sm:gap-3"}`}>
                        
                        {/* IMAGE AREA - Light Green Inside */}
                        <div className={`overflow-hidden bg-[#66C68E] rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/20 ${index === 0 ? "h-full min-h-[10rem] sm:min-h-[12rem]" : "w-full aspect-square max-h-[14rem] mx-auto"}`}>
                          <img src={challenges.image} className={`object-contain p-4 w-full h-full transition-transform duration-500 ${index === 0 ? "ease-out delay-300 group-hover:scale-95 group-hover:-rotate-2" : "ease-in group-hover:scale-110 group-hover:rotate-4"}`} />
                        </div>
                        
                        {/* HEADER & DESCRIPTION - Light Green Inside */}
                        <div className="bg-[#66C68E] p-4 sm:p-5 flex flex-col flex-grow rounded-[1.5rem] shadow-md border border-white/20">
                          <div className="text-white sour-gummy-body-500">
                            <h1 className={index === 0 ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl font-bold"}>{challenges.title}</h1>
                          </div>
                          <div className="text-white/90 sour-gummy-body-400 flex-grow">
                            <p className={index === 0 ? "text-lg sm:text-xl mb-4 mt-3 leading-relaxed" : "text-sm sm:text-base mb-3 mt-2"}>{challenges.description}</p>
                          </div>
                          <div className="flex justify-center text-white sour-gummy-body-500 mt-auto pt-3 border-t border-white/30">
                            <button className={`font-bold tracking-wider duration-300 transition-all hover:text-green-200 hover:scale-105 group-hover:cursor-pointer ${index === 0 ? "text-xl" : "text-base"}`}>
                              {challenges.points}
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
      </section>

      {/* NEW LEADERBOARD SECTION */}
      <section id="leaderboard" className="scroll-mt-25 my-10 mx-4 md:mx-10 bg-[#41744B] rounded-[2.5rem] shadow-xl border-2 border-white/10">
        <div className="max-w-4xl mx-auto text-center p-8 md:p-12">

          <div className="mb-8">
            <p className="text-white text-lg md:text-xl font-bold mb-1 sour-gummy-body-400">Think you're the best Recycler?</p>
            <p className="text-white/80 text-sm md:text-base sour-gummy-body-300">Compete with fellow students and faculties alike to climb the leaderboard</p>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-12 text-white sour-gummy-body-500 tracking-tight drop-shadow-md">
            Top Recyclers
          </h1>

          {/* Timeframe Tabs */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            {TIMEFRAMES.map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeframe(tab)}
                className={`px-8 py-3 rounded-xl text-sm font-bold uppercase transition-all shadow-md cursor-pointer transform active:scale-95 border-2 ${
                  timeframe === tab 
                    ? 'bg-[#66C68E] text-white border-white/50' 
                    : 'bg-[#679B6A]/50 text-white/70 border-transparent hover:bg-[#66C68E]/80 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Bar Graph / Podium */}
          {filteredLeaderboard.length > 0 ? (
            <div className="flex justify-center items-end h-80 mb-20 gap-4 sm:gap-12">
              <PodiumBar user={topThree[1]} rank={2} height="h-[50%]" color="bg-[#66C68E]" score={topThree[1]?.scores[timeframe]} />
              <PodiumBar user={topThree[0]} rank={1} height="h-[70%]" color="bg-[#66C68E]" score={topThree[0]?.scores[timeframe]} />
              <PodiumBar user={topThree[2]} rank={3} height="h-[35%]" color="bg-[#66C68E]" score={topThree[2]?.scores[timeframe]} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-white/50 italic sour-gummy-body-300">No rankings available for this selection</div>
          )}

          {/* Compact Rank List */}
          <div className="bg-black/10 backdrop-blur-md rounded-[2.5rem] p-4 md:p-6 border border-white/10 text-left">
            <div className="flex flex-col gap-3">
              {filteredLeaderboard.map((user, index) => {
                const rank = index + 1;
                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center p-4 rounded-2xl gap-4 transition-all border ${
                      rank === 1 ? "bg-[#FCD34D]/20 border-[#FCD34D]/30" : 
                      rank === 2 ? "bg-white/10 border-white/10" : 
                      rank === 3 ? "bg-[#cd7f32]/20 border-[#cd7f32]/30" : "bg-transparent border-transparent"
                    }`}
                  >
                    <div className={`w-8 text-center font-black text-xl ${rank === 1 ? "text-[#FCD34D]" : "text-white/40"}`}>{rank}</div>
                    <div className={`w-12 h-12 rounded-full ${user.color} flex-shrink-0 flex items-center justify-center font-bold text-white text-xl shadow-inner border-2 border-white/10`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <div className="font-bold text-white text-base sm:text-lg sour-gummy-body-500">{user.name}</div>
                      <div className="text-xs text-white/60 font-medium sour-gummy-body-300">{user.university}</div>
                    </div>
                    <div className="font-black text-white text-lg sm:text-xl tracking-tighter text-right sour-gummy-body-500">
                      {user.scores[timeframe].toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* USER REWARDS REDEMPTION SECTION */}
      <section id="redeem" className="relative flex flex-col item-center justify-center sm:pt-12 px-4 mx-4 md:mx-10 sm:px-6 lg:px-8 overflow-hidden scroll-mt-12 bg-[#41744B] rounded-[2.5rem] shadow-xl border-2 border-white/10 mb-10 pb-20">
        <div className="relative justify-center overflow-hidden w-full">
          <div className="px-6 py-10 mb-6 sm:text-4xl md:text-4xl lg:text-5xl text-white text-center sour-gummy-body-500">
            <span className="relative flex-col item-center justify-center overflow-hidden drop-shadow-md">
              Earn Points by Recycling and Helping the Environment!
            </span>
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto px-4 md:px-10 gap-10">
            <div className="flex flex-col items-center md:items-start w-full">
              <form onSubmit={(e) => e.preventDefault()} className="mb-8 w-full max-w-xl">
                <div className="relative">
                  <input type="text" value={searchTerm} onChange={handleInputChange} className="w-full rounded-full border-2 border-white/20 bg-[#66C68E] text-white placeholder-white/70 px-5 py-3 pr-14 text-base shadow-lg transition-all duration-300 focus:border-white focus:outline-none" placeholder="Search For Your Desired Rewards!" />
                  <div className="absolute right-0 top-0 mr-3 mt-2.5 flex items-center">
                    <button type="submit" className="text-white hover:text-green-200 cursor-pointer p-1">
                      <Search size={24} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="relative order-2 text-center w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-10">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.value;
                  return (
                    <button 
                      key={cat.value} 
                      onClick={() => { setSelectedCategory(cat.value); setActiveIdx(0); }} 
                      className={`w-full px-2 py-2 sm:px-3 sm:py-2 rounded-[0.75rem] sour-gummy-body-500 text-xs sm:text-sm shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 ${
                        isActive 
                          ? "bg-[#66C68E] text-white border-white scale-105" 
                          : "bg-[#548E5F] text-white/90 border-transparent hover:bg-[#66C68E]/80 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SEARCH RESULTS */}
          {searchResults.length > 0 && (
            <div className="px-4 md:px-10 py-6 max-w-7xl mx-auto w-full">
              <h2 className="text-2xl text-white mb-6 sour-gummy-body-500">Search Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                {searchResults.map((rewards) => (
                  <div key={rewards.id} className="w-full h-full">
                    {/* Dark Green Outer */}
                    <div className="bg-[#41744B] p-3 h-full flex flex-col rounded-[2rem] shadow-xl border-2 border-white/10 group">
                      {/* Light Green Inner */}
                      <div className="bg-[#66C68E] flex flex-col flex-grow rounded-[1.5rem] p-5 overflow-hidden shadow-md border border-white/20 transition-all duration-300">
                        <div className="overflow-hidden rounded-xl mb-4 shadow-inner bg-white/20 flex items-center justify-center">
                          <img src={rewards.image} alt={rewards.image} className="object-cover w-full h-48 hover:-translate-y-2 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="w-full flex-grow flex flex-col text-center">
                          <h3 className="text-2xl font-bold mb-2 text-white sour-gummy-body-500">{rewards.title}</h3>
                          <p className="text-white/90 text-sm leading-relaxed sour-gummy-body-400 mb-4">{rewards.description}</p>
                          <div className="flex justify-center text-white sour-gummy-body-500 mt-auto pt-3 border-t border-white/30">
                            <button className="font-bold tracking-wider text-base duration-300 transition-all hover:text-green-200 hover:scale-105 group-hover:cursor-pointer">
                              {rewards.points}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGINATED REWARDS GRID */}
          <div className="relative w-full transition-transform duration-300 max-w-7xl mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 space-y-0">
              {filteredRewards.slice(activeIdx * itemsPerPage, activeIdx * itemsPerPage + itemsPerPage).map((rewards, key) => (
                  <div key={`${rewards.title}-${key}`} className="w-full h-full">
                    {/* Dark Green Outer */}
                    <div className="bg-[#41744B] p-3 h-full flex flex-col rounded-[2rem] shadow-xl border-2 border-white/10 group">
                      {/* Light Green Inner */}
                      <div className="bg-[#66C68E] flex flex-col flex-grow rounded-[1.5rem] p-5 overflow-hidden shadow-md border border-white/20 transition-all duration-300">
                        <div className="overflow-hidden rounded-xl mb-4 shadow-inner bg-white/20 flex items-center justify-center">
                          <img src={rewards.image} alt={rewards.image} className="object-cover w-full h-40 hover:-translate-y-2 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="w-full flex-grow flex flex-col text-center">
                          <h3 className="text-2xl font-bold mb-2 text-white sour-gummy-body-500">{rewards.title}</h3>
                          <p className="text-white/90 text-sm leading-relaxed sour-gummy-body-400 mb-4">{rewards.description}</p>
                          <div className="flex justify-center text-white sour-gummy-body-500 mt-auto pt-3 border-t border-white/30">
                            <button className="font-bold tracking-wider text-base duration-300 transition-all hover:text-green-200 hover:scale-105 group-hover:cursor-pointer">
                              {rewards.points}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="flex items-center justify-center gap-6 mt-16 mb-8">
              <button onClick={previous} className="p-4 rounded-full bg-[#66C68E] text-white shadow-lg transition-all hover:scale-110 hover:bg-green-400 cursor-pointer border border-white/20"><ChevronLeft size={24} /></button>
              <div className="flex gap-3">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveIdx(idx)} 
                    className={`h-3 cursor-pointer rounded-full transition-all duration-300 shadow-inner ${idx === activeIdx ? "w-12 bg-[#66C68E]" : "w-3 bg-white/30 hover:bg-white/50"}`} 
                  />
                ))}
              </div>
              <button onClick={next} className="p-4 rounded-full bg-[#66C68E] text-white shadow-lg transition-all hover:scale-110 hover:bg-green-400 cursor-pointer border border-white/20"><ChevronRight size={24} /></button>
            </div>
          </div>

        </div>
      </section>

      {/* ECOPOINTS FOOTER RESTORED WITHOUT TOP BORDER */}
      <footer className="bg-[#41744B] text-white pt-16 pb-8 px-8 md:px-16 w-full z-10 relative mt-auto shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Logo & Desc */}
          <div className="flex flex-col items-start">
            <img src="/EcoPoints Logo Mark with Name (Light Version).png" alt="EcoPoints Logo" className="w-60 h-auto mb-6 hover:scale-110 transition-transform duration-500 cursor-pointer" />
            <p className="text-white/90 text-sm md:text-base leading-relaxed sour-gummy-body-300">
              A smart recycling initiative powered by technology and sustainability.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-2xl chewy-regular mb-6 tracking-wider uppercase text-white">QUICK LINKS</h3>
            <ul className="space-y-4 text-white/80 sour-gummy-body-400 uppercase text-lg">
              <li><Link href="/#home" className="hover:text-[#e67e22] transition-colors">HOME</Link></li>
              <li><Link href="/#features" className="hover:text-[#e67e22] transition-colors">FEATURES</Link></li>
              <li><Link href="/#services" className="hover:text-[#e67e22] transition-colors">SERVICES</Link></li>
              <li><Link href="/#showcase" className="hover:text-[#e67e22] transition-colors">SHOWCASE</Link></li>
              <li><Link href="#leaderboard" className="hover:text-[#e67e22] transition-colors">LEADERBOARD</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-2xl chewy-regular mb-6 tracking-wider uppercase text-white">RESOURCES</h3>
            <ul className="space-y-4 text-white/80 sour-gummy-body-400 uppercase text-lg">
              <li><Link href="/#about-us" className="hover:text-[#e67e22] transition-colors">ABOUT US</Link></li>
              <li><Link href="/#faqs" className="hover:text-[#e67e22] transition-colors">FAQS</Link></li>
              <li><Link href="/#documentation" className="hover:text-[#e67e22] transition-colors">DOCUMENTATION</Link></li>
              <li><Link href="/#research-paper" className="hover:text-[#e67e22] transition-colors">RESEARCH PAPER</Link></li>
              <li><Link href="/#support-us" className="hover:text-[#e67e22] transition-colors">SUPPORT US</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-2xl chewy-regular mb-6 tracking-wider uppercase text-white">CONTACT</h3>
            <ul className="space-y-4 text-white/80 sour-gummy-body-400">
              <li className="text-xl">PUP Mabini Campus, Manila</li>
              <li className="text-lg"><a href="mailto:team8.ecopoints@gmail.com" className="hover:text-[#e67e22] transition-colors">team8.ecopoints@gmail.com</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto border-t border-white/20 pt-8 flex justify-center">
          <h1 className="sour-gummy-body-400 text-base md:text-lg text-white/80 text-center tracking-wide">
            © 2025 EcoPoints. A PUP Institute of Technology Research Project.
          </h1>
        </div>
      </footer>

    </section>
  );
}

// Podium Bar Sub-component
function PodiumBar({ user, rank, height, color, score }) {
  if (!user) return <div className="w-24 sm:w-32 invisible" />;
  const isFirst = rank === 1;

  return (
    <div className="flex flex-col items-center justify-end w-24 sm:w-32 h-full animate-fade-in-up">
      <div className="relative mb-3 flex flex-col items-center">
        {isFirst && <Trophy className="text-yellow-400 mb-1 drop-shadow-lg scale-150" size={32} />}
        {!isFirst && <Medal className={rank === 2 ? "text-gray-300" : "text-amber-700"} size={28} />}
        <div className={`w-16 h-16 rounded-full ${user.color} border-4 border-[#41744B] flex items-center justify-center font-black text-white shadow-2xl z-10 -mb-5 text-2xl`}>
          {user.name.charAt(0)}
        </div>
      </div>
      <div className={`w-full ${height} ${color} rounded-t-[2rem] flex flex-col items-center pt-10 pb-4 px-2 relative overflow-hidden shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)] border-x-2 border-t-2 border-white/20`}>
        <div className="absolute inset-0 bg-white/10 pointer-events-none opacity-50"></div>
        <span className="text-xs font-black text-[#1b431e] uppercase tracking-tighter truncate w-full px-1 z-10">{user.name.split(' ')[0]}</span>
        <span className="mt-auto font-black text-base text-[#1b431e] z-10 drop-shadow-sm">{score?.toLocaleString()}</span>
      </div>
    </div>
  );
}