import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GamificationProvider } from "@/lib/gamification";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SplashScreen from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { useAlarmManager } from "@/hooks/useAlarmManager";
import { AlarmRinging } from "@/components/AlarmRinging";

import Dashboard from "@/pages/Dashboard";
import Planner from "@/pages/Planner";
import Notes from "@/pages/Notes";
import Focus from "@/pages/Focus";
import Social from "@/pages/Social";
import Shop from "@/pages/Shop";
import Alarm from "@/pages/Alarm";
import Profile from "@/pages/Profile";
import SignIn from "@/pages/SignIn";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

function Router() {
  // Global alarm manager - works on all pages
  const { activeAlarm, snoozeAlarm, dismissAlarm } = useAlarmManager();

  return (
    <>
      <Switch>
        <Route path="/signin" component={SignIn} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="*">
          {() => (
            <AppLayout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/planner" component={Planner} />
                <Route path="/notes" component={Notes} />
                <Route path="/focus" component={Focus} />
                <Route path="/social" component={Social} />
                <Route path="/shop" component={Shop} />
                <Route path="/alarm" component={Alarm} />
                <Route path="/profile" component={Profile} />
                <Route component={NotFound} />
              </Switch>
            </AppLayout>
          )}
        </Route>
      </Switch>

      {/* Global alarm notification - shows on any page */}
      {activeAlarm && (
        <AlarmRinging
          label={activeAlarm.label}
          time={activeAlarm.time}
          snoozeOptions={activeAlarm.snoozeOptions}
          onSnooze={snoozeAlarm}
          onDismiss={dismissAlarm}
        />
      )}
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setHasShownSplash(true);
    sessionStorage.setItem("splashShown", "true");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GamificationProvider>
        <TooltipProvider>
          <Toaster />
          <OfflineIndicator />
          {showSplash && !hasShownSplash ? (
            <SplashScreen onFinish={handleSplashFinish} />
          ) : (
            <Router />
          )}
        </TooltipProvider>
      </GamificationProvider>
    </QueryClientProvider>
  );
}

export default App;
