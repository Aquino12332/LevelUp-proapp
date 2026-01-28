// Mobile optimizations for UltiFocus mode

export class MobileOptimizer {
  private wakeLock: any = null;
  private vibrationEnabled: boolean = true;

  // Request screen wake lock to keep screen on
  async requestWakeLock(): Promise<boolean> {
    if (!('wakeLock' in navigator)) {
      console.warn('[MobileOptimizer] Wake Lock API not supported');
      return false;
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('[MobileOptimizer] Wake lock acquired');

      // Re-acquire wake lock if page becomes visible again
      this.wakeLock.addEventListener('release', () => {
        console.log('[MobileOptimizer] Wake lock released');
      });

      return true;
    } catch (error) {
      console.error('[MobileOptimizer] Wake lock request failed:', error);
      return false;
    }
  }

  // Release wake lock
  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release()
        .then(() => {
          this.wakeLock = null;
          console.log('[MobileOptimizer] Wake lock released');
        })
        .catch((err: any) => {
          console.error('[MobileOptimizer] Wake lock release failed:', err);
        });
    }
  }

  // Vibrate device for feedback
  vibrate(pattern: number | number[]): boolean {
    if (!this.vibrationEnabled) return false;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (error) {
        console.warn('[MobileOptimizer] Vibration failed:', error);
        return false;
      }
    }

    return false;
  }

  // Vibration patterns
  vibrateShort(): void {
    this.vibrate(50); // 50ms
  }

  vibrateMedium(): void {
    this.vibrate(100); // 100ms
  }

  vibrateLong(): void {
    this.vibrate(200); // 200ms
  }

  vibratePattern(pattern: 'warning' | 'error' | 'success'): void {
    switch (pattern) {
      case 'warning':
        this.vibrate([100, 50, 100]); // Buzz-pause-buzz
        break;
      case 'error':
        this.vibrate([200, 100, 200, 100, 200]); // Three long buzzes
        break;
      case 'success':
        this.vibrate([50, 50, 50]); // Three short buzzes
        break;
    }
  }

  // Enable/disable vibration
  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  // Prevent mobile scrolling (for overlay)
  preventScrolling(): void {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  }

  // Allow scrolling again
  allowScrolling(): void {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }

  // Lock screen orientation (if supported)
  async lockOrientation(orientation: 'portrait' | 'landscape' = 'portrait'): Promise<boolean> {
    if (!('orientation' in screen) || !(screen.orientation as any).lock) {
      console.warn('[MobileOptimizer] Screen orientation lock not supported');
      return false;
    }

    try {
      await (screen.orientation as any).lock(orientation);
      console.log('[MobileOptimizer] Orientation locked to:', orientation);
      return true;
    } catch (error) {
      console.warn('[MobileOptimizer] Orientation lock failed:', error);
      return false;
    }
  }

  // Unlock screen orientation
  unlockOrientation(): void {
    if ('orientation' in screen && (screen.orientation as any).unlock) {
      try {
        (screen.orientation as any).unlock();
        console.log('[MobileOptimizer] Orientation unlocked');
      } catch (error) {
        console.warn('[MobileOptimizer] Orientation unlock failed:', error);
      }
    }
  }

  // Prevent text selection (for focus mode)
  preventTextSelection(): void {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }

  // Allow text selection again
  allowTextSelection(): void {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    (document.body.style as any).mozUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }

  // Show iOS "Add to Home Screen" instructions
  showIOSInstallInstructions(): void {
    // This is just a helper to remind iOS users to install as PWA
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIOS && !isInStandaloneMode) {
      console.log('[MobileOptimizer] iOS user not in PWA mode. Consider showing install prompt.');
    }
  }

  // Request persistent storage (for better offline support)
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log('[MobileOptimizer] Persistent storage:', isPersisted ? 'granted' : 'denied');
        return isPersisted;
      } catch (error) {
        console.error('[MobileOptimizer] Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  // Cleanup all mobile optimizations
  cleanup(): void {
    this.releaseWakeLock();
    this.allowScrolling();
    this.unlockOrientation();
    this.allowTextSelection();
  }
}

// Singleton instance
export const mobileOptimizer = new MobileOptimizer();

export default mobileOptimizer;
