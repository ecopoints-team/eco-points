import Link from "next/link";
export default function Services() {
  return (
    <section
      id="services"
      className="relative min-h-screen background-color flex item-center justify-center sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-10 background-color"
    >
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 text-center text-left gap-6 sm:gap-8 lg:gap-12 items-center relative">
          {/* Grid #2 EXAMPLE CONTAINER */}
          <div className="w-full hover:scale-90 transition-transform delay-300 duration-500">
            {/* Container */}
            {/* IMAGE SECTION */}
            <div className="">
              <img
                src="/SampleReward-Stickers.jpg"
                className="rounded-md sm:w-250 sm:h-116 md:w-450 md:h-115 lg:w-150 lg:h-110 hover:scale-110 transition-transform  duration-700"
              />
            </div>
          </div>
          {/* Floating Cards */}
          {/* Grid #1 */}
          <div>
            {/* Header Text */}
            <h1 className="flex justify-center sm:text-5xl md:text-5xl lg:text-6xl chewy-regular">
              <span className="text-color bg-clip-text text-transparent">
                Services on EcoPoints
              </span>
            </h1>
            {/* Content Text */}
            <p className="text-md sm:text-base lg:text-lg text-color sour-gummy-body-500 text-center max-w-2xl mx-auto lg:mx-0">
              We offer a bunch of services including rewards blah blah. Lorem
              ipsum, dolor sit amet consectetur adipisicing elit. Illo error eos
              nisi, provident modi quidem amet ab eum voluptas numquam debitis,
              sunt quaerat in incidunt, repellat fuga. Maiores, harum aut.
            </p>
            {/* Button */}
            <div className="flex items-center justify-center mt-4 sm:mt-6 lg:mt-10 ">
              <div className="text-color items-center justify-center lg:justify-start sour-gummy-body-600 sm:text-base lg:text-xl gap-3 sm:gap-3 w-full sm:w-auto p-6 rounded-lg text-center accent-color-background transition-transform duration-300 ease-in-out hover:scale-110 hover:border hover:cursor-pointer">
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
