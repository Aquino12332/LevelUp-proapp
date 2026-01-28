// Focus Mode - Block notifications from selected apps/sources
// Note: This is a web app, so we'll simulate app blocking by managing
// web notifications and providing UI to configure focus preferences

export interface FocusSettings {
  blockNotifications: boolean;
  blockedSources: string[];
  allowCalls: boolean;
  allowAlarms: boolean;
  allowPriority: boolean;
}

const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  blockNotifications: false,
  blockedSources: [],
  allowCalls: true,
  allowAlarms: true,
  allowPriority: true,
};

// Common notification sources (categories)
export const NOTIFICATION_SOURCES = [
  { id: 'social', name: 'Social Media', description: 'Messages, likes, comments', icon: '💬' },
  { id: 'email', name: 'Email', description: 'New emails and newsletters', icon: '📧' },
  { id: 'messaging', name: 'Messaging Apps', description: 'Chat and instant messages', icon: '💭' },
  { id: 'news', name: 'News & Updates', description: 'Breaking news and updates', icon: '📰' },
  { id: 'shopping', name: 'Shopping', description: 'Deals, deliveries, cart reminders', icon: '🛍️' },
  { id: 'entertainment', name: 'Entertainment', description: 'Videos, music, games', icon: '🎮' },
  { id: 'productivity', name: 'Other Productivity', description: 'Work and productivity tools', icon: '💼' },
  { id: 'system', name: 'System Notifications', description: 'Updates and system alerts', icon: '⚙️' },
] as const;

// Local storage key
const STORAGE_KEY = 'proapp-focus-settings';

class FocusModeManager {
  private settings: FocusSettings;
  private isActive: boolean = false;
  private originalNotificationPermission: NotificationPermission | null = null;

  constructor() {
    this.settings = this.loadSettings();
  }

  // Load settings from localStorage
  private loadSettings(): FocusSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FOCUS_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('[FocusMode] Failed to load settings:', error);
    }
    return { ...DEFAULT_FOCUS_SETTINGS };
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[FocusMode] Failed to save settings:', error);
    }
  }

  // Get current settings
  getSettings(): FocusSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(updates: Partial<FocusSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    console.log('[FocusMode] Settings updated:', this.settings);
  }

  // Toggle a notification source
  toggleSource(sourceId: string): void {
    const blocked = new Set(this.settings.blockedSources);
    if (blocked.has(sourceId)) {
      blocked.delete(sourceId);
    } else {
      blocked.add(sourceId);
    }
    this.settings.blockedSources = Array.from(blocked);
    this.saveSettings();
  }

  // Check if a notification should be blocked
  shouldBlockNotification(source?: string, isCall?: boolean, isAlarm?: boolean, isPriority?: boolean): boolean {
    if (!this.isActive || !this.settings.blockNotifications) {
      return false;
    }

    // Always allow calls if enabled
    if (isCall && this.settings.allowCalls) {
      return false;
    }

    // Always allow alarms if enabled
    if (isAlarm && this.settings.allowAlarms) {
      return false;
    }

    // Always allow priority if enabled
    if (isPriority && this.settings.allowPriority) {
      return false;
    }

    // Block if source is in blocked list
    if (source && this.settings.blockedSources.includes(source)) {
      return true;
    }

    // Default: don't block
    return false;
  }

  // Activate focus mode
  async activate(): Promise<void> {
    console.log('[FocusMode] Activating focus mode...');
    this.isActive = true;

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        console.log('[FocusMode] Notification permission:', permission);
      } catch (error) {
        console.warn('[FocusMode] Failed to request notification permission:', error);
      }
    }

    // Store original permission state
    if ('Notification' in window) {
      this.originalNotificationPermission = Notification.permission;
    }

    // Notify user
    this.showFocusModeNotification('Focus Mode Activated', {
      body: 'Distracting notifications are now blocked. Stay focused!',
      icon: '🎯',
      tag: 'focus-mode-start',
      requireInteraction: false,
    });

    console.log('[FocusMode] Focus mode activated');
  }

  // Deactivate focus mode
  deactivate(): void {
    console.log('[FocusMode] Deactivating focus mode...');
    this.isActive = false;

    // Notify user
    this.showFocusModeNotification('Focus Mode Ended', {
      body: 'Great work! Notifications are now restored.',
      icon: '✅',
      tag: 'focus-mode-end',
      requireInteraction: false,
    });

    console.log('[FocusMode] Focus mode deactivated');
  }

  // Check if focus mode is active
  isActivated(): boolean {
    return this.isActive;
  }

  // Show a notification (only if not blocked by focus mode)
  private showFocusModeNotification(title: string, options: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (error) {
        console.warn('[FocusMode] Failed to show notification:', error);
      }
    }
  }

  // Get summary of blocked sources
  getBlockedSourcesSummary(): string {
    const count = this.settings.blockedSources.length;
    if (count === 0) return 'No apps blocked';
    if (count === 1) return '1 app blocked';
    return `${count} apps blocked`;
  }

  // Enable/disable notification blocking
  setBlockNotifications(enabled: boolean): void {
    this.settings.blockNotifications = enabled;
    this.saveSettings();
  }

  // Block all sources
  blockAll(): void {
    this.settings.blockedSources = NOTIFICATION_SOURCES.map(s => s.id);
    this.saveSettings();
  }

  // Unblock all sources
  unblockAll(): void {
    this.settings.blockedSources = [];
    this.saveSettings();
  }
}

// Singleton instance
export const focusModeManager = new FocusModeManager();

// Hook for React components
import { useState } from 'react';

export function useFocusMode() {
  const [settings, setSettings] = useState(focusModeManager.getSettings());
  const [isActive, setIsActive] = useState(focusModeManager.isActivated());

  const updateSettings = (updates: Partial<FocusSettings>) => {
    focusModeManager.updateSettings(updates);
    setSettings(focusModeManager.getSettings());
  };

  const toggleSource = (sourceId: string) => {
    focusModeManager.toggleSource(sourceId);
    setSettings(focusModeManager.getSettings());
  };

  const activate = async () => {
    await focusModeManager.activate();
    setIsActive(true);
  };

  const deactivate = () => {
    focusModeManager.deactivate();
    setIsActive(false);
  };

  const blockAll = () => {
    focusModeManager.blockAll();
    setSettings(focusModeManager.getSettings());
  };

  const unblockAll = () => {
    focusModeManager.unblockAll();
    setSettings(focusModeManager.getSettings());
  };

  return {
    settings,
    isActive,
    updateSettings,
    toggleSource,
    activate,
    deactivate,
    blockAll,
    unblockAll,
    blockedSummary: focusModeManager.getBlockedSourcesSummary(),
  };
}

// For non-React usage
export default focusModeManager;
