import { useEffect, useState } from "react";
import { Target } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete and call onFinish after fade out animation
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative">
          {/* Pulsing background circle */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          
          {/* Main logo container */}
          <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl animate-bounce">
            <Target className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* App Name with fade-in animation */}
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <h1 className="font-heading font-bold text-4xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LevelUp
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Gamified Student Productivity
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2 mt-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
