import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useGuestTracking(isGuest: boolean) {
  const [location] = useLocation();

  useEffect(() => {
    if (!isGuest) return;

    // Generate or get session ID from localStorage
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sessionId);
    }

    // Track page visit
    const trackVisit = async () => {
      try {
        await fetch('/api/guest/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            pageVisited: location,
            deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' : 
                       /tablet|ipad/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error('Guest tracking error:', error);
      }
    };

    trackVisit();
  }, [isGuest, location]);
}
