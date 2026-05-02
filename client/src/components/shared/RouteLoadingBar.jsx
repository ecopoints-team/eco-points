"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * RouteLoadingBar — Thin top progress bar shown on route transitions.
 *
 * Appears on public pages (/rewards, /profile, /leaderboard, /qr).
 * Excluded from homepage (has its own loading screen) and admin routes.
 */
export default function RouteLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const prevPathname = useRef(pathname);
  const intervalRef = useRef(null);

  // Skip for homepage and admin routes
  const shouldSkip = (path) =>
    path === "/" || path.startsWith("/admin");

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (shouldSkip(pathname)) return;

    // Start loading bar
    setLoading(true);
    setFadingOut(false);
    setProgress(0);

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Fast initial burst, then slow crawl
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += current < 30 ? Math.random() * 12 + 5 : Math.random() * 2 + 0.5;
      current = Math.min(current, 92);
      setProgress(current);
    }, 100);

    // Complete after a short delay (page should have rendered)
    const completeTimer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);

      // Fade out after reaching 100%
      const fadeTimer = setTimeout(() => {
        setFadingOut(true);
        const removeTimer = setTimeout(() => {
          setLoading(false);
          setFadingOut(false);
          setProgress(0);
        }, 400);
        return () => clearTimeout(removeTimer);
      }, 200);
      return () => clearTimeout(fadeTimer);
    }, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      id="eco-route-loading-bar"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 400ms ease-out",
      }}
    >
      {/* Bar track */}
      <div
        className="h-[3px] origin-left"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #10b981, #34d399, #059669)",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.6), 0 0 4px rgba(16, 185, 129, 0.4)",
          transition: progress < 100
            ? "width 200ms ease-out"
            : "width 300ms ease-out",
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: "inherit" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              animation: "eco-bar-shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
