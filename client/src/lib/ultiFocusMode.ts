// UltiFocus Mode - Strict focus mode that locks the user in the app
// Blocks all notifications and prevents leaving until session completes

import { deviceDetector } from './deviceDetection';
import { mobileOptimizer } from './mobileOptimizations';

export interface UltiFocusSession {
  id: string;
  startTime: number;
  duration: number; // in seconds
  isActive: boolean;
  isMobile: boolean;
}

class UltiFocusManager {
  private session: UltiFocusSession | null = null;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private listeners: Set<(isActive: boolean) => void> = new Set();
  private exitAttempts: number = 0;

  // Start UltiFocus session
  async start(durationInSeconds: number): Promise<void> {
    if (this.session?.isActive) {
      throw new Error('UltiFocus session already active');
    }

    console.log('[UltiFocus] Starting UltiFocus mode...');

    const deviceInfo = deviceDetector.getInfo();
    const isMobile = deviceInfo.isMobile || deviceInfo.isTablet;

    this.session = {
      id: `ultifocus-${Date.now()}`,
      startTime: Date.now(),
      duration: durationInSeconds,
      isActive: true,
      isMobile,
    };

    this.exitAttempts = 0;

    // Mobile optimizations
    if (isMobile) {
      console.log('[UltiFocus] Applying mobile optimizations...');
      
      // Request wake lock to keep screen on
      await mobileOptimizer.requestWakeLock();
      
      // Prevent scrolling
      mobileOptimizer.preventScrolling();
      
      // Prevent text selection
      mobileOptimizer.preventTextSelection();
      
      // Lock orientation to portrait (optional)
      await mobileOptimizer.lockOrientation('portrait');
      
      // Vibrate to confirm activation
      mobileOptimizer.vibratePattern('success');
    }

    // Enable full screen if supported
    await this.enterFullscreen();

    // Lock the page - prevent leaving
    this.enablePageLock();

    // Block all browser notifications
    this.blockAllNotifications();

    // Prevent tab/window switching (best effort)
    this.preventTabSwitch();

    // Notify listeners
    this.notifyListeners(true);

    console.log('[UltiFocus] UltiFocus mode activated', this.session);

    // Show activation notification
    const message = isMobile 
      ? 'Focus mode active. Screen will stay on. Complete the session to earn rewards!'
      : 'You are now locked in focus mode. Complete the session or explicitly end it to exit.';
    
    this.showUltiFocusNotification('🔒 UltiFocus Activated', message);
  }

  // End UltiFocus session
  end(reason: 'completed' | 'user-ended' | 'emergency'): void {
    if (!this.session?.isActive) {
      console.warn('[UltiFocus] No active session to end');
      return;
    }

    console.log('[UltiFocus] Ending UltiFocus mode...', reason);

    const isMobile = this.session.isMobile;

    // Disable all restrictions
    this.disablePageLock();
    this.exitFullscreen();
    
    // Mobile cleanup
    if (isMobile) {
      console.log('[UltiFocus] Cleaning up mobile optimizations...');
      mobileOptimizer.cleanup();
      
      // Vibrate based on reason
      if (reason === 'completed') {
        mobileOptimizer.vibratePattern('success');
      } else if (reason === 'user-ended' || reason === 'emergency') {
        mobileOptimizer.vibratePattern('warning');
      }
    }
    
    this.session.isActive = false;

    // Notify listeners
    this.notifyListeners(false);

    // Show completion notification
    const messages = {
      completed: '✅ UltiFocus Completed! Great work staying focused!',
      'user-ended': '⚠️ UltiFocus Ended Early. Try to complete next time!',
      emergency: '🚨 UltiFocus Emergency Exit',
    };

    this.showUltiFocusNotification('UltiFocus Ended', messages[reason]);

    // Clear session
    this.session = null;
    this.exitAttempts = 0;

    console.log('[UltiFocus] UltiFocus mode deactivated');
  }

  // Check if UltiFocus is active
  isActive(): boolean {
    return this.session?.isActive ?? false;
  }

  // Get current session info
  getSession(): UltiFocusSession | null {
    return this.session ? { ...this.session } : null;
  }

  // Get time remaining in seconds
  getTimeRemaining(): number {
    if (!this.session?.isActive) return 0;
    const elapsed = (Date.now() - this.session.startTime) / 1000;
    const remaining = this.session.duration - elapsed;
    return Math.max(0, Math.floor(remaining));
  }

  // Get exit attempts count
  getExitAttempts(): number {
    return this.exitAttempts;
  }

  // Increment exit attempts (when user tries to leave)
  incrementExitAttempts(): void {
    this.exitAttempts++;
    
    // Vibrate on mobile to provide feedback
    if (this.session?.isMobile) {
      mobileOptimizer.vibratePattern('warning');
    }
  }

  // Request emergency exit (requires confirmation)
  async requestEmergencyExit(): Promise<boolean> {
    this.incrementExitAttempts();
    
    const confirmed = window.confirm(
      '⚠️ EXIT ULTIFOCUS MODE?\n\n' +
      'You are about to end your UltiFocus session early.\n\n' +
      '❌ You will LOSE all progress and rewards for this session.\n' +
      '❌ Your focus streak may be affected.\n\n' +
      'Are you ABSOLUTELY SURE you want to quit?\n\n' +
      `(Exit attempts: ${this.exitAttempts})`
    );

    if (confirmed) {
      // Second confirmation for extra safety
      const doubleConfirm = window.confirm(
        '🚨 FINAL WARNING!\n\n' +
        'This is your last chance.\n\n' +
        'Exiting will:\n' +
        '• End your session immediately\n' +
        '• Forfeit all XP and coins\n' +
        '• Break your focus commitment\n\n' +
        'Do you really want to quit?'
      );

      if (doubleConfirm) {
        this.end('user-ended');
        return true;
      }
    }

    return false;
  }

  // Enable page lock - prevent leaving
  private enablePageLock(): void {
    // Prevent closing tab/window
    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '⚠️ UltiFocus is active! You will lose all progress if you leave.';
      this.incrementExitAttempts();
      return e.returnValue;
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Detect when user tries to switch tabs
    this.visibilityChangeHandler = () => {
      if (document.hidden && this.session?.isActive) {
        console.warn('[UltiFocus] User tried to switch tabs');
        this.incrementExitAttempts();
        
        // On mobile, just track the attempt (alert might be annoying)
        // On desktop, show alert when they come back
        if (!this.session?.isMobile) {
          setTimeout(() => {
            if (this.session?.isActive) {
              alert(
                '⚠️ Stay Focused!\n\n' +
                'UltiFocus mode is active. Stay on this page to complete your session.\n\n' +
                `Exit attempts: ${this.exitAttempts}`
              );
            }
          }, 500);
        }
      } else if (!document.hidden && this.session?.isActive && this.session?.isMobile) {
        // User returned to the page on mobile - vibrate reminder
        mobileOptimizer.vibrateShort();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', this.preventContextMenu);

    // Prevent certain keyboard shortcuts
    document.addEventListener('keydown', this.preventShortcuts);

    console.log('[UltiFocus] Page lock enabled');
  }

  // Disable page lock
  private disablePageLock(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('keydown', this.preventShortcuts);

    console.log('[UltiFocus] Page lock disabled');
  }

  // Prevent context menu
  private preventContextMenu = (e: MouseEvent): void => {
    if (this.session?.isActive) {
      e.preventDefault();
    }
  };

  // Prevent keyboard shortcuts that could help escape
  private preventShortcuts = (e: KeyboardEvent): void => {
    if (!this.session?.isActive) return;

    // Block: Ctrl+W, Ctrl+T, Ctrl+N, Alt+F4, etc.
    const blockedShortcuts = [
      e.ctrlKey && e.key === 'w', // Close tab
      e.ctrlKey && e.key === 't', // New tab
      e.ctrlKey && e.key === 'n', // New window
      e.ctrlKey && e.shiftKey && e.key === 'n', // New incognito
      e.altKey && e.key === 'F4', // Close window
      e.key === 'F11', // Fullscreen toggle (we control this)
    ];

    if (blockedShortcuts.some(blocked => blocked)) {
      e.preventDefault();
      e.stopPropagation();
      this.incrementExitAttempts();
      console.warn('[UltiFocus] Blocked keyboard shortcut:', e.key);
    }
  };

  // Enter fullscreen mode
  private async enterFullscreen(): Promise<void> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        console.log('[UltiFocus] Entered fullscreen');
      }
    } catch (error) {
      console.warn('[UltiFocus] Could not enter fullscreen:', error);
      // Not critical, continue anyway
    }
  }

  // Exit fullscreen mode
  private exitFullscreen(): void {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
        console.log('[UltiFocus] Exited fullscreen');
      }
    } catch (error) {
      console.warn('[UltiFocus] Could not exit fullscreen:', error);
    }
  }

  // Block all notifications during UltiFocus
  private blockAllNotifications(): void {
    // This sets a flag that other parts of the app can check
    localStorage.setItem('ultifocus-active', 'true');
  }

  // Prevent tab switching (show warning)
  private preventTabSwitch(): void {
    // Already handled in visibilityChangeHandler
  }

  // Show UltiFocus notification
  private showUltiFocusNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '🔒',
          tag: 'ultifocus',
          requireInteraction: false,
        });
      } catch (error) {
        console.warn('[UltiFocus] Could not show notification:', error);
      }
    }
  }

  // Subscribe to UltiFocus state changes
  onChange(callback: (isActive: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners(isActive: boolean): void {
    this.listeners.forEach(callback => callback(isActive));
  }
}

// Singleton instance
export const ultiFocusManager = new UltiFocusManager();

// Clean up on page unload (if session wasn't properly ended)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Clear any stale ultifocus flags
    const wasActive = localStorage.getItem('ultifocus-active');
    if (wasActive === 'true' && !ultiFocusManager.isActive()) {
      localStorage.removeItem('ultifocus-active');
    }
  });
}

export default ultiFocusManager;
