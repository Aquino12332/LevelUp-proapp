/**
 * Wake Lock API wrapper
 * Keeps the screen on during alarms on mobile devices
 */

class WakeLockManager {
  private wakeLock: any = null;
  private isSupported: boolean = false;

  constructor() {
    // Check if Wake Lock API is supported
    this.isSupported = 'wakeLock' in navigator;
    console.log('[WakeLock] Wake Lock API supported:', this.isSupported);
  }

  async request(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[WakeLock] Wake Lock API not supported on this device');
      return false;
    }

    try {
      // Request a screen wake lock
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('[WakeLock] ✅ Wake lock acquired - screen will stay on');

      // Listen for wake lock release
      this.wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock released');
      });

      return true;
    } catch (err: any) {
      console.error('[WakeLock] Failed to acquire wake lock:', err.message);
      return false;
    }
  }

  async release(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('[WakeLock] Wake lock manually released');
      } catch (err) {
        console.error('[WakeLock] Error releasing wake lock:', err);
      }
    }
  }

  isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
}

// Singleton instance
export const wakeLockManager = new WakeLockManager();
