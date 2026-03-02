import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function About() {
  const highlights = [
    {
      title: "Our Mission",
      copy: "Build recycling habits that feel rewarding through playful hardware and clear feedback loops.",
    },
    {
      title: "Connected Experience",
      copy: "A single account keeps track of every scan, every drop-off, and every EcoPoint you earn.",
    },
    {
      title: "Community Impact",
      copy: "Partner LGUs and campuses receive live dashboards that highlight collective waste reduction wins.",
    },
  ];

  const researchers = [
    {
      name: "Jana Louise C. Soriano",
      nickname: "Lowiii",
      position: "Project Manager/Automation Engineer",
      question: "What is your MANTRA in Life?",
      quote: "Kung ang Tinapay ay malamig, Matigas ang Kapeng tuyo",
      image: "/SampleImage-Face1.jpeg",
      image2: "/SampleImage-Face2.jpg",
    },
    {
      name: "Justine James S. Ibale",
      nickname: "Tatinnn",
      position: "Project Manager/System Integrator",
      question: "What is your MANTRA in Life?",
      quote: "Minsan na tayo'y kinalaban, dapat may ginagampanan",
      image: "/SampleImage-Face7.jpg",
      image2: "/SampleImage-Face8.jpg",
    },
    {
      name: "Jaydine C. Nuval",
      nickname: "Dine",
      position: "Front-End Developer",
      question: "What is your MANTRA in Life?",
      quote: "Kapag may maayos na ginagamit, kailangan natin itong makamit",
      image: "/SampleImage-Face3.jpg",
      image2: "/SampleImage-Face4.avif",
    },
    {
      name: "John Paul Elias",
      nickname: "John",
      position: "Back-End Developer",
      question: "What is your MANTRA in Life?",
      quote: "67",
      image: "/SampleImage-Face5.webp",
      image2: "/SampleImage-Face6.jpg",
    },
    {
      name: "Rodge Steven Jude D. Funtalba",
      nickname: "Steven",
      position: "Front-End Developer",
      question: "What is your MANTRA in Life?",
      quote: "Whenever we go to the start, it always begins",
      image: "/SampleImage-Face9.png",
      image2: "/SampleImage-Face10.jpg",
    },
  ];

  // PAGINATION
  const [activeIdx, setActiveIdx] = useState(0);
  const itemsPerPage = 1;
  const totalPages = Math.ceil(researchers.length / itemsPerPage);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % totalPages);
  };

  const previous = () => {
    setActiveIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <section
      id="about"
      className="scroll-mt-28 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/5 background-color"
    >
      <div className="max-w-5xl mx-auto space-y-10 text-center lg:text-left">
        <div className="space-y-4">
          <p className="text-3xl sm:text-5xl font-header uppercase tracking-[0.3em] text-color ">
            About EcoPoints
          </p>
          <h2 className="text-4xl sm:text-3xl font-bold text-color">
            A circular journey powered by smart rewards.
          </h2>
          <p className="text-color text-lg leading-relaxed font-body-regular">
            EcoPoints pairs reverse vending tech with a lightweight web portal
            so users can scan, redeem, and track progress without leaving the
            main page. This placeholder copy keeps the layout alive while the
            official copy is prepared.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="secondary-color border border-white/10 rounded-2xl p-6 text-left shadow-2xl"
            >
              <h3 className="text-2xl font-semibold text-color mb-2">
                {item.title}
              </h3>
              <p className="text-color text-base leading-relaxed">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
        {/* ABOUT US - RESEARCHERS */}
        {/* SAMPLE DESIGN #1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-10 space-y-8 sm:space-y-12 lg:space-y-12">
          {researchers.map((researchers, key) => (
            <div key={`${researchers.name}-${key}`}>
              {/* Container Contents */}
              <div className="flex-1 w-full hover:translate-y-4 hover:scale-110 transition-transform duration-500 ease-out">
                <div className="relative group">
                  {/* Outer Container */}
                  <div className="absolute inset-0 soft-sage-bg rounded-xl sm:rounded-2xl transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 lg:h-auto rounded-xl sm:rounded-2xl sm:p-6 lg:px-2 lg:py-2 overflow-hidden transition-shadow duration-300 ease-out shadow-2xl">
                    {/* Inner Container */}
                    <div className="relative group bg-gray-800/20 rounded-lg p-3 sm:p-4 lg:p-2">
                      <img
                        src={researchers.image}
                        alt={researchers.image}
                        className="inset-0 rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70 transition-transform duration-500 ease-out group-hover:scale-112 group-hover:opacity-0"
                      />
                      <img
                        src={researchers.image2}
                        alt={researchers.image2}
                        className="absolute inset-0 rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70 opacity-0 transition-transform duration-500 ease-out group-hover:scale-112 group-hover:opacity-100"
                      />
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                      <div className="flex-1 w-full">
                        {/* Name & Position */}
                        <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                          <h1 className="absolute text-4xl sm:text-3xl lg:text-4xl sour-gummy-body-600 mb-4 sm:mb-6 text-color opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:mt-2">
                            {researchers.nickname}
                          </h1>
                          <h1 className="text-4xl sm:text-3xl lg:text-2xl sour-gummy-body-600 mb-4 sm:mb-6 text-color group-hover:opacity-0">
                            {researchers.name}
                          </h1>

                          <p className="text-color sour-gummy-body-500 text-2xl sm:text-lg text-left opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                            {researchers.position}
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
        {/* SAMPLE DESIGN #2*/}
        <div className="">
          {researchers
            .slice(
              activeIdx * itemsPerPage,
              activeIdx * itemsPerPage + itemsPerPage,
            )
            .map((researchers, key) => (
              <div
                key={`${researchers.name}-${key}`}
                className="w-full hover:scale-90 transition-transform duration-500 ease-out"
              >
                <div className="relative flex group lg:grid lg:grid-cols-2 soft-sage-bg backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
                  {/* CONTAINER */}
                  {/* IMAGE SECTION */}
                  <div className="order-2">
                    <img
                      src={researchers.image}
                      alt={researchers.image}
                      className="rounded-md sm:w-250 sm:h-116 md:w-450 md:h-115 lg:w-150 lg:h-120 hover:scale-120 transition-transform duration-700 "
                    />
                  </div>
                  {/* NAME & POSITION */}
                  <div className="relative max-w-lg lg:text-left px-8 py-10 space-y-6">
                    <div className="relative h-[1rem] lg:h-[2rem]">
                      <h1 className="absolute inset-0 text-4xl sm:text-3xl lg:text-5xl chewy-regular text-color transition-all duration-500 ease-out group-hover:opacity-0">
                        {researchers.name}
                      </h1>
                      <h1 className="absolute inset-0 text-4xl sm:text-3xl lg:text-6xl chewy-regular text-color opacity-0 transition-opacity  duration-500 ease-out group-hover:opacity-100">
                        {researchers.nickname}
                      </h1>
                    </div>
                    <p className="text-color sour-gummy-body-500 sm:text-lg lg:text-xl leading-relaxed text-justify opacity-0 translate-y-2 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                      {researchers.position}
                    </p>
                    <p className="text-color sour-gummy-body-500 sm:text-lg lg:text-4xl leading-relaxed italic opacity-0 translate-y-2 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 ">
                      {'"'}
                      {researchers.quote}
                      {'"'}
                    </p>
                    <p className="text-color sour-gummy-body-500 sm:text-lg lg:text-3xl leading-relaxed translate-y-2 transition-all duration-500 group-hover:opacity-0">
                      {researchers.question}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        {/* NAVIGATION */}
        <div className="flex items-center justify-center gap-4 mb-8 cursor-pointer">
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
                className={`h-2 rounded-full transition-all duration-300  ${
                  idx === activeIdx ? "w-8 primary-color" : "w-2 primary-color"
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
    </section>
  );
}
