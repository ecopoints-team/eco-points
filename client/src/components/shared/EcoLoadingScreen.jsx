"use client";
import { useState, useEffect, useRef } from "react";

/**
 * EcoLoadingScreen — Full-screen water-fill loading animation.
 * Always plays the complete animation cycle before fading out.
 */
export default function EcoLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const logoUrl = encodeURI("/Logo Elements (Light).png");

  // Single lifecycle: progress → hold → fade → done
  useEffect(() => {
    let cancelled = false;

    // Step 1: Animate progress from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const step = Math.random() * 4 + 1;
        return Math.min(prev + step, 100);
      });
    }, 100);

    // Step 2: After ~4s (enough for progress to complete), start fade
    const fadeStart = setTimeout(() => {
      if (cancelled) return;
      clearInterval(interval);
      setProgress(100);
      setFading(true);
    }, 4000);

    // Step 3: After fade animation (600ms), unmount
    const fadeEnd = setTimeout(() => {
      if (cancelled) return;
      setVisible(false);
      onCompleteRef.current?.();
    }, 4700);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(fadeStart);
      clearTimeout(fadeEnd);
    };
  }, []);

  if (!visible) return null;

  const waterLevel = 120 - progress * 1.3;

  return (
    <div
      id="eco-loading-screen"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#d9ffed",
        fontFamily: "'Quicksand', sans-serif",
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(1.03)" : "scale(1)",
        transition: "opacity 600ms ease-in, transform 600ms ease-in",
      }}
    >
      {/* Composition wrapper */}
      <div className="relative flex flex-col items-center z-10 w-full max-w-sm">
        {/* Ambient glow */}
        <div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[60px] animate-pulse -z-10"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
        />

        {/* Circle container */}
        <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px] mb-16 mt-16">
          {/* Back wall & border (the hole) */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              border: "8px solid rgba(255, 255, 255, 0.8)",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.1), inset 0 15px 25px rgba(0,0,0,0.05)",
            }}
          >
            {/* Water filling up */}
            <div
              className="absolute left-0 w-full h-[600px] z-10"
              style={{
                top: `${waterLevel}%`,
                transition: "top 800ms ease-out",
              }}
            >
              {/* Back wave */}
              <div
                className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] origin-center"
                style={{
                  borderRadius: "43%",
                  backgroundColor: "rgba(52, 211, 153, 0.7)",
                  animation: "eco-spin-wave 7s linear infinite",
                }}
              />
              {/* Middle wave */}
              <div
                className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] origin-center mt-[10px]"
                style={{
                  borderRadius: "40%",
                  backgroundColor: "rgba(16, 185, 129, 0.8)",
                  mixBlendMode: "multiply",
                  animation: "eco-spin-wave-reverse 5s linear infinite",
                }}
              />
              {/* Front wave */}
              <div
                className="absolute left-1/2 w-[600px] h-[600px] -ml-[300px] origin-center mt-[20px]"
                style={{
                  borderRadius: "45%",
                  background: "linear-gradient(to top, #059669, #10b981)",
                  animation: "eco-spin-wave 3.5s linear infinite",
                }}
              />
              {/* Solid water body below waves */}
              <div
                className="absolute left-0 w-full h-[600px] top-[500px]"
                style={{ backgroundColor: "#059669" }}
              />
            </div>

            {/* Inner glare */}
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(255,255,255,0.4), transparent, rgba(0,0,0,0.1))",
                mixBlendMode: "overlay",
              }}
            />
          </div>

          {/* Logo pop-out mask */}
          <div className="absolute left-[8px] right-[8px] bottom-[8px] h-[600px] rounded-b-full overflow-hidden pointer-events-none z-30">
            <div className="absolute bottom-0 left-0 w-full h-[204px] md:h-[244px]">
              <img
                src={logoUrl}
                className="absolute z-30 object-contain left-1/2 -translate-x-1/2"
                style={{
                  height: `${100 + progress * 0.4}%`,
                  bottom: `${-120 + progress * 1.0}%`,
                  opacity: Math.min(progress * 0.05, 1),
                  mixBlendMode: "multiply",
                  filter: "brightness(1.15) contrast(1.2)",
                  transition: "all 600ms ease-out",
                  animation: "eco-float-up 4s ease-in-out infinite",
                }}
                alt="EcoPoints Logo"
              />
            </div>
          </div>

          {/* 3D depth overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none z-40"
            style={{
              background:
                "linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent, rgba(0,0,0,0.05))",
              mixBlendMode: "overlay",
            }}
          />
        </div>
      </div>
    </div>
  );
}
