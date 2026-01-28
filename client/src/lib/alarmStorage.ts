// client/src/lib/alarmStorage.ts
export interface AlarmState {
  snoozedUntil?: Record<string, number>;
  lastTriggered?: Record<string, string>;
  dismissedIds?: string[];
}

const ALARM_STATE_KEY = "proapp_alarm_state_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const alarmStorage = {
  getState(): AlarmState {
    try {
      const raw = localStorage.getItem(ALARM_STATE_KEY);
      return safeParse<AlarmState>(raw, {});
    } catch {
      return {};
    }
  },

  setState(state: AlarmState): void {
    try {
      localStorage.setItem(ALARM_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  },

  snoozeAlarm(alarmId: string, minutes: number): void {
    const state = this.getState();
    const now = Date.now();
    const snoozeUntil = now + Math.max(0, Math.floor(minutes)) * 60000;

    state.snoozedUntil = state.snoozedUntil || {};
    state.snoozedUntil[alarmId] = snoozeUntil;

    this.setState(state);
  },

  dismissAlarm(alarmId: string): void {
    const state = this.getState();
    state.dismissedIds = state.dismissedIds || [];
    if (!state.dismissedIds.includes(alarmId)) {
      state.dismissedIds.push(alarmId);
    }
    // remove any snooze entry
    if (state.snoozedUntil) delete state.snoozedUntil[alarmId];
    this.setState(state);
  },

  isAlarmSnoozed(alarmId: string): boolean {
    const state = this.getState();
    if (!state.snoozedUntil) return false;
    const until = state.snoozedUntil[alarmId];
    if (!until) return false;
    return until > Date.now();
  },

  getSnoozeUntil(alarmId: string): number | null {
    const state = this.getState();
    if (!state.snoozedUntil) return null;
    return state.snoozedUntil[alarmId] ?? null;
  },

  clearAlarmState(alarmId: string): void {
    const state = this.getState();
    if (state.snoozedUntil && state.snoozedUntil[alarmId]) {
      delete state.snoozedUntil[alarmId];
    }
    if (state.dismissedIds) {
      state.dismissedIds = state.dismissedIds.filter((id) => id !== alarmId);
      if (state.dismissedIds.length === 0) delete state.dismissedIds;
    }
    // keep lastTriggered (history) unless you want to remove it here
    this.setState(state);
  },

  markLastTriggered(alarmId: string, isoString?: string): void {
    const state = this.getState();
    state.lastTriggered = state.lastTriggered || {};
    state.lastTriggered[alarmId] = isoString ?? new Date().toISOString();
    this.setState(state);
  },

  getLastTriggered(alarmId: string): string | null {
    const state = this.getState();
    return state.lastTriggered?.[alarmId] ?? null;
  },
};