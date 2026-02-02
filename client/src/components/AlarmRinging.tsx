import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { alarmSounds, type SoundType } from "@/lib/alarmSounds";
import { wakeLockManager } from "@/lib/wakeLock";

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
  console.log('[AlarmRinging] 🎨 Component rendering - label:', label, 'time:', time, 'sound:', sound);
  
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
    let soundAttempted = false; // Prevent multiple simultaneous attempts
    
    // Request wake lock to keep screen on (mobile)
    const requestWakeLock = async () => {
      const acquired = await wakeLockManager.request();
      if (acquired) {
        console.log('[AlarmRinging] ✅ Wake lock acquired - screen will stay on');
      }
    };
    requestWakeLock();

    // Start vibration pattern (mobile)
    if ('vibrate' in navigator) {
      // Vibrate in repeating pattern: 500ms on, 200ms off
      const vibratePattern = [500, 200, 500, 200, 500, 1000];
      navigator.vibrate(vibratePattern);
      console.log('[AlarmRinging] 📳 Vibration started');
      
      // Keep vibrating every 2 seconds
      const vibrateInterval = setInterval(() => {
        navigator.vibrate(vibratePattern);
      }, 2000);
      
      // Store for cleanup
      (window as any).__alarmVibrateInterval = vibrateInterval;
    }
    
    // Try to play sound
    const playAlarmSound = async () => {
      if (soundAttempted) {
        console.log('[AlarmRinging] Sound already attempted, skipping duplicate call');
        return;
      }
      soundAttempted = true;
      
      try {
        console.log('[AlarmRinging] Starting sound playback...');
        await alarmSounds.playSound(sound as SoundType, 300000); // Play for 5 minutes max
        console.log('[AlarmRinging] ✅ Sound playing successfully');
        setSoundPlaying(true);
        setShowSoundPrompt(false);
      } catch (error) {
        console.error('[AlarmRinging] ❌ Failed to play sound:', error);
        // Show prompt to user - they need to manually enable sound
        setShowSoundPrompt(true);
        setSoundPlaying(false);
      }
    };
    
    // Start playing immediately
    playAlarmSound();
    
    // Cleanup - stop sound when component unmounts
    return () => {
      console.log('[AlarmRinging] Component unmounting, stopping sound and wake lock');
      alarmSounds.stopSound();
      wakeLockManager.release();
      
      // Stop vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(0); // Stop vibration
        const vibrateInterval = (window as any).__alarmVibrateInterval;
        if (vibrateInterval) {
          clearInterval(vibrateInterval);
          (window as any).__alarmVibrateInterval = null;
        }
        console.log('[AlarmRinging] 📳 Vibration stopped');
      }
    };
  }, []); // Empty array - only run once on mount, cleanup on unmount

  // Manual sound enable handler (only called when user clicks the button)
  const handleEnableSound = async () => {
    console.log('[AlarmRinging] User manually enabling sound');
    try {
      await alarmSounds.playSound(sound as SoundType, 300000);
      setSoundPlaying(true);
      setShowSoundPrompt(false);
      console.log('[AlarmRinging] ✅ Sound enabled successfully');
    } catch (error) {
      console.error('[AlarmRinging] ❌ Manual sound enable failed:', error);
      // Keep showing the prompt
    }
  };

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log('[AlarmRinging] 🖼️  Rendering modal UI - soundPlaying:', soundPlaying, 'showSoundPrompt:', showSoundPrompt);
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" style={{ position: 'fixed' }}>
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
          {/* Sound prompt banner with button */}
          {showSoundPrompt && (
            <div className="bg-yellow-500 text-black px-4 py-3 rounded-lg space-y-2">
              <p className="font-bold">🔊 Sound blocked by browser!</p>
              <Button
                onClick={handleEnableSound}
                className="bg-black text-yellow-500 hover:bg-gray-800 font-bold w-full"
              >
                Click to Enable Sound
              </Button>
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
                onClick={() => {
                  console.log('[AlarmRinging] 🟡 SNOOZE BUTTON CLICKED');
                  setShowSnoozeOptions(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg py-6"
              >
                Snooze
              </Button>
              <Button
                onClick={() => {
                  console.log('[AlarmRinging] 🔴 DISMISS BUTTON CLICKED');
                  onDismiss();
                }}
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