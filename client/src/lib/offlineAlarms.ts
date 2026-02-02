/**
 * Offline Alarm Management
 * Stores and manages alarms locally when offline
 */

import type { Alarm } from '@shared/schema';

const OFFLINE_ALARMS_KEY = 'proapp_offline_alarms_v1';

export const offlineAlarms = {
  // Get all offline alarms
  getAll(): Alarm[] {
    try {
      const raw = localStorage.getItem(OFFLINE_ALARMS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Alarm[];
    } catch (error) {
      console.error('[OfflineAlarms] Error reading alarms:', error);
      return [];
    }
  },

  // Save all alarms offline
  saveAll(alarms: Alarm[]): void {
    try {
      localStorage.setItem(OFFLINE_ALARMS_KEY, JSON.stringify(alarms));
      console.log('[OfflineAlarms] ✅ Saved', alarms.length, 'alarms offline');
    } catch (error) {
      console.error('[OfflineAlarms] Error saving alarms:', error);
    }
  },

  // Add or update an alarm
  save(alarm: Alarm): void {
    const alarms = this.getAll();
    const index = alarms.findIndex(a => a.id === alarm.id);
    
    if (index >= 0) {
      alarms[index] = alarm;
      console.log('[OfflineAlarms] Updated alarm:', alarm.label);
    } else {
      alarms.push(alarm);
      console.log('[OfflineAlarms] Added new alarm:', alarm.label);
    }
    
    this.saveAll(alarms);
  },

  // Delete an alarm
  delete(alarmId: number): void {
    const alarms = this.getAll();
    const filtered = alarms.filter(a => a.id !== alarmId);
    this.saveAll(filtered);
    console.log('[OfflineAlarms] Deleted alarm:', alarmId);
  },

  // Get a specific alarm
  get(alarmId: number): Alarm | null {
    const alarms = this.getAll();
    return alarms.find(a => a.id === alarmId) || null;
  },

  // Sync with server data (when online)
  syncFromServer(serverAlarms: Alarm[]): void {
    console.log('[OfflineAlarms] 🔄 Syncing from server:', serverAlarms.length, 'alarms');
    this.saveAll(serverAlarms);
  },

  // Check if we have offline alarms
  hasOfflineData(): boolean {
    return this.getAll().length > 0;
  },

  // Clear all offline alarms (use carefully!)
  clear(): void {
    localStorage.removeItem(OFFLINE_ALARMS_KEY);
    console.log('[OfflineAlarms] ⚠️ Cleared all offline alarms');
  }
};
