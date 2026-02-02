import Link from "next/link";

export default function UserRewards() {
  return (
    <section
      id="userRewards"
      className="relative min-h-screen flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28 background-color"
    >
      {/* Grid #2 EXAMPLE CONTAINER */}
      <div className="relative order-2 w-full transition-transform duration-300">
        <div className="relative bg-gray-600/20 backdrop-blur-xl rounded-md sm:rounded-xl p-3 sm:p-4 shadow-2xl border border-white/10">
          {/* Container */}
          {/* Inside Container */}
          <div>
            {/* Header Text */}
            <h1 className="text-6xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold font-header mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-700 delay-100">
              <span className="text-shadow-lg accent-color-text bg-clip-text text-transparent block mb-1 sm:2 ">
                EcoPoints: Rewards
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-shadow-lg text-xl sm:text-base lg:text-2xl text-white text-justify max-w-2xl mx-auto font-body-bold lg:mx-0 mb-6 sm:mb-8 animate-in slide-in-from-bottom duration-700 delay-200 leading-relaxed">
              Earn rewards with EcoPoints. Just by simply recycling. Sign in or
              create an EcoPoints account and get points for School-Related
              rewards, Essentials, and more.
            </p>

            {/* BUTTONS Inside Grid #1 */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-3 mb:-8 sm:mb-12 animate-in slide-in-from-bottom duration-700 delay-300">
              <button className="group cursor-pointer w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 primary-color rounded-lg font-body-black text-sm sm:text-base transition-all duration-300 hover:scale-102 flex items-center justify-center space-x-2">
                <Link href="/userRewards">Start Earning EcoPoints</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
