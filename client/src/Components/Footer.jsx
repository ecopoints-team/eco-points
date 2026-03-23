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

export default function Footer() {
  return (
    <section
      id="footer"
      className="soft-sage-bg relative flex item-center justify-center pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-28"
    >
      <div className="flex flex-row lg:grid lg:grid-row-3">
        <div className="flex flex-cols lg:grid lg:grid-cols-4 lg:px-6 lg:py-6 lg:space-x-10 lg:space-y-10 lg:mt-10">
          {/* LOGO AREA */}
          <div className="order-1">
            {" "}
            <img
              src="/EcoPoints Logo Mark with Name (Light Version).png"
              className="lg:w-60 lg:h-auto mb-2 transition-transform duration-500 hover:cursor-pointer hover:scale-110"
            />
            <p className="sour-gummy-body-300 text-color">
              A smart recycling initiative powered by technology and
              sustainability.
            </p>
          </div>
          {/* QUICK LINKS */}
          <div className="order-2">
            <ul className="lg:space-y-4">
              {/* HEADER */}
              <li>
                <h1 className="chewy-regular text-3xl text-color">
                  QUICK LINKS
                </h1>
              </li>
              {/* CONTENT */}
              <ul className="list-none space-y-3 uppercase sour-gummy-body text-xl text-color">
                {[
                  "Home",
                  "Features",
                  "Services",
                  "Showcase",
                  "Leaderboard",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      className="no-underline hover:text-[#e67e22] transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </ul>
          </div>
          {/* RESOURCES */}
          <div className="order-3 ">
            <ul className="lg:space-y-4">
              {/* HEADER */}
              <li>
                <h1 className="chewy-regular text-3xl text-color">RESOURCES</h1>
              </li>
              {/* CONTENT */}
              <ul className="list-none space-y-3 uppercase sour-gummy-body text-xl text-color">
                {[
                  "About Us",
                  "FAQs",
                  "Documentation",
                  "Research Paper",
                  "Support Us",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      className="no-underline hover:text-[#e67e22] transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </ul>
          </div>
          {/* CONTACT */}
          <div className="order-4 lg:grid lg:grid-row-3">
            <ul className="lg:space-y-4 text-color">
              <li>
                <h1 className="chewy-regular text-2xl text-color">CONTACT</h1>
              </li>
              <li className="sour-gummy-body text-2xl">
                <h1>PUP Mabini Campus, Manila</h1>
              </li>
              <li className="sour-gummy-body text-xl">
                <h1>team8.ecopoints@gmail.com</h1>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex order-2 justify-center">
          <hr className="hr-line"></hr>
        </div>
        <div className="flex order-3 justify-center lg:px-10 lg:py-10 sour-gummy-body text-xl text-color">
          <h1>
            © 2025 EcoPoints. A PUP Institute of Technology Research Project.
          </h1>
        </div>
      </div>
    </section>
  );
}
