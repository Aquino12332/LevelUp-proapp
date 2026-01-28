import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlarmRingingProps {
  label: string;
  time: string;
  snoozeOptions: number[];
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export function AlarmRinging({
  label,
  time,
  snoozeOptions,
  onSnooze,
  onDismiss,
}: AlarmRingingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl shadow-2xl">
        {/* Vibration animation */}
        <style>{`
          @keyframes vibrate {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }
          .alarm-vibrate {
            animation: vibrate 0.5s infinite;
          }
        `}</style>

        <div className="alarm-vibrate text-center space-y-6">
          {/* Sound Icon Animation */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
              <Volume2 className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Current Time */}
          <div className="text-6xl font-bold text-white tabular-nums">
            {formattedTime}
          </div>

          {/* Alarm Label */}
          <div>
            <h2 className="text-3xl font-bold text-white">{label}</h2>
            <p className="text-red-200 text-sm mt-2">Scheduled for {time}</p>
          </div>

          {/* Snooze Options */}
          {showSnoozeOptions ? (
            <div className="space-y-3">
              <p className="text-white text-sm font-medium">Snooze for:</p>
              <div className="grid grid-cols-3 gap-2">
                {snoozeOptions.map((minutes) => (
                  <Button
                    key={minutes}
                    onClick={() => onSnooze(minutes)}
                    className="bg-white/20 hover:bg-white/30 text-white font-bold"
                  >
                    {minutes}m
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowSnoozeOptions(false)}
                variant="ghost"
                className="w-full text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowSnoozeOptions(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg py-6"
              >
                Snooze
              </Button>
              <Button
                onClick={onDismiss}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-lg py-6 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}