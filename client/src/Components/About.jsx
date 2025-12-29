const highlights = [
  {
    title: "Our Mission",
    copy:
      "Build recycling habits that feel rewarding through playful hardware and clear feedback loops.",
  },
  {
    title: "Connected Experience",
    copy:
      "A single account keeps track of every scan, every drop-off, and every EcoPoint you earn.",
  },
  {
    title: "Community Impact",
    copy:
      "Partner LGUs and campuses receive live dashboards that highlight collective waste reduction wins.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="scroll-mt-28 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/5"
    >
      <div className="max-w-5xl mx-auto space-y-10 text-center lg:text-left">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            About EcoPoints
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            A circular journey powered by smart rewards.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            EcoPoints pairs reverse vending tech with a lightweight web portal so users can scan,
            redeem, and track progress without leaving the main page. This placeholder copy keeps
            the layout alive while the official copy is prepared.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-lime-950/40 border border-white/10 rounded-2xl p-6 text-left"
            >
              <h3 className="text-2xl font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-white/80 text-base leading-relaxed">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
