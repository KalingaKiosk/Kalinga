'use client';

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: 'linear-gradient(135deg, #1a1a4e 0%, #0f0f35 50%, #1a1a4e 100%)' }}
      onClick={onStart}
    >
      {/* Floating Bubbles */}
      <div className="bubble bubble-slow" style={{ width: 120, height: 120, top: '10%', left: '5%', animationDelay: '0s' }} />
      <div className="bubble" style={{ width: 80, height: 80, top: '20%', right: '10%', animationDelay: '1s' }} />
      <div className="bubble bubble-slow" style={{ width: 60, height: 60, top: '60%', left: '15%', animationDelay: '2s' }} />
      <div className="bubble" style={{ width: 100, height: 100, bottom: '15%', right: '5%', animationDelay: '0.5s' }} />
      <div className="bubble bubble-slow" style={{ width: 40, height: 40, top: '40%', left: '70%', animationDelay: '3s' }} />
      <div className="bubble" style={{ width: 70, height: 70, bottom: '30%', left: '40%', animationDelay: '1.5s' }} />
      <div className="bubble bubble-slow" style={{ width: 50, height: 50, top: '5%', right: '30%', animationDelay: '2.5s' }} />
      <div className="bubble" style={{ width: 90, height: 90, bottom: '5%', left: '60%', animationDelay: '4s' }} />

      {/* Robot Mascot */}
      <div
        className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-700 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="robot-glow">
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            {/* Robot head */}
            <ellipse cx="60" cy="50" rx="50" ry="35" fill="#e0e0e0" stroke="#bbb" strokeWidth="2" />
            {/* Visor */}
            <ellipse cx="60" cy="48" rx="38" ry="20" fill="#1a1a3e" />
            {/* Left eye */}
            <ellipse cx="42" cy="48" rx="10" ry="8" fill="#00e5ff" />
            <ellipse cx="42" cy="46" rx="4" ry="3" fill="#fff" opacity="0.6" />
            {/* Right eye */}
            <ellipse cx="78" cy="48" rx="10" ry="8" fill="#00e5ff" />
            <ellipse cx="78" cy="46" rx="4" ry="3" fill="#fff" opacity="0.6" />
            {/* Antenna */}
            <line x1="60" y1="15" x2="60" y2="5" stroke="#bbb" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="3" r="4" fill="#00e5ff" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-wide text-white sm:text-5xl">
            KALINGA
          </h1>
          <p className="mt-2 text-base text-blue-200/80">
            Health Kiosk System
          </p>
        </div>

        <p className="mt-8 animate-pulse text-sm text-blue-300/70">
          Tap to Continue
        </p>
      </div>
    </div>
  );
}
