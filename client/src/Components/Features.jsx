import { List } from "lucide-react";

const features = [
  {
    title: "Vision System",
    listFeatures: [
      "The prototype is equipped with intelligent sensors that act as its “Eyes”",
      "Scans and Analyzes to verify that it is a valid PET bottle and reject anything that says otherwise.",
      "This ensures that only recyclable materials are accepted and prevents non-plastic trash from contaminating the bin.",
    ],
    // description:
    //   "The prototype is equipped with intelligent sensors that act as its “Eyes”",
    // description2:
    //   "Scans and Analyzes to verify that it is a valid PET bottle and reject anything that says otherwise.",
    // description3:
    //   "This ensures that only recyclable materials are accepted and prevents non-plastic trash from contaminating the bin.",
    image: "/SampleImage-Features.webp",
    imageDetails: "Camera and Image Processing",
    imagePosition: "left",
  },
  {
    title: "User-Friendly Experience",
    listFeatures: [
      "EcoPoints was designed with people in mind. From the height of the scanner to the clarity of the touchscreen instructions, every aspect follows ergonomic standards.",
      "Interface is Simple, and Intuitive, and guides you through the recycling process in seconds, making it easy for students, faculty, and staff to use without any training.",
    ],
    description:
      "EcoPoints was designed with people in mind. From the height of the scanner to the clarity of the touchscreen instructions, every aspect follows ergonomic standards. The interface is simple, intuitive, and guides you through the recycling process in seconds, making it easy for students, faculty, and staff to use without any training.",
    image: "/SampleImage-Features-two.jpg",
    imageDetails: "User-Friendly",
    imagePosition: "left",
  },
  {
    title: "QR-Based User Authentication System",
    listFeatures: [
      "Our system uses a secure Quick Response (QR) code technology for instant login. Every user gets a unique personal QR code on our website. ",
      "Simply show this code to the machine’s scanner, and it immediately identifies you and opens your account, making the process touch-free and secure.",
    ],
    description:
      "Our system uses a secure Quick Response (QR) code technology for instant login. Every user gets a unique personal QR code on our website. Simply show this code to the machine’s scanner, and it immediately identifies you and opens your account, making the process touch-free and secure.",
    image: "/SampleImage-Features-three.webp",
    imageDetails: "QR-Code",
    imagePosition: "right",
  },
  {
    title: "Reverse Vending Machine (RVM)",
    listFeatures: [
      "Acts as an autonomous collection point capable of identifying valid PET materials and rejecting contaminants.",
      "Equipped with an industrial-grade internal compactor",
      "Efficiently reduces bottle volume to maximize storage",
      "Scalable and technology-driven alternative to manual waste sorting.",
    ],
    description:
      "EcoPoints redefines recycling through an automated, hardware-integrated solution. Our Reverse Vending Machine (RVM) acts as an autonomous collection point capable of identifying valid PET materials and rejecting contaminants. Equipped with an industrial-grade internal compactor, the unit efficiently reduces bottle volume to maximize storage, offering a scalable and technology-driven alternative to manual waste sorting.",
    image: "/SampleImage-Features-four.jpg",
    imageDetails: "RVM-Showcase",
    imagePosition: "right",
  },
  {
    title: "Web-Connected Rewards System",
    listFeatures: [
      "The EcoPoints machine is fully IoT-enabled (Internet of Things). This means it is constantly connected to the internet.",
      "As soon as you recycle a bottle, the machine sends a signal to our cloud server, and your reward points are instantly updated on your web dashboard.",
      "You can check your balance from any device anytime and anywhere.",
    ],
    description:
      "The EcoPoints machine is fully IoT-enabled (Internet of Things). This means it is constantly connected to the internet. As soon as you recycle a bottle, the machine sends a signal to our cloud server, and your reward points are instantly updated on your web dashboard. You can check your balance from any device anytime and anywhere.",
    image: "/SampleImage-Features-five.png",
    imageDetails: "Rewards-Showcase",
    imagePosition: "right",
  },
];
export default function Features() {
  // UNORDERED LIST FOR FEATURES
  const listDescription = features.filter(
    (features) => features.description === "listFeatures",
  );
  const listFeatures = listDescription.map((features) => (
    <li key={index}>
      <p className="text-shadow-lg text-color font-body-bold text-xl text-justify sm:text-lg leading-relaxed">
        <b>{features.description}</b>
        {"" + features.description2 + ""}
        {"" + features.description3 + ""}
      </p>
    </li>
  ));
  return (
    <section
      id="features"
      className="py-16 sm:py-20 px-10 sm:px-6 lg:px-8 relative -mt-12 scroll-mt-12 deep-forest-bg"
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
          <h2 className="relative chewy-regular text-6xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6">
            <span className="accent-color-text bg-clip-text text-transparent">
              Our Capstone
            </span>
            <br />
            <span className="accent-color-text bg-clip-text text-transparent">
              {/* bg-gradient-to-b from-white to-white bg-clip-text text-transparent */}
              Machine Features!
            </span>
          </h2>
        </div>
        {/* FEATURES SECTION */}
        <div className="space-y-16 sm:space-y-20 lg:space-y-32">
          {features.map((feature, key) => (
            <div
              key={`${feature.title}-${feature.imagePosition}-${key}`}
              className={`flex flex-col lg:flex-row items-center gap-8 sm:gap-12 ${
                feature.imagePosition === "right" ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Section */}
              <div className="flex w-full transition-transform duration-300 overflow-hidden shadow-2xl transition-shadow duration-300">
                <div className="relative group">
                  {/* Inner-Container (Image) */}
                  <div className="soft-sage-bg rounded-lg p-2 sm:text-sm ">
                    {/* Pictures */}
                    <div>
                      {/* If mag lalagay ng Photo dito ilalagay */}
                      <img
                        src={feature.image}
                        alt={feature.image}
                        className="rounded-lg hover:rotate-6 hover:scale-130 hover:rounded-lg transition-transform duration-500 sm:w-200 sm:h-80 md:w-450 md:h-60 lg:w-150 lg:h-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* TEXT SECTION */}
              <div className="flex w-full">
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  {/* TITLE */}
                  <h3 className="text-4xl sm:text-3xl lg:text-5xl sour-gummy-body-600 mb-4 sm:mb-6 accent-color-text">
                    {feature.title}
                  </h3>
                  {/* DESCRIPTION */}
                  <ul className="list-disc pl-0 marker:[accent-color-text] marker:text-2xl sm:space-y-6 md:space-y-6 lg:space-x-auto lg:space-y-6">
                    {feature.listFeatures?.map((item, index) => (
                      <li
                        key={index}
                        className="text-white sour-gummy-body-600 text-justify text-xl sm:text-lg lg:text-lg leading-relaxed transition-transform duration-500"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
