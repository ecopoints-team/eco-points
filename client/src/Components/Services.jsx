import Link from "next/link";
import { ChevronDown } from "lucide-react";

// const services = [
//   {
//     title: "",
//     description: "",
//     image: "",
//     imagePosition: "left",
//   },
// ];

export default function Services() {
  return (
    <section
      id="services"
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28 background-color"
    >
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="w-full hover:translate-y-2 transition-transform duration-300 hover:scale-102">
            <div className="relative primary-color backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
              {/* h-[280px] sm:h-[350px] lg:h-[450px] */}
              {/* Container */}
              {/* IMAGE SECTION */}
              <div className="">
                <img
                  src="/SampleReward-Stickers.jpg"
                  className="rounded-md sm:w-250 sm:h-116 md:w-450 md:h-115 lg:w-150 lg:h-140"
                />
              </div>
            </div>
          </div>
          {/* Floating Cards */}
          {/* Grid #1 */}
          <div>
            {/* Header Text */}
            <h1 className="sm:text-5xl md:text-5xl lg:text-6xl font-header lg:mb-4 sm:mb-6">
              <span className="text-color bg-clip-text text-transparent">
                Services on EcoPoints
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-md sm:text-base lg:text-lg text-color font-body-bold text-justify max-w-2xl mx-auto lg:mx-0 font-body-regular mb-6 sm:mb-8">
              We offer a bunch of services including rewards blah blah. Lorem
              ipsum, dolor sit amet consectetur adipisicing elit. Illo error eos
              nisi, provident modi quidem amet ab eum voluptas numquam debitis,
              sunt quaerat in incidunt, repellat fuga. Maiores, harum aut.
            </p>
            {/* Button */}
            <div className="flex flex-row items-center justify-center mt-4 sm:mt-6 lg:mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 lg:mb-8 sm:mb-12 ">
                <Link
                  href="/rewards"
                  className="group w-full shadow-lg sm:w-auto px-6 sm:px-8 py-3 sm:py-4 primary-color rounded-lg font-body-black hover:scale-115 text-center transition-all duration-500"
                >
                  Continue to Rewards
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
