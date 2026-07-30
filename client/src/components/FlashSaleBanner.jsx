import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FlashSaleBanner = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // If no endTime provided, default to midnight tonight
    const targetDate = endTime ? new Date(endTime) : new Date();
    if (!endTime) {
      targetDate.setHours(23, 59, 59, 999);
    }

    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      let newTimeLeft = { hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="bg-gradient-to-r from-primary via-[#2C2D35] to-primary rounded-3xl p-6 sm:p-8 text-surface shadow-md border border-borderDark flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-accent text-white uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
            🔥 Limited Time Offer
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-surface">
            GoGirl Flash Sale & Mega Deals
          </h2>
          <p className="text-xs text-surface/70">Save up to 40% on top footwear, skincare & accessories. Offers refresh daily!</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 bg-surface/10 backdrop-blur-md p-3 rounded-2xl border border-surface/15 text-center">
            <div className="w-10 text-center">
              <span className="block text-xl font-heading font-bold text-accent">{pad(timeLeft.hours)}</span>
              <span className="text-[9px] uppercase tracking-wider text-surface/60 font-semibold">Hours</span>
            </div>
            <span className="text-accent font-bold text-lg">:</span>
            <div className="w-10 text-center">
              <span className="block text-xl font-heading font-bold text-accent">{pad(timeLeft.minutes)}</span>
              <span className="text-[9px] uppercase tracking-wider text-surface/60 font-semibold">Mins</span>
            </div>
            <span className="text-accent font-bold text-lg">:</span>
            <div className="w-10 text-center">
              <span className="block text-xl font-heading font-bold text-accent">{pad(timeLeft.seconds)}</span>
              <span className="text-[9px] uppercase tracking-wider text-surface/60 font-semibold">Secs</span>
            </div>
          </div>
          <Link to="/flash-sale" className="btn-primary bg-accent hover:bg-accent/90 text-white py-3.5 px-6 text-xs font-bold shadow-md shrink-0">
            Claim Deals
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleBanner;
