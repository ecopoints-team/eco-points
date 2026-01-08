export default function Rewards() {
  const features = [
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "left",
    },
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "left",
    },
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "right",
    },
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "right",
    },
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "right",
    },
    {
      title: "OMNIMAN",
      description: "",
      image: "/Omniman.jpg",
      imagePosition: "right",
    },
  ];

  return (
    <section 
      id="showcase" 
      className="relative min-h-screen flex item-center justify-center pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28">
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="bg-gradient-to-b from-white to-white bg-clip-text text-transparent">
              Have <span className="bg-gradient-to-tr from-amber-500 via-amber-600 bg-clip-text text-transparent"> EcoPoints </span> in your Account?
            </span>
            <br />
          </h2>
          <p>
            <span className="text-3xl sm:text-2xl md:text-2xl lg:text-4xl font-light mb-2 sm:mb-4">
              Here are some Rewards you can Redeem!
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-10 space-y-8 sm:space-y-12 lg:space-y-12">
          {features.map((feature, key) => (
            <div key={`${feature.title}-${key}`}>
              <div className="flex-1 w-full hover:translate-y-2 transition-transform duration-500 hover:scale-105 transition-transform duration-500 hover:translate-x-1">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gray-600/20 rounded-xl sm:rounded-2xl transition-all duration-500" />
                  <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden group-hover:border-1 group-hover:border-orange-500 transition">
                    <div className="relative group bg-gray-900/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm ">
                      <img src={feature.image} alt={feature.image} />
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4"></div>
                      <div className="flex-1 w-full">
                        <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                          <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">
                            {feature.title}
                          </h3>
                          <p className="text-white text-base text-xl sm:text-lg leading-relaxed">
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
      </div>
    </section>
  );
}