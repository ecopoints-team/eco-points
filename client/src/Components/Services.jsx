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
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-10 background-color"
    >
      {/* CIRCUIT-LINE BORDER LEFT  */}
      <div dir="ltr">
        <div className="absolute lg:start-0 lg:top-10 sm:top-12 sm:start-0 md:start-0 md:top-20">
          <img
            src="/SampleBorder(Circuit-Line-Left).png"
            className="rounded-lg sm:opacity-0 md:opacity-0 lg:w-130 lg:h-70"
          />
        </div>
      </div>
      {/* CIRCUIT-LINE BORDER RIGHT */}
      <div dir="rtl">
        <div className="absolute lg:start-0 lg:top-0 sm:top-15 sm:start-0 md:start-0 md:top-20">
          <img
            src="/SampleBorder(Circuit-Line-Right).png"
            className="rounded-lg sm:opacity-0 md:opacity-0 lg:w-130 lg:h-70"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="w-full hover:scale-90 transition-transform delay-300 duration-500">
            <div className="relative soft-sage-bg backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              {/* h-[280px] sm:h-[350px] lg:h-[450px] */}
              {/* Container */}
              {/* IMAGE SECTION */}
              <div className="">
                <img
                  src="/SampleReward-Stickers.jpg"
                  className="rounded-md sm:w-250 sm:h-116 md:w-450 md:h-115 lg:w-150 lg:h-140 hover:scale-110 transition-transform  duration-700"
                />
              </div>
            </div>
          </div>
          {/* Floating Cards */}
          {/* Grid #1 */}
          <div>
            {/* Header Text */}
            <h1 className="sm:text-5xl md:text-5xl lg:text-7xl chewy-regular lg:mb-4 sm:mb-6">
              <span className="text-color bg-clip-text text-transparent">
                Services on EcoPoints
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-md sm:text-base lg:text-2xl text-color sour-gummy-body-500 text-justify max-w-2xl mx-auto lg:mx-0 font-body-regular mb-6 sm:mb-8">
              We offer a bunch of services including rewards blah blah. Lorem
              ipsum, dolor sit amet consectetur adipisicing elit. Illo error eos
              nisi, provident modi quidem amet ab eum voluptas numquam debitis,
              sunt quaerat in incidunt, repellat fuga. Maiores, harum aut.
            </p>
            {/* Button */}
            <div className="flex items-center justify-center mt-4 sm:mt-6 lg:mt-10 ">
              <div className="items-center justify-center lg:justify-start sour-gummy-body-600 sm:text-base lg:text-xl gap-3 sm:gap-3 lg:mb-8 sm:mb-12 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-center soft-sage-bg hover:scale-110 hover:deep-forest-bg hover:underline hover:cursor-pointer transition-transform duration-300 ease-in-out ">
                <Link href="/rewards" className="">
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
