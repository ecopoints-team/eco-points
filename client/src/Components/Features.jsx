const features = [
  {
    title: "Vision System",
    description:
      "The prototype is equipped with intelligent sensors that act as its “eyes”. When you insert an item, the Vision System instantly scans and analyzes it to verify that it is a valid PET bottle and reject anything that says otherwise. This ensures that only recyclable materials are accepted and prevents non-plastic trash from contaminating the bin.",
    image: "/SampleImage-Features.webp",
    imageDetails: "Camera and Image Processing",
    imagePosition: "left",
  },
  {
    title: "User-Friendly Experience",
    description:
      "EcoPoints was designed with people in mind. From the height of the scanner to the clarity of the touchscreen instructions, every aspect follows ergonomic standards. The interface is simple, intuitive, and guides you through the recycling process in seconds, making it easy for students, faculty, and staff to use without any training.",
    image: "/SampleImage-Features-two.jpg",
    imageDetails: "User-Friendly",
    imagePosition: "left",
  },
  {
    title: "QR-Based User Authentication System",
    description:
      "Our system uses a secure Quick Response (QR) code technology for instant login. Every user gets a unique personal QR code on our website. Simply show this code to the machine’s scanner, and it immediately identifies you and opens your account, making the process touch-free and secure.",
    image: "/SampleImage-Features-three.webp",
    imageDetails: "QR-Code",
    imagePosition: "right",
  },
  {
    title: "Reverse Vending Machine (RVM)",
    description:
      "RVM is the...   Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rerum atque harum, illo impedit, libero nostrum error dicta ut, omnis reiciendis ipsam minima et culpa aliquid? Hic sunt ea earum. Tenetur?",
    image: "/SampleImage-Features-four.jpg",
    imageDetails: "RVM-Showcase",
    imagePosition: "right",
  },
  {
    title: "Web-Connected Rewards System",
    description:
      "The EcoPoints machine is fully IoT-enabled (Internet of Things). This means it is constantly connected to the internet. As soon as you recycle a bottle, the machine sends a signal to our cloud server, and your reward points are instantly updated on your web dashboard. You can check your balance from any device anytime and anywhere.",
    image: "/SampleImage-Features-five.png",
    imageDetails: "Rewards-Showcase",
    imagePosition: "right",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-16 sm:py-20 px-10 sm:px-6 lg:px-8 relative scroll-mt-28 background-color"
    >
      {/* Root Div */}
      <div className="max-w-6xl mx-auto">
        {/* LEAF BORDER LEFT  */}
        <div dir="ltr">
          <div className="absolute lg:start-0 lg:top-10 sm:top-12 sm:start-0 md:start-0 md:top-20">
            <img
              src="/Leaf-Border-Left.png"
              className="rounded-lg sm:w-60 sm:h-40 md:w-50 md:h-40 lg:w-130 lg:h-70"
            />
          </div>
        </div>
        {/* LEAF BORDER RIGHT */}
        <div dir="rtl">
          <div className="absolute lg:start-0 lg:top-8 sm:top-15 sm:start-0 md:start-0 md:top-20">
            <img
              src="/Leaf-Border-Right.png"
              className="rounded-lg sm:w-60 sm:h-40 md:w-50 md:h-40 lg:w-130 lg:h-70"
            />
          </div>
        </div>
        {/* UPPER HEADER */}
        <div className="static text-center font-header mb-12 sm:mb-16 lg:mb-20">
          {/* Text Content */}
          <h2 className="relative text-6xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
            <span className="text-color bg-clip-text text-transparent">
              Our Capstone
            </span>
            <br />
            <span className="text-color bg-clip-text text-transparent">
              {/* bg-gradient-to-b from-white to-white bg-clip-text text-transparent */}
              Machine Features!
            </span>
          </h2>
        </div>

        {/* PULSE BACKGROUND */}
        {/* Top Part */}
        {/* <div className="absolute top-75 right-4 sm:right-10 w-52 sm:w-62 h-52 sm:h-62 secondary-color rounded-full blur-2xl animate-pulse"></div> */}
        {/* <div className="absolute top-20 left-10 sm:left-10 w-64 sm:w-96 sm:h-64 sm:h-96 secondary-color rounded-full blur-2xl animate-pulse delay-1000"></div> */}

        {/* Bottom Part */}
        {/* <div className="absolute bottom-15 right-4 sm:right-10 w-64 sm:w-96 sm:h-64 sm:h-96 secondary-color rounded-full blur-3xl animate-pulse delay-1000"></div> */}

        <div className="space-y-16 sm:space-y-20 lg:space-y-32">
          {features.map((feature, key) => (
            <div
              key={`${feature.title}-${feature.imagePosition}-${key}`}
              className={`flex flex-col lg:flex-row items-center gap-8 sm:gap-12 ${
                feature.imagePosition === "right" ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Section */}
              <div className="flex-1 w-full transition-transform duration-300 hover:scale-110 overflow-hidden group-hover:shadow-2xl transition-shadow duration-300">
                <div className="relative group">
                  {/* Inner-Container (Image) */}
                  <div className="secondary-color rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                    {/* Pictures */}
                    <div>
                      {/* If mag lalagay ng Photo dito ilalagay */}
                      <img
                        src={feature.image}
                        alt={feature.image}
                        className="rounded-lg sm:w-200 sm:h-80 md:w-450 md:h-60 lg:w-150 lg:h-70"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* TEXT SECTION */}
              <div className="flex-1 w-full">
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <h3 className="text-4xl sm:text-3xl lg:text-4xl font-body-black mb-4 sm:mb-6 text-color">
                    {feature.title}
                  </h3>
                  <p className="text-shadow-lg text-color font-body-bold text-xl text-justify sm:text-lg leading-relaxed">
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
