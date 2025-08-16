import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.total <= 0) {
    return (
      <div className="flex items-center text-red-600 font-medium">
        <Clock className="w-4 h-4 mr-2" />
        Auction Ended
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Clock className="w-5 h-5 text-red-500" />
      <div className="flex items-center space-x-1">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{timeLeft.days}</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
        )}
        
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">hours</div>
        </div>
        
        <div className="text-lg font-bold text-red-600">:</div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">min</div>
        </div>
        
        <div className="text-lg font-bold text-red-600">:</div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">sec</div>
        </div>
      </div>
    </div>
  );
}