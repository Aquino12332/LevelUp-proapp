import React, { useState, useEffect, useRef } from "react";
import { useGamification } from "@/lib/gamification";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Zap, Volume2, VolumeX, Music, Coffee, Clock, TrendingUp, Award, Target, Calendar, BellOff, Bell, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import focusImg from '@assets/generated_images/3d_purple_brain_focus_icon.png';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusModeSettings } from "@/components/FocusModeSettings";
import { focusModeManager } from "@/lib/focusMode";
import { Badge } from "@/components/ui/badge";
import { UltiFocusOverlay } from "@/components/UltiFocusOverlay";
import { useUltiFocus } from "@/hooks/useUltiFocus";
import { MobileUltiFocusWarning } from "@/components/MobileUltiFocusWarning";
import { isMobileOrTablet } from "@/lib/deviceDetection";

export default function Focus() {
  const { addCoins, addXp, incrementStreak } = useGamification();
  const { createSession, completeSession, getTodayStudyTime, getWeeklyStats, getMonthlyStats, getAllTimeStats, getDailyBreakdown } = useFocusSessions();
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<"standard" | "ultifocus">("standard");
  const [ambience, setAmbience] = useState<"none" | "rain" | "lofi" | "cafe">("none");
  const [focusSettings, setFocusSettings] = useState(focusModeManager.getSettings());
  const currentSessionId = useRef<string | null>(null);
  const ultiFocus = useUltiFocus();

  // Start a new session when timer starts
  const startSession = async () => {
    setIsActive(true);
    
    // For UltiFocus mode, activate strict locking
    if (mode === "ultifocus") {
      try {
        await ultiFocus.start(duration * 60); // Convert minutes to seconds
        console.log('[Focus] UltiFocus mode activated');
      } catch (error) {
        console.error('[Focus] Failed to start UltiFocus:', error);
        alert('Failed to start UltiFocus mode. Please try again.');
        setIsActive(false);
        return;
      }
    } else {
      // For standard mode, activate regular focus mode (notification blocking)
      if (focusSettings.blockNotifications) {
        await focusModeManager.activate();
      }
    }
    
    // Create session and track the ID from the response
    try {
      const session = await createSession({
        duration: duration.toString(),
        completedDuration: "0",
        isCompleted: false,
      });
      currentSessionId.current = session.id;
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished - complete the session
      setIsActive(false);
      
      // Deactivate UltiFocus mode if active
      if (mode === "ultifocus" && ultiFocus.isActive) {
        ultiFocus.end('completed');
      }
      
      // Deactivate regular focus mode
      if (focusModeManager.isActivated()) {
        focusModeManager.deactivate();
      }
      
      const completedMinutes = duration;
      const xpEarned = mode === "ultifocus" ? 100 : 50;
      const coinsEarned = mode === "ultifocus" ? 100 : 50;
      
      if (currentSessionId.current) {
        completeSession(currentSessionId.current, completedMinutes, xpEarned, coinsEarned);
      }
      
      addCoins(coinsEarned);
      addXp(xpEarned);
      incrementStreak();
      currentSessionId.current = null;
      
      alert(`Focus session complete! +${coinsEarned} coins, +${xpEarned} XP`);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, duration]);

  const toggleTimer = () => {
    if (!isActive) {
      startSession();
    } else {
      // For UltiFocus, don't allow simple pause - user must use emergency exit
      if (mode === "ultifocus" && ultiFocus.isActive) {
        alert('⚠️ UltiFocus is locked!\n\nYou cannot pause during UltiFocus mode.\n\nUse the "Emergency Exit" button on the overlay if you must quit.');
        return;
      }
      
      // Pause the timer (standard mode only)
      setIsActive(false);
      
      // Deactivate focus mode
      if (focusModeManager.isActivated()) {
        focusModeManager.deactivate();
      }
      
      // Optionally save partial progress
      if (currentSessionId.current) {
        const completedMinutes = Math.floor((duration * 60 - timeLeft) / 60);
        if (completedMinutes > 0) {
          completeSession(currentSessionId.current, completedMinutes, 0, 0);
          currentSessionId.current = null;
        }
      }
    }
  };
  
  const resetTimer = () => {
    // For UltiFocus, don't allow reset - must complete or emergency exit
    if (mode === "ultifocus" && ultiFocus.isActive) {
      alert('⚠️ UltiFocus is locked!\n\nYou cannot reset during UltiFocus mode.\n\nUse the "Emergency Exit" button on the overlay if you must quit.');
      return;
    }
    
    setIsActive(false);
    setTimeLeft(duration * 60);
    currentSessionId.current = null;
    
    // Deactivate focus mode if active
    if (focusModeManager.isActivated()) {
      focusModeManager.deactivate();
    }
  };
  
  // Handle UltiFocus emergency exit
  const handleUltiFocusEmergencyExit = async () => {
    const confirmed = await ultiFocus.requestEmergencyExit();
    if (confirmed) {
      setIsActive(false);
      setTimeLeft(duration * 60);
      currentSessionId.current = null;
      console.log('[Focus] UltiFocus emergency exit confirmed');
    }
  };

  const handleDurationChange = (val: number[]) => {
    setDuration(val[0]);
    setTimeLeft(val[0] * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const todayMinutes = getTodayStudyTime();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const allTimeStats = getAllTimeStats();
  const dailyBreakdown = getDailyBreakdown();

  return (
    <>
      {/* UltiFocus Overlay - Full screen lock when active */}
      <UltiFocusOverlay
        isActive={ultiFocus.isActive}
        timeLeft={timeLeft}
        duration={duration}
        onEmergencyExit={handleUltiFocusEmergencyExit}
      />
      
      <div className={cn(
        "min-h-[80vh] flex flex-col items-center justify-center transition-colors duration-700",
        mode === "ultifocus" && isActive ? "bg-slate-950 text-purple-100" : ""
      )}>
        
        <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className={cn("text-4xl font-heading font-bold flex items-center justify-center gap-3", mode === "ultifocus" && isActive && "text-purple-400 animate-pulse")}>
            <img src={focusImg} className="h-10 w-10 animate-bounce-slow" />
            {mode === "ultifocus" ? "ULTIFOCUS MODE" : "Focus Session"}
          </h1>
          <p className={cn("text-muted-foreground", mode === "ultifocus" && isActive && "text-purple-300/70")}>
            {isActive ? "Stay focused. You got this." : "Ready to enter the zone?"}
          </p>
          {/* Today's stats */}
          <div className="flex items-center justify-center gap-4 text-sm pt-2">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{todayMinutes} min today</span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{weeklyStats.totalMinutes} min this week</span>
            </div>
          </div>
        </div>

        {/* Timer Circle Visual */}
        <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
          {/* Outer Glow */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000",
            isActive ? (mode === "ultifocus" ? "bg-purple-600 opacity-40" : "bg-primary opacity-30") : "bg-transparent"
          )}></div>
          
          {/* SVG Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="130"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className={cn("text-muted/20", mode === "ultifocus" && isActive && "text-purple-900/30")}
            />
            <circle
              cx="144"
              cy="144"
              r="130"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 130}
              strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-linear",
                mode === "ultifocus" ? "text-purple-500" : "text-primary"
              )}
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn("text-6xl font-mono font-bold tracking-tighter", mode === "ultifocus" && isActive && "text-white")}>
              {formatTime(timeLeft)}
            </div>
            <div className={cn("text-sm font-medium mt-2", mode === "ultifocus" && isActive ? "text-purple-300" : "text-muted-foreground")}>
              {isActive ? "In Progress" : `${duration} Minutes`}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {!isActive && (
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Duration</span>
                <span>{duration} min</span>
              </div>
              <Slider 
                defaultValue={[25]} 
                max={120} 
                step={5} 
                onValueChange={handleDurationChange}
                className="cursor-pointer"
              />
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Mode</span>
                <div className="flex bg-muted p-1 rounded-lg">
                  <button 
                    onClick={() => setMode("standard")}
                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", mode === "standard" ? "bg-background shadow-sm" : "text-muted-foreground")}
                  >
                    Standard
                  </button>
                  <button 
                    onClick={() => setMode("ultifocus")}
                    className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1", mode === "ultifocus" ? "bg-purple-600 text-white shadow-sm" : "text-muted-foreground")}
                    disabled={isActive}
                  >
                    <Zap className="h-3 w-3" /> UltiFocus
                  </button>
                </div>
              </div>
              
              {/* UltiFocus Mode Info */}
              {mode === "ultifocus" && !isActive && (
                <>
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          UltiFocus Mode - Maximum Focus Lock
                        </h4>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          When activated, UltiFocus will:
                        </p>
                        <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 ml-4">
                          {isMobileOrTablet() ? (
                            <>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Keep screen awake</strong> - Battery optimization disabled
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Vibration feedback</strong> - Feel exit attempt warnings
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Lock orientation</strong> - Prevent accidental rotation
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Track commitment</strong> - Monitor exit attempts
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Lock you in fullscreen</strong> - Cannot exit until timer completes
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Block ALL notifications</strong> - No distractions allowed
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Prevent tab switching</strong> - Stay focused on this session
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Disable shortcuts</strong> - No escape routes
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <strong>Warn on exit attempts</strong> - Track commitment level
                              </li>
                            </>
                          )}
                        </ul>
                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                          <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            Emergency exit available but will forfeit all progress and rewards
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile-specific warning */}
                  <MobileUltiFocusWarning />
                </>
              )}
              
              {/* Focus Mode Settings - Only for Standard mode */}
              {mode === "standard" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Block Notifications</span>
                      {focusSettings.blockNotifications && focusSettings.blockedSources.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {focusSettings.blockedSources.length} blocked
                        </Badge>
                      )}
                    </div>
                    <FocusModeSettings 
                      onSettingsChange={() => setFocusSettings(focusModeManager.getSettings())}
                    />
                  </div>
                  {focusSettings.blockNotifications && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                      <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Distracting notifications will be blocked during your session.
                        {focusSettings.allowCalls && " Calls will still get through."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              className={cn("h-16 w-16 rounded-full shadow-xl text-white text-lg", isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90")}
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
            </Button>
            
            {isActive && (
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-16 w-16 rounded-full shadow-md"
                onClick={resetTimer}
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Ambience Controls */}
          <div className="flex justify-center gap-4 pt-4">
             <Button 
               variant={ambience === "none" ? "default" : "outline"} 
               size="sm" 
               onClick={() => setAmbience("none")}
               className="rounded-full"
             >
               <VolumeX className="h-4 w-4 mr-2" /> Silent
             </Button>
             <Button 
               variant={ambience === "lofi" ? "default" : "outline"} 
               size="sm" 
               onClick={() => setAmbience("lofi")}
               className="rounded-full"
             >
               <Music className="h-4 w-4 mr-2" /> Lofi
             </Button>
             <Button 
               variant={ambience === "cafe" ? "default" : "outline"} 
               size="sm" 
               onClick={() => setAmbience("cafe")}
               className="rounded-full"
             >
               <Coffee className="h-4 w-4 mr-2" /> Cafe
             </Button>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="w-full max-w-5xl mx-auto mt-16 px-4 pb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Focus Analytics
        </h2>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's Stats */}
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Today</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{todayMinutes}</div>
                  <div className="text-sm text-muted-foreground">minutes focused</div>
                </div>
              </Card>

              {/* Weekly Stats */}
              <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">This Week</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{weeklyStats.totalMinutes}</div>
                  <div className="text-sm text-muted-foreground">
                    {weeklyStats.totalSessions} sessions completed
                  </div>
                </div>
              </Card>

              {/* Monthly Stats */}
              <Card className="p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">This Month</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{monthlyStats.totalMinutes}</div>
                  <div className="text-sm text-muted-foreground">
                    {monthlyStats.totalSessions} sessions completed
                  </div>
                </div>
              </Card>
            </div>

            {/* Rewards Summary */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Rewards Earned
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{weeklyStats.totalCoins}</div>
                  <div className="text-xs text-muted-foreground mt-1">Coins (Week)</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{weeklyStats.totalXP}</div>
                  <div className="text-xs text-muted-foreground mt-1">XP (Week)</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalCoins}</div>
                  <div className="text-xs text-muted-foreground mt-1">Coins (Month)</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{monthlyStats.totalXP}</div>
                  <div className="text-xs text-muted-foreground mt-1">XP (Month)</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Daily Breakdown Tab */}
          <TabsContent value="daily" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Last 7 Days Activity</h3>
              <div className="space-y-3">
                {dailyBreakdown.map((day, index) => {
                  const maxMinutes = Math.max(...dailyBreakdown.map(d => d.minutes), 1);
                  const barWidth = (day.minutes / maxMinutes) * 100;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium w-32">{day.date}</span>
                        <div className="flex-1 mx-4">
                          <div className="h-8 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 flex items-center justify-end px-3"
                              style={{ width: `${barWidth}%` }}
                            >
                              {day.minutes > 0 && (
                                <span className="text-xs font-bold text-white">{day.minutes}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-muted-foreground w-20 text-right">
                          {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-lg">All-Time Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="text-2xl font-bold">{allTimeStats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Minutes</span>
                    <span className="text-2xl font-bold">{allTimeStats.totalMinutes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Session</span>
                    <span className="text-2xl font-bold">{allTimeStats.averageSessionLength}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="text-2xl font-bold">{Math.round(allTimeStats.totalMinutes / 60)}h</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-lg">Lifetime Rewards</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Coins Earned</span>
                    <span className="text-2xl font-bold text-amber-600">{allTimeStats.totalCoins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total XP Earned</span>
                    <span className="text-2xl font-bold text-blue-600">{allTimeStats.totalXP}</span>
                  </div>
                  <div className="p-4 mt-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Productivity Score</div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {allTimeStats.totalSessions > 0 ? Math.round((allTimeStats.totalMinutes / allTimeStats.totalSessions) * allTimeStats.totalSessions / 10) : 0}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Milestones */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-lg">Milestones</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={cn("p-4 rounded-lg border-2 text-center transition-all", 
                  allTimeStats.totalSessions >= 10 ? "border-primary bg-primary/5" : "border-muted bg-muted/20 opacity-50")}>
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm font-medium">10 Sessions</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allTimeStats.totalSessions >= 10 ? "Completed!" : `${10 - allTimeStats.totalSessions} to go`}
                  </div>
                </div>
                <div className={cn("p-4 rounded-lg border-2 text-center transition-all", 
                  allTimeStats.totalMinutes >= 300 ? "border-blue-500 bg-blue-500/5" : "border-muted bg-muted/20 opacity-50")}>
                  <div className="text-2xl mb-1">⏰</div>
                  <div className="text-sm font-medium">5 Hours</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allTimeStats.totalMinutes >= 300 ? "Completed!" : `${300 - allTimeStats.totalMinutes}m to go`}
                  </div>
                </div>
                <div className={cn("p-4 rounded-lg border-2 text-center transition-all", 
                  allTimeStats.totalSessions >= 50 ? "border-purple-500 bg-purple-500/5" : "border-muted bg-muted/20 opacity-50")}>
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-sm font-medium">50 Sessions</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allTimeStats.totalSessions >= 50 ? "Completed!" : `${50 - allTimeStats.totalSessions} to go`}
                  </div>
                </div>
                <div className={cn("p-4 rounded-lg border-2 text-center transition-all", 
                  allTimeStats.totalMinutes >= 1200 ? "border-amber-500 bg-amber-500/5" : "border-muted bg-muted/20 opacity-50")}>
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-sm font-medium">20 Hours</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {allTimeStats.totalMinutes >= 1200 ? "Completed!" : `${1200 - allTimeStats.totalMinutes}m to go`}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
        {/* Background Ambience Overlay (Visual only for mockup) */}
        {mode === "ultifocus" && isActive && (
          <div className="fixed inset-0 bg-slate-950/90 z-0 pointer-events-none"></div>
        )}
      </div>
    </>
  );
}
