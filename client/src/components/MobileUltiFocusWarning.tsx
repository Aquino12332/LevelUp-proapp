import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Smartphone,
  AlertTriangle,
  Wifi,
  Battery,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { deviceDetector } from '@/lib/deviceDetection';

export function MobileUltiFocusWarning() {
  const deviceInfo = deviceDetector.getInfo();
  const isMobile = deviceInfo.isMobile || deviceInfo.isTablet;
  
  if (!isMobile) return null;

  const effectiveness = deviceDetector.getEffectivenessRating();
  const limitations = deviceDetector.getMobileLimitations();

  return (
    <Card className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Mobile Device Detected
              </h4>
              <Badge 
                variant="secondary" 
                className={`
                  ${effectiveness.color === 'green' && 'bg-green-500/20 text-green-700 dark:text-green-300'}
                  ${effectiveness.color === 'yellow' && 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'}
                  ${effectiveness.color === 'orange' && 'bg-orange-500/20 text-orange-700 dark:text-orange-300'}
                `}
              >
                {effectiveness.label} Effectiveness ({effectiveness.score}%)
              </Badge>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {deviceInfo.osName} • {deviceInfo.browserName}
            </p>
          </div>
        </div>

        {/* What Works */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Mobile Optimizations Active:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Screen stays awake
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Vibration feedback
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Scrolling disabled
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Exit attempt tracking
            </div>
          </div>
        </div>

        {/* Limitations */}
        {limitations.length > 0 && (
          <Alert className="bg-orange-500/10 border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Mobile Browser Limitations:
              </p>
              <ul className="space-y-1 text-xs ml-5">
                {limitations.map((limitation, index) => (
                  <li key={index} className="list-disc">{limitation}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Tips */}
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Tips for Best Results:
          </p>
          <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <Battery className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Ensure your device is charged or plugged in</span>
            </li>
            <li className="flex items-start gap-2">
              <Wifi className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Close other apps to minimize distractions</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Put your device in Do Not Disturb mode</span>
            </li>
            {deviceInfo.isIOS && (
              <li className="flex items-start gap-2">
                <Smartphone className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Install as PWA from Safari Share menu for better experience</span>
              </li>
            )}
          </ul>
        </div>

        {/* Commitment Message */}
        <div className="text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400 italic">
            UltiFocus on mobile relies on your commitment. Stay strong! 💪
          </p>
        </div>
      </div>
    </Card>
  );
}
