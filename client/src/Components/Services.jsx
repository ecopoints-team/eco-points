import { ArrowRight, Play, ChevronDown, ImagePlay } from "lucide-react";

// const services = [
//   {
//     title: "",
//     description: "",
//     image: "",
//     imagePosition: "left",
//   },
// ];

export default function Services() {
  const rewardsDomain =
    process.env.NEXT_PUBLIC_REWARDS_DOMAIN ?? "https://rewards.ecopoints.com";
  return (
    <section
      id="services"
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28"
    >
      <div className="max-w-7xl mx-auto text-center relative w-full">
        {/* HEADER TEXT */}
        <div className="max-w-7xl mx-auto flex flex-row lg:grid lg:grid-row-2 text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          <h1 className="text-3xl sm:text-4xl md:text-3xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            <span>Questions About Our Services?</span>
          </h1>
          {/* CONTENT */}
          <div>
            <div>
              <div className="relative order-2 w-full">
                <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/10">
                  <div className="backdrop-blur-sm rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5">
                    {/* Container  */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        {/* Three Circles */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
                        </div>
                        <span className="text-cs font-medium sm:text-sm text-white"></span>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Button */}
                <div className="flex flex-row items-center justify-center mt-4 sm:mt-6 lg:mt-10">
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 ">
                    <a
                      href="#about"
                      className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-bl from-amber-400 to-orange-600 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-110 hover:border text-center"
                    >
                      Learn More About Us
                    </a>
                    <a
                      href={rewardsDomain}
                      target="_blank">
                      rewards.ecopoints.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
