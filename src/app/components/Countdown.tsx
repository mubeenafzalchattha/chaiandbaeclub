"use client";

import { useEffect, useState } from "react";
import { calculateCountdown, CountdownResult } from "@/lib/utils";

interface CountdownProps {
  deadline: string;
  onExpire?: () => void;
}

export default function Countdown({ deadline, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<CountdownResult | null>(null);

  useEffect(() => {
    // Initial calculation
    const current = calculateCountdown(deadline);
    setTimeLeft(current);

    if (current.isExpired && onExpire) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const next = calculateCountdown(deadline);
      setTimeLeft(next);

      if (next.isExpired) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  if (!timeLeft) {
    return (
      <div className="countdown-box">
        <h4 className="countdown-title">Calculating Booking Deadline...</h4>
        <div className="countdown-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="countdown-item">
              <div className="countdown-num">--</div>
              <div className="countdown-label">--</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="countdown-box" style={{ borderColor: "#C0392B", background: "#FCE4D6" }}>
        <h4 className="countdown-title" style={{ color: "#C0392B" }}>Booking Closed</h4>
        <div className="countdown-expired">
          🚨 The booking deadline for this event has passed!
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-box">
      <h4 className="countdown-title">✨ Booking Deadline Ticking ✨</h4>
      <div className="countdown-grid">
        <div className="countdown-item">
          <div className="countdown-num">{String(timeLeft.days).padStart(2, "0")}</div>
          <div className="countdown-label">Days</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-num">{String(timeLeft.hours).padStart(2, "0")}</div>
          <div className="countdown-label">Hours</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</div>
          <div className="countdown-label">Mins</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</div>
          <div className="countdown-label">Secs</div>
        </div>
      </div>
    </div>
  );
}
