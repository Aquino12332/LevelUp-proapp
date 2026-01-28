import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bell,
  BellOff,
  Phone,
  AlarmClock,
  Star,
  CheckCircle2,
  Circle,
  Settings,
} from 'lucide-react';
import { NOTIFICATION_SOURCES, focusModeManager } from '@/lib/focusMode';
import { cn } from '@/lib/utils';

interface FocusModeSettingsProps {
  onSettingsChange?: () => void;
}

export function FocusModeSettings({ onSettingsChange }: FocusModeSettingsProps) {
  const [settings, setSettings] = useState(focusModeManager.getSettings());
  const [open, setOpen] = useState(false);

  const handleToggleSource = (sourceId: string) => {
    focusModeManager.toggleSource(sourceId);
    const newSettings = focusModeManager.getSettings();
    setSettings(newSettings);
    onSettingsChange?.();
  };

  const handleUpdateSetting = (key: keyof typeof settings, value: any) => {
    focusModeManager.updateSettings({ [key]: value });
    const newSettings = focusModeManager.getSettings();
    setSettings(newSettings);
    onSettingsChange?.();
  };

  const handleBlockAll = () => {
    focusModeManager.blockAll();
    const newSettings = focusModeManager.getSettings();
    setSettings(newSettings);
    onSettingsChange?.();
  };

  const handleUnblockAll = () => {
    focusModeManager.unblockAll();
    const newSettings = focusModeManager.getSettings();
    setSettings(newSettings);
    onSettingsChange?.();
  };

  const blockedCount = settings.blockedSources.length;
  const totalCount = NOTIFICATION_SOURCES.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Focus Settings
          {settings.blockNotifications && blockedCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {blockedCount} blocked
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Focus Mode Settings
          </DialogTitle>
          <DialogDescription>
            Choose which notifications to block during focus sessions. Calls and alarms can always get through.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Toggle */}
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <BellOff className="h-4 w-4" />
                  Enable Notification Blocking
                </Label>
                <p className="text-sm text-muted-foreground">
                  Block distracting notifications during focus sessions
                </p>
              </div>
              <Switch
                checked={settings.blockNotifications}
                onCheckedChange={(checked) => handleUpdateSetting('blockNotifications', checked)}
              />
            </div>
          </Card>

          {/* Exception Settings */}
          {settings.blockNotifications && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Always Allow</h3>
                <p className="text-xs text-muted-foreground">These will never be blocked</p>
              </div>

              <div className="grid gap-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <Label className="font-medium">Phone Calls</Label>
                        <p className="text-xs text-muted-foreground">Allow incoming call notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowCalls}
                      onCheckedChange={(checked) => handleUpdateSetting('allowCalls', checked)}
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <AlarmClock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label className="font-medium">Alarms & Timers</Label>
                        <p className="text-xs text-muted-foreground">Allow alarm and timer notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowAlarms}
                      onCheckedChange={(checked) => handleUpdateSetting('allowAlarms', checked)}
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Star className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <Label className="font-medium">Priority Notifications</Label>
                        <p className="text-xs text-muted-foreground">Allow important/urgent notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowPriority}
                      onCheckedChange={(checked) => handleUpdateSetting('allowPriority', checked)}
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Block Specific Apps */}
          {settings.blockNotifications && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Block Specific Categories</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBlockAll}
                    className="text-xs"
                  >
                    Block All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnblockAll}
                    className="text-xs"
                  >
                    Unblock All
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {blockedCount} of {totalCount} categories blocked
              </div>

              <div className="grid gap-2">
                {NOTIFICATION_SOURCES.map((source) => {
                  const isBlocked = settings.blockedSources.includes(source.id);
                  return (
                    <Card
                      key={source.id}
                      className={cn(
                        'p-4 cursor-pointer transition-all hover:bg-muted/50',
                        isBlocked && 'border-red-500/30 bg-red-500/5'
                      )}
                      onClick={() => handleToggleSource(source.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{source.icon}</div>
                          <div>
                            <Label className="font-medium cursor-pointer">{source.name}</Label>
                            <p className="text-xs text-muted-foreground">{source.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBlocked ? (
                            <>
                              <Badge variant="destructive" className="text-xs">
                                Blocked
                              </Badge>
                              <CheckCircle2 className="h-5 w-5 text-red-500" />
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                Allowed
                              </Badge>
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {settings.blockNotifications && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Focus Mode Summary</p>
                  <p className="text-muted-foreground">
                    {blockedCount === 0 && 'No notifications will be blocked'}
                    {blockedCount > 0 && blockedCount < totalCount && (
                      <>
                        {blockedCount} {blockedCount === 1 ? 'category' : 'categories'} will be blocked
                      </>
                    )}
                    {blockedCount === totalCount && 'All notifications will be blocked'}
                    {(settings.allowCalls || settings.allowAlarms || settings.allowPriority) && (
                      <span>
                        , except{' '}
                        {[
                          settings.allowCalls && 'calls',
                          settings.allowAlarms && 'alarms',
                          settings.allowPriority && 'priority',
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
