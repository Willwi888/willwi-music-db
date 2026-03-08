import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return timeLeft;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  const FlipUnit = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col items-center mx-1 md:mx-2">
      <div className="relative bg-black rounded-lg shadow-lg overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/50 z-10"></div>
        <div className="text-3xl md:text-5xl font-mono font-bold text-white px-3 py-4 md:px-4 md:py-6 leading-none tracking-tighter">
          {formatNumber(value)}
        </div>
      </div>
      <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{label}</span>
    </div>
  );

  return (
    <div className="flex justify-center items-center">
      <FlipUnit label="Days" value={timeLeft.days} />
      <div className="text-2xl md:text-4xl font-bold text-slate-600 pb-6">:</div>
      <FlipUnit label="Hours" value={timeLeft.hours} />
      <div className="text-2xl md:text-4xl font-bold text-slate-600 pb-6">:</div>
      <FlipUnit label="Mins" value={timeLeft.minutes} />
      <div className="text-2xl md:text-4xl font-bold text-slate-600 pb-6">:</div>
      <FlipUnit label="Secs" value={timeLeft.seconds} />
    </div>
  );
};

export default CountdownTimer;
