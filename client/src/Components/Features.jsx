const features = [
  {
    title: "Vision System",
    description:
      "The prototype is equipped with intelligent sensors that act as its “eyes”. When you insert an item, the Vision System instantly scans and analyzes it to verify that it is a valid PET bottle and reject anything that says otherwise. This ensures that only recyclable materials are accepted and prevents non-plastic trash from contaminating the bin.",
    image: "Camera and Image Processing",
    imagePosition: "left",
  },
  {
    title: "User-Friendly Experience",
    description:
      "EcoPoints was designed with people in mind. From the height of the scanner to the clarity of the touchscreen instructions, every aspect follows ergonomic standards. The interface is simple, intuitive, and guides you through the recycling process in seconds, making it easy for students, faculty, and staff to use without any training.",
    image: "User-Friendly",
    imagePosition: "left",
  },
  {
    title: "QR-Based User Authentication System",
    description:
      "Our system uses a secure Quick Response (QR) code technology for instant login. Every user gets a unique personal QR code on our website. Simply show this code to the machine’s scanner, and it immediately identifies you and opens your account, making the process touch-free and secure.",
    image: "QR-Code",
    imagePosition: "right",
  },
  {
    title: "Reverse Vending Machine (RVM)",
    description:
      "RVM is the...   Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rerum atque harum, illo impedit, libero nostrum error dicta ut, omnis reiciendis ipsam minima et culpa aliquid? Hic sunt ea earum. Tenetur?",
    image: "RVM-Showcase",
    imagePosition: "right",
  },
  {
    title: "Web-Connected Rewards System",
    description:
      "The EcoPoints machine is fully IoT-enabled (Internet of Things). This means it is constantly connected to the internet. As soon as you recycle a bottle, the machine sends a signal to our cloud server, and your reward points are instantly updated on your web dashboard. You can check your balance from any device anytime and anywhere.",
    image: "Rewards-Showcase",
    imagePosition: "right",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-16 sm:py-20 px-10 sm:px-6 lg:px-8 relative scroll-mt-28"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center font-header mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="bg-gradient-to-b from-white to-white bg-clip-text text-transparent">
              Our Capstone
            </span>
            <br />
            <span className="bg-gradient-to-tl from-orange-400 via-amber-400  bg-clip-text text-transparent">
              {/* bg-gradient-to-b from-white to-white bg-clip-text text-transparent */}
              Machine Features!
            </span>
          </h2>
        </div>

        {/* PULSE BACKGROUND */}
        {/* Top Part */}
        <div className="absolute top-75 right-4 sm:right-10 w-48 sm:w-72 h-48 sm: h-72 accent-color-background rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-15 left-10 sm:left-10 w-64 sm:w-96 sm:h-64 sm:h-96 accent-color-background rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Bottom Part */}
        <div className="absolute bottom-15 right-4 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 accent-color-background rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* <div className="absolute bottom-75 left-10 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 accent-color-background rounded-full blur-3xl animate-pulse"></div> */}

        <div className="space-y-16 sm:space-y-20 lg:space-y-32">
          {features.map((feature, key) => (
            <div
              key={`${feature.title}-${feature.imagePosition}-${key}`}
              className={`flex flex-col lg:flex-row items-center gap-8 sm:gap-12 ${
                feature.imagePosition === "right" ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Section */}
              <div className="flex-1 w-full hover:translate-y-5 transition-transform duration-300 hover:scale-110">
                <div className="relative group">
                  {/* Outer-Container */}
                  <div className="absolute inset-0 accent-color-background rounded-xl sm:rounded-2xl transition-all duration-500" />
                  <div className="relative bg-white/20 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden group-hover:shadow-2xl transition-shadow duration-300">
                    {/* Inner-Container (Image) */}
                    <div className="bg-gray-900/20 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm ">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4">
                        {/* <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-300" />
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600" />
                        </div> */}
                        <span className="text-white ml-2 sm:ml-4 text-cs sm:text-sm">
                          {feature.title}
                        </span>
                      </div>
                      {/* <div>
                            If mag lalagay ng Photo dito ilalagay       
                        </div> */}
                    </div>
                  </div>
                </div>
              </div>
              {/* TEXT SECTION */}
              <div className="flex-1 w-full">
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <h3 className="text-4xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-white text-base text-xl text-justify sm:text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
