import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Lock,
  AlertTriangle,
  Target,
  Clock,
  Zap,
  Shield,
  LogOut,
  Smartphone,
  Vibrate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ultiFocusManager } from '@/lib/ultiFocusMode';
import { deviceDetector } from '@/lib/deviceDetection';

interface UltiFocusOverlayProps {
  isActive: boolean;
  timeLeft: number;
  duration: number;
  onEmergencyExit: () => void;
}

export function UltiFocusOverlay({
  isActive,
  timeLeft,
  duration,
  onEmergencyExit,
}: UltiFocusOverlayProps) {
  const [exitAttempts, setExitAttempts] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [deviceInfo] = useState(() => deviceDetector.getInfo());
  const isMobile = deviceInfo.isMobile || deviceInfo.isTablet;

  useEffect(() => {
    if (isActive) {
      // Update exit attempts periodically
      const interval = setInterval(() => {
        setExitAttempts(ultiFocusManager.getExitAttempts());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  useEffect(() => {
    if (exitAttempts > 0) {
      setShowWarning(true);
      const timeout = setTimeout(() => setShowWarning(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [exitAttempts]);

  if (!isActive) return null;

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-sm">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Lock className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <h1 className="text-white font-bold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                UltiFocus Mode
              </h1>
              <p className="text-xs text-purple-200">Locked until session complete</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              <Shield className="h-3 w-3 mr-1" />
              Protected
            </Badge>
            {exitAttempts > 0 && (
              <Badge variant="destructive">
                {exitAttempts} exit {exitAttempts === 1 ? 'attempt' : 'attempts'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex items-center justify-center px-4 pt-20 pb-8">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <div className="p-8 space-y-6">
            {/* Timer Display */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                <div className="flex items-center justify-center w-28 h-28 rounded-full bg-white/90">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-900">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      Remaining
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-white/70">
                  {Math.round(progress)}% Complete
                </p>
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-3">
              <Alert className="bg-blue-500/20 border-blue-400/50 text-white">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Stay focused!</strong> You're locked in UltiFocus mode. Complete your session to earn maximum rewards.
                </AlertDescription>
              </Alert>

              {showWarning && (
                <Alert className="bg-red-500/20 border-red-400/50 text-white animate-pulse">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Detected exit attempt!</strong> Leaving now will forfeit all progress and rewards.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Features Blocked Notice */}
            <div className="bg-black/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-white flex items-center gap-2">
                {isMobile ? (
                  <Smartphone className="h-4 w-4 text-purple-300" />
                ) : (
                  <Shield className="h-4 w-4 text-purple-300" />
                )}
                {isMobile ? 'Mobile Optimizations Active:' : 'Protected Features During UltiFocus:'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                {isMobile ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Screen stays awake
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Vibration feedback
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Exit attempt tracking
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Scrolling disabled
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Orientation locked
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Full immersion mode
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      All notifications blocked
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Tab switching prevented
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Context menu disabled
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Keyboard shortcuts blocked
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Page exit confirmation
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                      Fullscreen mode active
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Rewards Preview */}
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-200 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Potential Rewards:
              </p>
              <div className="flex items-center justify-around text-center">
                <div>
                  <div className="text-2xl font-bold text-amber-300">+100</div>
                  <div className="text-xs text-amber-200/70">XP</div>
                </div>
                <div className="w-px h-8 bg-amber-400/30"></div>
                <div>
                  <div className="text-2xl font-bold text-amber-300">+100</div>
                  <div className="text-xs text-amber-200/70">Coins</div>
                </div>
                <div className="w-px h-8 bg-amber-400/30"></div>
                <div>
                  <div className="text-2xl font-bold text-amber-300">2x</div>
                  <div className="text-xs text-amber-200/70">Multiplier</div>
                </div>
              </div>
            </div>

            {/* Emergency Exit Button */}
            <div className="pt-4 border-t border-white/10">
              <Button
                variant="destructive"
                size="lg"
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-white"
                onClick={onEmergencyExit}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Emergency Exit (Forfeit Progress)
              </Button>
              <p className="text-xs text-center text-white/50 mt-2">
                ⚠️ Exiting will forfeit all XP, coins, and streak progress
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Started: {new Date(Date.now() - (duration * 60 - timeLeft) * 1000).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>Goal: {duration} minutes</span>
              </div>
            </div>
            <div className="text-white/40">
              {isMobile ? (
                <span className="flex items-center gap-1">
                  <Vibrate className="h-3 w-3" />
                  Haptic feedback on exit attempts
                </span>
              ) : (
                'Press ESC to request exit'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
