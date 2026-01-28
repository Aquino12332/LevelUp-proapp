import { useState, useEffect, useCallback, useRef } from "react";
import type { Alarm } from "@shared/schema";
import { alarmSounds, type SoundType } from "@/lib/alarmSounds";
import { alarmStorage } from "@/lib/alarmStorage";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

interface ActiveAlarm extends Alarm {
  snoozeOptions: number[];
}

export function useAlarmManager() {
  const { user } = useAuth();
  const userId = user?.id || "demo-user";
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [loading, setLoading] = useState(true);
  // Use ReturnType<typeof setInterval> so it's compatible with browsers
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  // Fetch alarms from server
  const fetchAlarms = useCallback(async () => {
    try {
      const response = await fetch(`/api/alarms?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAlarms(data);
      }
    } catch (error) {
      console.error("Failed to fetch alarms:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Trigger alarm
  const triggerAlarm = useCallback(
    async (alarm: Alarm) => {
      console.log('[AlarmTrigger] 🔔 TRIGGERING ALARM:', alarm.label);
      
      try {
        // Set active alarm modal FIRST
        console.log('[AlarmTrigger] Setting active alarm modal');
        setActiveAlarm({
          ...alarm,
          snoozeOptions: [5, 10, 15],
        });

        // Play sound
        console.log('[AlarmTrigger] Playing sound:', alarm.sound);
        await alarmSounds.playSound(alarm.sound as SoundType);

        // Request notification permission if needed
        if ("Notification" in window && Notification.permission !== "granted") {
          try {
            console.log('[AlarmTrigger] Requesting notification permission');
            // Requesting permission is async; ignore result if user blocks
            // but we still proceed with the modal and sound
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            Notification.requestPermission();
          } catch {}
        }

        // Show notification if granted
        if ("Notification" in window && Notification.permission === "granted") {
          // Note: creating notification may throw on some platforms; guard it
          try {
            console.log('[AlarmTrigger] Showing browser notification');
            // requireInteraction ensures it remains until user acts (Chrome)
            // tag groups notifications by alarm
            new Notification(alarm.label, {
              body: "Tap snooze or dismiss.",
              icon: "/favicon.png",
              tag: `alarm-${alarm.id}`,
              requireInteraction: true,
            });
          } catch (e) {
            console.warn("[AlarmTrigger] Notification failed:", e);
          }
        }

        // Mark as triggered on server
        console.log('[AlarmTrigger] Marking as triggered on server');
        await fetch(`/api/alarms/${alarm.id}/trigger`, {
          method: "POST",
        });

        toast({
          title: alarm.label,
          description: "Alarm triggered!",
        });
        
        console.log('[AlarmTrigger] ✅ Alarm triggered successfully');
      } catch (error) {
        console.error("[AlarmTrigger] ❌ Failed to trigger alarm:", error);
      }
    },
    [toast]
  );

  // Check if alarm should trigger
  const checkAlarmTrigger = useCallback(async () => {
    if (alarms.length === 0) {
      console.log('[Alarm Check] No alarms to check');
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const today = now.toDateString();

    console.log(`[Alarm Check] Checking ${alarms.length} alarms at ${currentTime}`);

    for (const alarm of alarms) {
      try {
        if (!alarm.enabled) {
          console.log(`[Alarm Check] ${alarm.label} - disabled, skipping`);
          continue;
        }
        if (activeAlarm?.id === alarm.id) {
          console.log(`[Alarm Check] ${alarm.label} - already active, skipping`);
          continue;
        }

        // Check if alarm is snoozed
        const snoozeUntil = alarmStorage.getSnoozeUntil(alarm.id);
        if (snoozeUntil) {
          const now = Date.now();
          const remainingMs = snoozeUntil - now;
          if (remainingMs > 0) {
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            console.log(`[Alarm Check] ${alarm.label} - snoozed for ${remainingMinutes} more minutes, skipping`);
            continue;
          } else {
            // Snooze expired - trigger the alarm now!
            console.log(`[Alarm Check] ${alarm.label} - ⏰ SNOOZE EXPIRED! Triggering now.`);
            alarmStorage.clearAlarmState(alarm.id);
            await triggerAlarm(alarm);
            continue;
          }
        }

        // Safe parse repeatDays
        let repeatDays: string[] = [];
        try {
          const parsed = JSON.parse(alarm.repeatDays || "[]");
          if (Array.isArray(parsed)) repeatDays = parsed;
        } catch {
          repeatDays = [];
        }

        // Check if today is a repeat day (or if it's a one-time alarm with no repeat days)
        const isRepeatDay = repeatDays.length === 0 || repeatDays.includes(currentDay);

        // Extract HH:MM from alarm.time (could be HH:MM or HH:MM:SS)
        const alarmTime = alarm.time.substring(0, 5); // Get first 5 chars (HH:MM)
        
        console.log(`[Alarm Check] ${alarm.label} - time: ${alarmTime}, current: ${currentTime}, match: ${alarmTime === currentTime}, isRepeatDay: ${isRepeatDay}`);
        
        if (alarmTime === currentTime && isRepeatDay) {
          // Check if already triggered today (within last 2 minutes to prevent duplicates)
          if (alarm.lastTriggered) {
            const lastTriggeredDate = new Date(alarm.lastTriggered);
            const timeSinceLastTrigger = now.getTime() - lastTriggeredDate.getTime();
            const twoMinutesInMs = 2 * 60 * 1000;
            
            if (timeSinceLastTrigger < twoMinutesInMs) {
              continue; // Already triggered recently
            }
          }

          // Trigger alarm
          console.log(`🔔 Triggering alarm: ${alarm.label} at ${currentTime}`);
          await triggerAlarm(alarm);
        }
      } catch (err) {
        // Catch per-alarm errors so one bad alarm doesn't stop the loop
        console.error("Error checking alarm", alarm?.id, err);
      }
    }
  }, [alarms, activeAlarm, triggerAlarm]);

  // Snooze alarm
  const snoozeAlarm = useCallback(
    async (minutes: number) => {
      if (!activeAlarm) return;

      try {
        console.log(`[Snooze] Snoozing alarm "${activeAlarm.label}" for ${minutes} minutes`);
        
        alarmSounds.stopSound();
        alarmStorage.snoozeAlarm(activeAlarm.id, minutes);
        
        const snoozeUntil = new Date(Date.now() + minutes * 60000);
        console.log(`[Snooze] Alarm will ring again at: ${snoozeUntil.toLocaleTimeString()}`);

        const response = await fetch(`/api/alarms/${activeAlarm.id}/snooze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes }),
        });

        if (response.ok) {
          setActiveAlarm(null);
          toast({
            title: "Snoozed",
            description: `Alarm will ring again at ${snoozeUntil.toLocaleTimeString()}`,
          });
          console.log(`[Snooze] ✅ Snooze saved successfully`);
        }
      } catch (error) {
        console.error("[Snooze] ❌ Failed to snooze alarm:", error);
      }
    },
    [activeAlarm, toast]
  );

  // Dismiss alarm
  const dismissAlarm = useCallback(
    async () => {
      if (!activeAlarm) return;

      try {
        alarmSounds.stopSound();
        alarmStorage.dismissAlarm(activeAlarm.id);

        const response = await fetch(`/api/alarms/${activeAlarm.id}/dismiss`, {
          method: "POST",
        });

        if (response.ok) {
          setActiveAlarm(null);
          toast({
            title: "Dismissed",
            description: "Alarm dismissed",
          });
        }
      } catch (error) {
        console.error("Failed to dismiss alarm:", error);
      }
    },
    [activeAlarm, toast]
  );

  // Start polling - check more frequently for better accuracy
  useEffect(() => {
    fetchAlarms();

    // Check immediately on mount
    checkAlarmTrigger();

    // Then check every 5 seconds for better accuracy
    pollingIntervalRef.current = setInterval(() => {
      checkAlarmTrigger();
    }, 5000); // Check every 5 seconds

    return () => {
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current);
      }
      alarmSounds.stopSound();
    };
  }, [fetchAlarms, checkAlarmTrigger]);

  return {
    alarms,
    activeAlarm,
    loading,
    snoozeAlarm,
    dismissAlarm,
    fetchAlarms,
  };
}