import { useState, useEffect } from 'react';
import { ultiFocusManager } from '@/lib/ultiFocusMode';

export function useUltiFocus() {
  const [isActive, setIsActive] = useState(ultiFocusManager.isActive());
  const [exitAttempts, setExitAttempts] = useState(ultiFocusManager.getExitAttempts());

  useEffect(() => {
    // Subscribe to UltiFocus state changes
    const unsubscribe = ultiFocusManager.onChange(setIsActive);

    // Update exit attempts periodically
    const interval = setInterval(() => {
      if (ultiFocusManager.isActive()) {
        setExitAttempts(ultiFocusManager.getExitAttempts());
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const start = async (durationInSeconds: number) => {
    await ultiFocusManager.start(durationInSeconds);
  };

  const end = (reason: 'completed' | 'user-ended' | 'emergency') => {
    ultiFocusManager.end(reason);
  };

  const requestEmergencyExit = async () => {
    return await ultiFocusManager.requestEmergencyExit();
  };

  const getTimeRemaining = () => {
    return ultiFocusManager.getTimeRemaining();
  };

  const getSession = () => {
    return ultiFocusManager.getSession();
  };

  return {
    isActive,
    exitAttempts,
    start,
    end,
    requestEmergencyExit,
    getTimeRemaining,
    getSession,
  };
}
