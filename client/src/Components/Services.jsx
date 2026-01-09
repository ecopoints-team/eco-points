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
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28"
    >
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="w-full hover:translate-y-2 transition-transform duration-300 hover:scale-102">
            <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
              <div className="backdrop-blur-sm rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5">
                {/* Container */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    {/* Three Circles */}
                    {/* <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-300" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600" />
                    </div> */}
                    <span className="text-cs font-medium sm:text-sm text-white"></span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                {/* IMAGE SECTION */}
                <div className="pt-4 sm:pt-8 px-2 sm:px-2 lg:px-4">
                  <img src="/StockPhoto.webp" />
                </div>
              </div>
            </div>
          </div>
          {/* Floating Cards */}
          {/* Grid #1 */}
          <div>
            {/* Header Text */}
            <h1 className="text-5xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-header mb-4 sm:mb-6">
              <span className="font-bold bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2">
                Services
              </span>
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2"></span>
              <span className="font-bold bg-gradient-to-r from-orange-400 via-amber-400 bg-clip-text text-transparent block mb-1 sm:2">
                on EcoPoints
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-md sm:text-base lg:text-lg text-white text-justify max-w-2xl mx-auto lg:mx-0 font-body-regular mb-6 sm:mb-8">
              We offer a bunch of services including rewards blah blah. Lorem
              ipsum, dolor sit amet consectetur adipisicing elit. Illo error eos
              nisi, provident modi quidem amet ab eum voluptas numquam debitis,
              sunt quaerat in incidunt, repellat fuga. Maiores, harum aut.
            </p>
            {/* Button */}
            <div className="flex flex-row items-center justify-center mt-4 sm:mt-6 lg:mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 ">
                <Link
                  href="/rewards"
                  className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-bl from-amber-400 to-orange-600 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-110 hover:border text-center"
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
