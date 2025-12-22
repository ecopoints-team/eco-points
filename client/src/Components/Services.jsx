import { ArrowRight, Play, ChevronDown, ImagePlay } from "lucide-react";

const services = [
  {
    title: "",
    description: "",
    image: "",
    imagePosition: "left",
  },
];
export default function Services() {
  return (
    <section
      id="services"
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto text-center relative w-full">
        {/* HEADER TEXT */}
        <div className="max-w-7xl mx-auto flex flex-row lg:grid lg:grid-row-2 text-center gap-6 sm:gap-8 lg:gap-12 items-center relative">
          <h1 className="text-3xl sm:text-4xl md:text-3xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            <span>Services? You want? You get...</span>
          </h1>
          {/* CONTENT */}
          <div>
            <div>
              <div className="relative order-2 w-full hover:translate-y-2 transition-transform duration-300 hover:scale-102">
                <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10">
                  <div className="backdrop-blur-sm rounded-lg overflow-hidden h-[280px] sm:h-[350px] lg:h-[450px] border border-white/5">
                    {/* Container  */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-cs font-medium sm:text-sm text-white"></span>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Button */}
                <div className="flex flex-row items-center justify-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 ">
                    <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-b from-green-400 to-orange-600 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-102 flex items-center justify-center space-x-2">
                      <div>Tanga Ka Ba? Pindutin mo na~</div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </button>

                    <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-white/10 flex items-center justify-center space-x-2">
                      <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 duration-300 transition-colors">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      </div>
                      <span>Tanga Ka (Watch)</span>
                    </button>
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
