import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Calendar, 
  NotebookPen, 
  Target, 
  ShoppingBag, 
  Users,
  Menu,
  Bell,
  Clock,
  UserCircle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamification } from '@/lib/gamification';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Assets
import coinImg from '@assets/generated_images/3d_gold_coin_icon.png';
import fireImg from '@assets/generated_images/3d_fire_flame_icon.png';
import avatarImg from '@assets/generated_images/3d_student_avatar.png';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { stats } = useGamification();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Calendar, label: 'Planner', href: '/planner' },
    { icon: NotebookPen, label: 'Notes+', href: '/notes' },
    { icon: Target, label: 'Focus', href: '/focus' },
    { icon: Users, label: 'Social', href: '/social' },
    { icon: Clock, label: 'Alarms', href: '/alarm' },
    { icon: ShoppingBag, label: 'Shop', href: '/shop' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
             <Target className="h-6 w-6 text-primary" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight">LevelUp</span>
        </div>

        <div className="px-4 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full p-4 rounded-xl bg-sidebar-accent border border-sidebar-border flex flex-col gap-3 hover:bg-sidebar-accent/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <img src={avatarImg} alt="Avatar" className="h-10 w-10 rounded-full bg-white border border-border" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">{stats.name}</span>
                    <span className="text-xs text-muted-foreground">Lvl {stats.level} Scholar</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>XP</span>
                    <span>{stats.xp} / {stats.xpToNextLevel}</span>
                  </div>
                  <Progress value={(stats.xp / stats.xpToNextLevel) * 100} className="h-2" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-amber-500 font-bold">
              <img src={coinImg} className="h-6 w-6 object-contain" />
              <span>{stats.coins}</span>
            </div>
            <div className="flex items-center gap-2 text-orange-500 font-bold">
              <img src={fireImg} className="h-6 w-6 object-contain" />
              <span>{stats.streak}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Layout & Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-heading font-bold text-xl">LevelUp</span>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <img src={coinImg} className="h-5 w-5" />
                {stats.coins}
             </div>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <UserCircle className="h-5 w-5" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <DropdownMenuLabel>{stats.name}</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                   <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                     <UserCircle className="h-4 w-4" />
                     <span>Profile</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                   <LogOut className="h-4 w-4 mr-2" />
                   <span>Logout</span>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 pb-28 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 z-50 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="flex items-center h-full px-2 pb-safe min-w-max gap-1">
            {navItems.map((item) => {
               const isActive = location === item.href;
               return (
                 <Link 
                   key={item.href} 
                   href={item.href}
                   className={cn(
                     "flex flex-col items-center justify-center p-2 rounded-lg gap-1 flex-shrink-0 min-w-[72px]",
                     isActive ? "text-primary" : "text-muted-foreground"
                   )}
                 >
                   <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                   <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                 </Link>
               )
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
