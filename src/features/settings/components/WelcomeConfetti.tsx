"use client";

import { useEffect, useRef } from "react";

export function WelcomeConfetti() {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const fire = async () => {
      const confetti = (await import("canvas-confetti")).default;
      const colors = ["#22c55e", "#06b6d4", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

      void confetti({
        particleCount: 110,
        spread: 85,
        startVelocity: 42,
        origin: { y: 0.58 },
        colors,
      });

      void confetti({
        particleCount: 70,
        spread: 65,
        startVelocity: 48,
        angle: 60,
        origin: { x: 0, y: 0.68 },
        colors,
      });

      void confetti({
        particleCount: 70,
        spread: 65,
        startVelocity: 48,
        angle: 120,
        origin: { x: 1, y: 0.68 },
        colors,
      });
    };

    void fire();
  }, []);

  return null;
}
