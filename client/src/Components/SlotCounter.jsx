'use client';
import { useEffect, useState, useRef } from 'react';

export default function SlotCounter({ value, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  
  // Easing function for the "slow down" effect at the end
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentVal = Math.floor(easedProgress * value);
      
      // Only update state if value changes to avoid re-renders
      if (countRef.current !== currentVal) {
        setCount(currentVal);
        countRef.current = currentVal;
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  // Format with commas (e.g., 1,200) — deterministic to avoid hydration mismatch
  const formatted = String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return <span className="font-mono">{formatted}</span>;
}