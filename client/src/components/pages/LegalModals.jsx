"use client";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// ============================================================================
// TC_Modal — Terms & Conditions overlay
// Content sourced from LegalAgreements.md
// ============================================================================
export function TC_Modal({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Terms &amp; Conditions</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms and Conditions"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 text-sm text-slate-700 space-y-5 flex-1">
          <p className="text-slate-500 text-xs italic">
            EcoPoints: Development of A Low-cost Reverse Vending Machine Prototype with Web-Integrated Rewards System for PET Waste Management
          </p>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">1. Acceptance of Terms</h3>
            <p>By creating an account, accessing our web application, or depositing items into our connected RVM hardware, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">2. Description of Service</h3>
            <p>EcoPoints provides a cloud-based web application and connected hardware network designed to collect PET bottles and reward users with digital &quot;EcoPoints.&quot; The Service encompasses the web interface, the backend infrastructure, and the physical RVM prototypes deployed on campus.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">3. Account Registration and Security</h3>
            <p><span className="font-semibold">Eligibility:</span> Access to the Service is restricted to current students, faculty, and staff of PUP iTech.</p>
            <p><span className="font-semibold">Account Responsibility:</span> You are responsible for maintaining the confidentiality of your login credentials. You agree to notify the development team immediately of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your login information.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">4. The RVM Prototype and User Conduct</h3>
            <p><span className="font-semibold">Intended Use:</span> The RVM is designed strictly for the collection of empty, clean, and relatively uncrushed PET plastic beverage bottles up to a maximum capacity of 1-liter.</p>
            <p><span className="font-semibold">Prototype Status:</span> You acknowledge that the RVM and the web interface are experimental prototypes. They lack automated sanitation features and rely on continuous electrical power and stable network connectivity. They may experience downtime, bugs, or validation delays.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">5. Software License and Acceptable Use</h3>
            <p>We grant you a limited, non-exclusive, non-transferable, and revocable license to access the web application and interact with the RVM hardware for personal, non-commercial use. You agree <span className="font-semibold">NOT</span> to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Attempt to reverse-engineer, decompile, or hack the web application&apos;s source code, API, or database.</li>
              <li>Use automated scripts, scrapers, or bots to interact with the web platform.</li>
              <li>Tamper with the physical RVM hardware, internal sensors, or camera module to fraudulently generate EcoPoints.</li>
              <li>Insert trash, glass, aluminum cans, opaque plastics, liquids, or items exceeding the 1-liter capacity limit into the machine.</li>
              <li>Forcefully open or attempt to bypass the mechanical doors of the physical RVM hardware.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">6. EcoPoints System Currency</h3>
            <p><span className="font-semibold">No Cash Value:</span> &quot;EcoPoints&quot; are a digital metric created solely for this research project. They have no real-world monetary value, cannot be exchanged for cash, and cannot be transferred between users.</p>
            <p><span className="font-semibold">Adjustments:</span> The research team reserves the right to modify, reset, or revoke EcoPoints in the event of system errors, hardware manipulation, or upon the conclusion of the research period.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">7. Service Availability and &quot;As-Is&quot; Disclaimer</h3>
            <p>This Service is an experimental capstone prototype:</p>
            <p><span className="font-semibold">No Uptime Guarantee:</span> We do not guarantee that the web platform or the RVM hardware will be available 100% of the time. The Service may experience scheduled downtime, unexpected bugs, network latency, or physical hardware jams.</p>
            <p><span className="font-semibold">As-Is Provision:</span> The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We disclaim all warranties, express or implied, regarding the reliability or accuracy of the software and hardware.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">8. Intellectual Property</h3>
            <p>All rights, title, and interest in and to the Service—including the web application design, frontend components, backend architecture, AI models, hardware schematics, and branding—are the exclusive property of the capstone research team. Users are granted a limited, temporary license to interact with the system for the purpose of this study.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">9. Limitation of Liability</h3>
            <p>In no event shall the development team or the university be liable for any indirect, incidental, special, or consequential damages, including loss of data, arising out of your use or inability to use the web platform or the RVM hardware.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">10. Termination</h3>
            <p>We reserve the right to suspend or terminate your account and access to the Service at any time, at our sole discretion, without prior notice, if we determine you have violated these Terms of Service.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// PP_Modal — Privacy Policy overlay
// Content sourced from LegalAgreements.md
// ============================================================================
export function PP_Modal({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Privacy Policy</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Privacy Policy"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 text-sm text-slate-700 space-y-5 flex-1">
          <p className="text-slate-500 text-xs italic">
            Polytechnic University of the Philippines — Institute of Technology (PUP iTech)
          </p>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">1. Introduction</h3>
            <p>Welcome to our research project entitled: &quot;EcoPoints: Development of A Low-cost Reverse Vending Machine Prototype with Web-Integrated Rewards System for PET Waste Management&quot;. This Privacy Policy explains how we collect, use, and protect your personal information when you interact with our Reverse Vending Machine (RVM) prototype and its accompanying web portal. This project is conducted for academic research purposes at PUP iTech.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">2. Information We Collect</h3>
            <p>We collect the following types of information to facilitate the research and operate the RVM system:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="font-semibold">Personal Identification Data:</span> Full name, email address, university affiliation, and role (Student, Staff, or Faculty).</li>
              <li><span className="font-semibold">Research &amp; System Data:</span> Your EcoPoints balance, transaction history (e.g., number and frequency of PET bottles deposited), and timestamps of your interactions with the RVM.</li>
              <li><span className="font-semibold">Hardware Interaction Data:</span> Logs of your physical interactions with the RVM endpoints, including PET bottle deposit counts, visual classification data processed by our object detection model, and timestamps.</li>
              <li><span className="font-semibold">Service Usage &amp; Automated Data:</span> Standard log data including your IP address, browser type, device information, session duration, and how you interact with our web dashboard.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">3. How We Use Your Data</h3>
            <p>Your data is strictly used to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="font-semibold">Operate the Service:</span> Authenticate your account via QR code, maintain your secure session, and accurately sync your EcoPoints balance from the RVM hardware to the cloud database.</li>
              <li><span className="font-semibold">Reward Allocation:</span> Track and allocate EcoPoints accurately based on your RVM usage and display rankings on the system leaderboard.</li>
              <li><span className="font-semibold">Research &amp; Analytics:</span> Analyze user engagement, recycling metrics, and system performance to fulfill our research objectives and framework development.</li>
              <li><span className="font-semibold">Communication:</span> Reach out regarding your account, system updates, or research-related inquiries.</li>
              <li><span className="font-semibold">Platform Maintenance:</span> Monitor software performance, debug front-end web application errors, and prevent fraudulent activity.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800">4. Data Sharing and Security</h3>
            <p><span className="font-semibold">No Third-Party Sales:</span> We do not sell, rent, or lease your personal information to third parties. We only share data with trusted service providers who perform technical functions on our behalf (e.g., cloud database hosting and domain management). These third parties are bound by their own data security obligations.</p>
            <p><span className="font-semibold">Academic Use Only:</span> Data will only be shared with the immediate research team and advising faculty. Any data published in our final research paper or capstone defense will be anonymized and presented in aggregate form.</p>
            <p><span className="font-semibold">Security:</span> We implement standard security measures to protect the database housing your information. However, as this is an experimental prototype system, we cannot guarantee absolute data security.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">5. Data Retention</h3>
            <p>User accounts and associated personal data will be retained only for the duration necessary to complete the research, defend the capstone project, and finalize grading. Upon project conclusion, all direct identifiers will be purged from our databases, leaving only anonymized system metrics.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-800">6. Your Rights</h3>
            <p>You have the right to access the personal data held in our Service, request corrections to your account profile, or request the deletion of your account and associated data. To exercise these rights, contact us at:{' '}
              <a href="mailto:team8.ecopoints@gmail.com" className="text-emerald-600 underline hover:text-emerald-700">
                team8.ecopoints@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
