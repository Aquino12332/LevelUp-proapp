// Device detection utilities for mobile optimization

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  hasFullscreenSupport: boolean;
  hasWakeLockSupport: boolean;
  hasVibrationSupport: boolean;
  hasBeforeUnloadSupport: boolean;
  browserName: string;
  osName: string;
}

class DeviceDetector {
  private info: DeviceInfo | null = null;

  // Detect device information
  detect(): DeviceInfo {
    if (this.info) return this.info;

    const ua = navigator.userAgent;
    const platform = navigator.platform;

    // Detect mobile/tablet
    const isMobile = /iPhone|iPod|Android.*Mobile/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    const isDesktop = !isMobile && !isTablet;

    // Detect OS
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // Detect browser
    const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua);

    // Feature detection
    const hasFullscreenSupport = !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );

    const hasWakeLockSupport = 'wakeLock' in navigator;
    const hasVibrationSupport = 'vibrate' in navigator;
    
    // iOS Safari doesn't support beforeunload reliably
    const hasBeforeUnloadSupport = !isIOS;

    // Browser name
    let browserName = 'Unknown';
    if (isChrome) browserName = 'Chrome';
    else if (isSafari) browserName = 'Safari';
    else if (/Firefox/i.test(ua)) browserName = 'Firefox';
    else if (/Edge/i.test(ua)) browserName = 'Edge';

    // OS name
    let osName = 'Unknown';
    if (isIOS) osName = 'iOS';
    else if (isAndroid) osName = 'Android';
    else if (/Windows/i.test(ua)) osName = 'Windows';
    else if (/Mac/i.test(ua)) osName = 'macOS';
    else if (/Linux/i.test(ua)) osName = 'Linux';

    this.info = {
      isMobile,
      isTablet,
      isDesktop,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      hasFullscreenSupport,
      hasWakeLockSupport,
      hasVibrationSupport,
      hasBeforeUnloadSupport,
      browserName,
      osName,
    };

    return this.info;
  }

  // Quick checks
  isMobile(): boolean {
    return this.detect().isMobile;
  }

  isTablet(): boolean {
    return this.detect().isTablet;
  }

  isDesktop(): boolean {
    return this.detect().isDesktop;
  }

  isMobileOrTablet(): boolean {
    const info = this.detect();
    return info.isMobile || info.isTablet;
  }

  isIOS(): boolean {
    return this.detect().isIOS;
  }

  isAndroid(): boolean {
    return this.detect().isAndroid;
  }

  // Get full info
  getInfo(): DeviceInfo {
    return this.detect();
  }

  // Check if feature is supported
  supportsFullscreen(): boolean {
    return this.detect().hasFullscreenSupport;
  }

  supportsWakeLock(): boolean {
    return this.detect().hasWakeLockSupport;
  }

  supportsVibration(): boolean {
    return this.detect().hasVibrationSupport;
  }

  supportsBeforeUnload(): boolean {
    return this.detect().hasBeforeUnloadSupport;
  }

  // Get limitation message for mobile
  getMobileLimitations(): string[] {
    const info = this.detect();
    const limitations: string[] = [];

    if (!info.hasFullscreenSupport) {
      limitations.push('Fullscreen mode not available');
    }

    if (!info.hasBeforeUnloadSupport) {
      limitations.push('Exit warnings may not appear');
    }

    if (info.isIOS) {
      limitations.push('iOS: Home button and app switching cannot be blocked');
    }

    if (info.isAndroid) {
      limitations.push('Android: Back button and notification panel cannot be blocked');
    }

    if (info.isMobile) {
      limitations.push('Native app notifications cannot be blocked');
    }

    return limitations;
  }

  // Get effectiveness rating
  getEffectivenessRating(): { score: number; label: string; color: string } {
    const info = this.detect();

    if (info.isDesktop) {
      return { score: 90, label: 'High', color: 'green' };
    }

    if (info.isAndroid && info.isChrome) {
      return { score: 60, label: 'Medium', color: 'yellow' };
    }

    if (info.isIOS) {
      return { score: 40, label: 'Low', color: 'orange' };
    }

    if (info.isMobile) {
      return { score: 50, label: 'Medium-Low', color: 'yellow' };
    }

    return { score: 70, label: 'Good', color: 'green' };
  }
}

// Singleton instance
export const deviceDetector = new DeviceDetector();

// Convenience exports
export const isMobile = () => deviceDetector.isMobile();
export const isTablet = () => deviceDetector.isTablet();
export const isDesktop = () => deviceDetector.isDesktop();
export const isMobileOrTablet = () => deviceDetector.isMobileOrTablet();
export const isIOS = () => deviceDetector.isIOS();
export const isAndroid = () => deviceDetector.isAndroid();
export const getDeviceInfo = () => deviceDetector.getInfo();

export default deviceDetector;
