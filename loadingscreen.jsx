import React, { useState, useEffect } from "react";

export default function App() {
  const [progress, setProgress] = useState(0);
  const logoUrl = encodeURI("Logo Elements (Light).png");

  // Simulate a realistic, variable-speed loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Randomize the loading step to feel like real data fetching
        const step = Math.random() * 3 + 0.5;
        return Math.min(prev + step, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Map 0-100 progress to the CSS "top" percentage of the wave shapes
  // 120% means water starts at the very bottom. -10% means water fully covers the circle perfectly.
  const waterLevel = 120 - (progress * 1.3);

  return (
    <div className="min-h-screen bg-[#FDF9F1] flex flex-col items-center justify-center font-sans relative overflow-hidden">

      {/* REQUIRED CUSTOM ANIMATIONS */}
      <style>{`
        @keyframes spin-wave {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-wave-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* COMPOSITION WRAPPER */}
      <div className="relative flex flex-col items-center z-10 w-full max-w-sm">

        {/* Outer Ambient Glow */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5fb0a2]/20 rounded-full blur-[60px] animate-pulse -z-10" />

        {/* --- ENHANCED HOLE & POP OUT LOGO --- */}
        <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px] mb-16 mt-16">

          {/* BACK WALL & BORDER (The Hole) */}
          <div className="absolute inset-0 rounded-full border-[8px] border-white/80 bg-white/40 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_15px_25px_rgba(0,0,0,0.05)] overflow-hidden">

            {/* THE WATER (Filling up inside the hole) */}
            <div
              className="absolute left-0 w-full h-[600px] transition-all duration-[800ms] ease-out z-10"
              style={{ top: `${waterLevel}%` }}
            >
              {/* Back Wave */}
              <div className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] rounded-[43%] bg-[#7ec5b9]/70 animate-[spin-wave_7s_linear_infinite] origin-center" />

              {/* Middle Wave */}
              <div className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] rounded-[40%] bg-[#5fb0a2]/80 mix-blend-multiply animate-[spin-wave-reverse_5s_linear_infinite] origin-center mt-[10px]" />

              {/* Front Wave (Fastest, Primary Color) */}
              <div className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] rounded-[45%] bg-gradient-to-t from-[#439c8e] to-[#60b6a8] animate-[spin-wave_3.5s_linear_infinite] origin-center mt-[20px]" />

              {/* Solid water body below the waves (in case the element goes too deep) */}
              <div className="absolute left-0 w-full h-[600px] top-[500px] bg-[#439c8e]" />

            </div>

            {/* Inner Tank Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-black/10 mix-blend-overlay z-20 pointer-events-none" />
          </div>

          {/* --- THE POP OUT LOGO MASK --- */}
          {/* This mask aligns perfectly with the inner border (8px inset) and clips the bottom curve,
               but extends infinitely upwards so the logo can break out of the top! */}
          <div className="absolute left-[8px] right-[8px] bottom-[8px] h-[600px] rounded-b-full overflow-hidden pointer-events-none z-30">
            {/* Inner container to map dimensions back to the circle size */}
            <div className="absolute bottom-0 left-0 w-full h-[204px] md:h-[244px]">
              <img
                src={logoUrl}
                className="absolute z-30 object-contain left-1/2 -translate-x-1/2 transition-all duration-[600ms] ease-out animate-[float-up_4s_ease-in-out_infinite]"
                style={{
                  height: `${100 + (progress * 0.4)}%`,   // Starts at 100%, grows to 140% to stick out of the top
                  bottom: `${-120 + (progress * 1.0)}%`,  // Starts fully submerged, ends at -20% to hide the flat bottom
                  opacity: Math.min(progress * 0.05, 1), // Swift fade-in
                  mixBlendMode: "multiply", // Hides the background of the image
                  filter: "brightness(1.15) contrast(1.2)", // Forces the grey card background to pure white to become completely transparent
                }}
                alt="Logo Popping Out"
              />
            </div>
          </div>

          {/* 3D Depth overlay (transparent but adds subtle depth curve) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/5 pointer-events-none z-40 mix-blend-overlay" />
        </div>

      </div>
    </div>
  );
}
