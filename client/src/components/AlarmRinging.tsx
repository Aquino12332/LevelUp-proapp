import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { alarmSounds, type SoundType } from "@/lib/alarmSounds";

interface AlarmRingingProps {
  label: string;
  time: string;
  sound: string;
  snoozeOptions: number[];
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export function AlarmRinging({
  label,
  time,
  sound,
  snoozeOptions,
  onSnooze,
  onDismiss,
}: AlarmRingingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play sound when component mounts and handle cleanup
  useEffect(() => {
    console.log('[AlarmRinging] Component mounted, attempting to play sound:', sound);
    let retryCount = 0;
    const maxRetries = 5;
    
    // Try to play sound with multiple retry attempts
    const playAlarmSound = async () => {
      try {
        await alarmSounds.playSound(sound as SoundType, 300000); // Play for 5 minutes max
        console.log('[AlarmRinging] ✅ Sound playing successfully');
        setSoundPlaying(true);
        setShowSoundPrompt(false);
      } catch (error) {
        console.error('[AlarmRinging] ❌ Failed to play sound (attempt ' + (retryCount + 1) + '):', error);
        retryCount++;
        
        // Show prompt to user after first failure
        if (retryCount === 1) {
          setShowSoundPrompt(true);
        }
        
        // Retry automatically with increasing delays
        if (retryCount < maxRetries) {
          const delay = retryCount * 500; // 500ms, 1000ms, 1500ms, etc.
          setTimeout(playAlarmSound, delay);
        }
      }
    };
    
    // Start playing immediately
    playAlarmSound();
    
    // Also add interaction listener for immediate user action
    const handleInteraction = async () => {
      if (!soundPlaying) {
        console.log('[AlarmRinging] User interaction detected, forcing sound play');
        try {
          await alarmSounds.playSound(sound as SoundType, 300000);
          setSoundPlaying(true);
          setShowSoundPrompt(false);
          console.log('[AlarmRinging] ✅ Sound playing after user interaction');
        } catch (error) {
          console.error('[AlarmRinging] ❌ Sound failed even after user interaction:', error);
        }
      }
    };
    
    // Listen for ANY user interaction
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('touchend', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    // Cleanup - stop sound when component unmounts
    return () => {
      console.log('[AlarmRinging] Component unmounting, stopping sound');
      alarmSounds.stopSound();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [sound, soundPlaying]);

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
          {/* Sound prompt banner */}
          {showSoundPrompt && (
            <div className="bg-yellow-500 text-black px-4 py-3 rounded-lg font-bold animate-pulse">
              🔊 Tap anywhere to enable sound!
            </div>
          )}
          
          {/* Sound Icon Animation */}
          <div className="flex justify-center">
            <div className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center",
              soundPlaying ? "bg-green-500" : "bg-red-500"
            )}>
              <Volume2 className="w-12 h-12 text-white" />
              {!soundPlaying && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
              )}
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