import React, { createContext, useContext, ReactNode } from 'react';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import type { Alarm } from '@shared/schema';

interface AlarmContextType {
  alarms: Alarm[];
  activeAlarm: any;
  loading: boolean;
  snoozeAlarm: (minutes: number) => Promise<void>;
  dismissAlarm: () => Promise<void>;
  fetchAlarms: () => Promise<void>;
  triggerAlarm: (alarm: Alarm) => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const alarmManager = useAlarmManager();
  
  return (
    <AlarmContext.Provider value={alarmManager}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within AlarmProvider');
  }
  return context;
}
