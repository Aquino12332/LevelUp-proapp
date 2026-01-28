import React from "react";
import { useGamification } from "@/lib/gamification";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ArrowRight, Zap, CalendarCheck, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { format } from "date-fns";
import fireImg from '@assets/generated_images/3d_fire_flame_icon.png';
import coinImg from '@assets/generated_images/3d_gold_coin_icon.png';
import avatarImg from '@assets/generated_images/3d_student_avatar.png';

export default function Dashboard() {
  const { stats, addCoins, addXp } = useGamification();
  const { tasks, toggleTaskComplete } = useTasks();

  // Get today's incomplete tasks (limit to 3)
  const dailyTasks = tasks.filter(t => !t.completed).slice(0, 3);

  const handleCompleteTask = (id: string) => {
    toggleTaskComplete(id, true);
    addCoins(10);
    addXp(15);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
            Good Morning, {stats.name.split(' ')[0]}! ☀️
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            You're on a <span className="text-orange-500 font-bold">{stats.streak} day streak</span>. Keep it up!
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="relative">
            <img src={avatarImg} alt="Avatar" className="h-16 w-16 rounded-full bg-indigo-100" />
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full border-2 border-background">
              Lvl {stats.level}
            </div>
          </div>
          <div className="space-y-1 min-w-[120px]">
            <div className="flex justify-between text-xs font-medium">
              <span>XP Progress</span>
              <span>{Math.round((stats.xp / stats.xpToNextLevel) * 100)}%</span>
            </div>
            <Progress value={(stats.xp / stats.xpToNextLevel) * 100} className="h-2.5" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gamify-card bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
            <img src={fireImg} className="h-12 w-12 drop-shadow-md" />
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
              <div className="text-xs font-medium text-orange-400 uppercase tracking-wider">Day Streak</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gamify-card bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
            <img src={coinImg} className="h-12 w-12 drop-shadow-md" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.coins}</div>
              <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Coins</div>
            </div>
          </CardContent>
        </Card>

        <Card className="gamify-card bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
            <Clock className="h-10 w-10 text-indigo-500" />
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">4.5h</div>
              <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Study Time</div>
            </div>
          </CardContent>
        </Card>

        <Card className="gamify-card bg-gradient-to-br from-emerald-50 to-green-50 border-green-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">12</div>
              <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Tasks Done</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Today's Plan */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Today's Focus
            </h2>
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="text-muted-foreground">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {dailyTasks.length === 0 ? (
              <div className="p-8 rounded-xl border-2 border-dashed text-center text-muted-foreground">
                <p>No pending tasks. Great job! 🎉</p>
              </div>
            ) : (
              dailyTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-xl border flex items-center gap-4 transition-all bg-card border-border hover:border-primary/50 shadow-sm">
                  <div 
                    onClick={() => handleCompleteTask(task.id)}
                    className="h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors border-muted-foreground hover:border-primary"
                  >
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" /> 
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold text-[10px]">+10 Coins +15 XP</span>
                    </div>
                  </div>
                  <Link href="/planner">
                    <Button size="sm" variant="secondary" className="h-8">View</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Quest / Random */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Daily Quest
            </h2>
            
            <Card className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border-none shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-20 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
              <CardContent className="p-6 relative z-10">
                <div className="inline-block bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-md mb-3 border border-yellow-500/30">
                  RARE QUEST
                </div>
                <h3 className="text-lg font-bold mb-2">The Early Bird</h3>
                <p className="text-slate-300 text-sm mb-4">Complete a 25-minute focus session before 9:00 AM.</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Progress</span>
                    <span>0/1</span>
                  </div>
                  <Progress value={0} className="h-2 bg-slate-700" />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                    <Star className="h-4 w-4 fill-current" />
                    <span>+50 XP</span>
                  </div>
                  <Link href="/focus">
                    <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-200 font-bold">
                      Accept
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
