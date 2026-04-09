// Home Page
// Footer

"use client";

import { University } from "lucide-react";

export default function Footer() {
  const footerQuickLinks = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "How It Works",
      link: "How It Works",
    },
    {
      name: "Features",
      link: "Features",
    },
    {
      name: "Leaderboard",
      link: "Leaderboard",
    },
    {
      name: "Rewards",
      link: "Rewards",
    },
  ];

  const footerResources = [
    {
      name: "FAQs",
      link: "/FAQs",
    },
    {
      name: "Terms and Conditions",
      link: "/Terms and Conditions",
    },
    {
      name: "Documentation and Support",
      link: "/Documentation and Support",
    },
  ];

  const footerContactDetails = [
    {
      name: "Jana Louise C. Soriano",
      position: "Project Manager & Automation Engineer",
      personalEmail: "soriano.janalouise@gmail.com",
    },
    {
      name: "Justine James S. Ibale",
      position: "Project Manager & System Integrator",
      personalEmail: "ibalejustine03@gmail.com ",
    },
    {
      name: "John Paul D. Elias",
      position: "Backend Developer",
      personalEmail: "johnpaul.elias101@gmail.com ",
    },
    {
      name: "Jaydine C. Nuval",
      position: "Frontend Developer",
      personalEmail: "jaydinenuval@gmail.com ",
    },
    {
      name: "Rodge Steven Jude D. Funtalba",
      position: "Frontend Developer",
      personalEmail: "rodgestevenjude.funtalba@gmail.com",
    },
  ];

  const copyrightDetails = [
    {
      name: "Eco-Points",
      university: "Polytechnic University of the Philippines",
      year: new Date().getFullYear(),
    },
  ];

  return (
    <section className="">
      <div className="grid grid-cols-5 bg-lime-800 p-4">
        {/*  */}
        <div className="col-span-1">
          <img
            src="/Logo ELements (Light).png"
            className="h-auto w-auto p-16"
          />
        </div>
        {/* QUICK LINKS */}
        <div className="col-span-1">
          <div className="m-4">
            <h3 className="text-2xl font-bold text-amber-300">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {footerQuickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.link}
                    className="text-white text-lg hover:text-amber-300 hover:font-medium"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* RESOURCES */}
        <div className="col-span-1">
          <div className="m-4">
            <h3 className="text-2xl font-bold text-amber-300">Resources</h3>
            <ul className="mt-4 space-y-2">
              {footerResources.map((resource, index) => (
                <li key={index}>
                  <a
                    href={resource.link}
                    className="text-white text-lg hover:text-amber-300 hover:font-medium"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* CONTACT INFORMATION */}
        <div className="col-span-2">
          <div className="m-4">
            <h3 className="col-span-2 justify-self-center text-2xl font-bold text-amber-300">
              Contact Us
            </h3>

            <div className="justify-self-center">
              <ul className="mt-4 space-y-2 grid grid-cols-2 gap-2">
                {footerContactDetails.map((contact, index) => (
                  <li
                    key={index}
                    className={
                      index === 4 ? "col-span-2 m-4" : "col-span-1 m-4"
                    }
                  >
                    <p className="text-amber-300 text-lg font-bold">
                      {contact.name}
                    </p>
                    <p className="text-white text-sm">{contact.position}</p>
                    <p className="text-white text-sm">
                      {contact.personalEmail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* COPYRIGHT */}
        <div className="hr-line justify-self-center col-span-5" />
        <div className="justify-self-center col-span-5 m-4">
          <p className="text-white mt-4">
            &copy; {copyrightDetails[0].year} {copyrightDetails[0].name}. All
            rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
