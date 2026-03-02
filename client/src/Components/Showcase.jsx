import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Rewards() {
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
    <section
      id="showcase"
      className="relative min-h-screen flex items-center justify-center pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28 background-color"
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Text Content */}
        <div className="text-center mb-2 sm:mb-6 lg:mb-10">
          <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6">
            <span className="chewy-regular text-color bg-clip-text text-transparent">
              Have{" "}
              <span className="text-color bg-clip-text text-transparent">
                {" "}
                EcoPoints{" "}
              </span>{" "}
              in your Account?
            </span>
            <br />
          </h2>
          <p>
            <span className="text-3xl sm:text-2xl md:text-2xl lg:text-4xl sour-gummy-body-300 text-color mb-2 sm:mb-4">
              Here are some Rewards you can Redeem!
            </span>
          </p>
        </div>
        {/* Containers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-10 space-y-8 sm:space-y-12 lg:space-y-12">
          {features
            .slice(
              activeIdx * itemsPerPage,
              activeIdx * itemsPerPage + itemsPerPage,
            )
            .map((feature, key) => (
              <div key={`${feature.title}-${key}`}>
                {/* Container Contents */}
                <div className="flex-1 w-full hover:translate-y-4 hover:scale-110 transition-transform duration-500 ease-out">
                  <div className="relative group">
                    {/* Outer Container */}
                    <div className="absolute inset-0 soft-sage-bg rounded-xl sm:rounded-2xl transition-opacity duration-300 group-hover:opacity-70" />
                    <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 lg:h-auto rounded-xl sm:rounded-2xl sm:p-6 lg:px-2 lg:py-2 overflow-hidden transition-shadow duration-300 ease-out group-hover:border-orange-400 group-hover:shadow-2xl">
                      {/* Inner Container */}
                      <div className="relative group bg-gray-800/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                        <img
                          src={feature.image}
                          alt={feature.image}
                          className="rounded-lg sm:w-80 sm:h-60 md:w-450 md:h-60 lg:w-120 lg:h-70 transition-transform duration-500 ease-out group-hover:scale-110 "
                        />
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                        <div className="flex-1 w-full">
                          {/* Title & Description */}
                          <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                            <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-color">
                              {feature.title}
                            </h3>
                            <p className="text-color text-base text-xl sm:text-lg leading-relaxed text-justify opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
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
        {/* Navigation */}
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
