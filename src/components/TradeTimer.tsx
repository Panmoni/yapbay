import React, { useState, useEffect } from "react";

interface TradeTimerProps {
  deadline: string | null;
  onExpire?: () => void;
  label: string;
}

const TradeTimer: React.FC<TradeTimerProps> = ({ deadline, onExpire, label }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining({
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
      });
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });

        if (onExpire) {
          onExpire();
        }

        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        expired: false,
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Then set up interval
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const formatTime = (value: number): string => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  return (
    <div className="flex flex-col items-start">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      {timeRemaining.expired ? (
        <div className="text-red-600 font-medium">Expired</div>
      ) : (
        <div className="font-mono text-lg font-medium">
          {formatTime(timeRemaining.hours)}:{formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
        </div>
      )}
    </div>
  );
};

export default TradeTimer;
