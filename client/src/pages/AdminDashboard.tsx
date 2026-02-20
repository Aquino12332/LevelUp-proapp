import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  Activity, 
  Smartphone, 
  Monitor, 
  Tablet,
  LogOut,
  Search,
  Key,
  Clock,
  TrendingUp,
  BarChart3,
  Server,
  Shield,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AdminUsageMonitoring from "./AdminUsageMonitoring";
import AdminSystemHealth from "./AdminSystemHealth";

type UserWithStats = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  isOnline?: boolean;
  deviceType?: string;
  stats?: {
    name: string;
    level: string;
    xp: string;
    totalStudyTime: string;
    tasksCompleted: string;
    lastActiveDate?: string;
  };
};

type AdminStats = {
  totalUsers: number;
  onlineUsers: number;
  activeToday: number;
  recentRegistrations: number;
  deviceBreakdown: Record<string, number>;
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const adminSecret = sessionStorage.getItem("adminSecret");

  useEffect(() => {
    if (!adminSecret) {
      setLocation("/admin/login");
      return;
    }
    fetchData();
  }, [adminSecret]);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users", {
          headers: { "x-admin-secret": adminSecret! },
        }),
        fetch("/api/admin/stats", {
          headers: { "x-admin-secret": adminSecret! },
        }),
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch admin data");
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      });
      setLocation("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminSecret");
    setLocation("/admin/login");
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    setResetting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret!,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: `Password reset successfully for ${selectedUser.username}`,
      });

      setResetDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "online" && user.isOnline) ||
      (statusFilter === "offline" && !user.isOnline);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case "mobile": return <Smartphone className="w-4 h-4" />;
      case "tablet": return <Tablet className="w-4 h-4" />;
      case "desktop": return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare device chart data
  const deviceChartData = stats?.deviceBreakdown 
    ? Object.entries(stats.deviceBreakdown).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
    : [];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  // Mock peak hours data - memoized to prevent re-generation on every render
  // In production, this would come from your API based on actual user activity
  const peakHours = useMemo(() => {
    // Simulate realistic activity patterns (higher during study hours)
    const generateRealisticActivity = (hour: number) => {
      // Night hours (12 AM - 6 AM): Very low activity
      if (hour >= 0 && hour < 6) return Math.floor(Math.random() * 20) + 5;
      // Morning (6 AM - 9 AM): Low to medium
      if (hour >= 6 && hour < 9) return Math.floor(Math.random() * 40) + 20;
      // Late morning (9 AM - 12 PM): Medium
      if (hour >= 9 && hour < 12) return Math.floor(Math.random() * 60) + 40;
      // Afternoon (12 PM - 6 PM): High activity (after school)
      if (hour >= 12 && hour < 18) return Math.floor(Math.random() * 80) + 70;
      // Evening (6 PM - 10 PM): Peak activity (homework/study time)
      if (hour >= 18 && hour < 22) return Math.floor(Math.random() * 50) + 100;
      // Late night (10 PM - 12 AM): Medium to low
      return Math.floor(Math.random() * 40) + 30;
    };

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      count: generateRealisticActivity(i)
    }));
  }, []); // Empty dependency array = only generate once when component mounts

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/80 via-purple-50/50 to-fuchsia-50/80 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/30">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span>Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold">Welcome, Admin</h1>
              <p className="text-sm opacity-90 mt-1">Monitor and manage your student community</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={fetchData}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-none hover:scale-105 transition-transform shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
                  <Users className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-xs opacity-90">All registered students</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-none hover:scale-105 transition-transform shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Online Now</CardTitle>
                  <UserCheck className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.onlineUsers || 0}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs opacity-90">Currently active</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none hover:scale-105 transition-transform shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Active Today</CardTitle>
                  <Activity className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.activeToday || 0}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs opacity-90">Last 24 hours</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-700 text-white border-none hover:scale-105 transition-transform shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">New This Week</CardTitle>
                  <TrendingUp className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.recentRegistrations || 0}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-xs opacity-90">Recent registrations</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device Distribution & Activity Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Device Distribution Pie Chart */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-purple-200/50 transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    Device Distribution
                  </CardTitle>
                  <CardDescription>How students access the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {deviceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-400">
                      No device data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Heatmap - Improved Clarity */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/20 shadow-2xl hover:shadow-blue-200/50 transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Peak Activity Hours
                  </CardTitle>
                  <CardDescription>Student activity throughout the day</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time Periods */}
                  <div className="space-y-3">
                    {/* Night (12 AM - 6 AM) */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded">🌙 Night (12 AM - 6 AM)</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {peakHours.slice(0, 6).map((hour) => (
                          <div
                            key={hour.hour}
                            className={cn(
                              "h-14 rounded-lg flex flex-col items-center justify-center font-medium transition-all hover:scale-105 cursor-pointer shadow-sm",
                              hour.count > 100 ? "bg-purple-600 text-white" :
                              hour.count > 50 ? "bg-purple-400 text-white" :
                              hour.count > 20 ? "bg-purple-200 text-purple-900" :
                              "bg-gray-100 text-gray-600"
                            )}
                            title={`${hour.hour === 0 ? '12' : hour.hour} AM: ${hour.count} activities`}
                          >
                            <div className="text-base font-bold">{hour.hour === 0 ? '12' : hour.hour}</div>
                            <div className="text-xs opacity-75">AM</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Morning (6 AM - 12 PM) */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <span className="bg-yellow-50 px-2 py-1 rounded">🌅 Morning (6 AM - 12 PM)</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {peakHours.slice(6, 12).map((hour) => (
                          <div
                            key={hour.hour}
                            className={cn(
                              "h-14 rounded-lg flex flex-col items-center justify-center font-medium transition-all hover:scale-105 cursor-pointer shadow-sm",
                              hour.count > 100 ? "bg-purple-600 text-white" :
                              hour.count > 50 ? "bg-purple-400 text-white" :
                              hour.count > 20 ? "bg-purple-200 text-purple-900" :
                              "bg-gray-100 text-gray-600"
                            )}
                            title={`${hour.hour} AM: ${hour.count} activities`}
                          >
                            <div className="text-base font-bold">{hour.hour}</div>
                            <div className="text-xs opacity-75">AM</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Afternoon (12 PM - 6 PM) */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <span className="bg-blue-50 px-2 py-1 rounded">☀️ Afternoon (12 PM - 6 PM)</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {peakHours.slice(12, 18).map((hour) => {
                          const displayHour = hour.hour === 12 ? 12 : hour.hour - 12;
                          return (
                            <div
                              key={hour.hour}
                              className={cn(
                                "h-14 rounded-lg flex flex-col items-center justify-center font-medium transition-all hover:scale-105 cursor-pointer shadow-sm",
                                hour.count > 100 ? "bg-purple-600 text-white" :
                                hour.count > 50 ? "bg-purple-400 text-white" :
                                hour.count > 20 ? "bg-purple-200 text-purple-900" :
                                "bg-gray-100 text-gray-600"
                              )}
                              title={`${displayHour} PM: ${hour.count} activities`}
                            >
                              <div className="text-base font-bold">{displayHour}</div>
                              <div className="text-xs opacity-75">PM</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evening (6 PM - 12 AM) */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <span className="bg-purple-50 px-2 py-1 rounded">🌆 Evening (6 PM - 12 AM)</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {peakHours.slice(18, 24).map((hour) => {
                          const displayHour = hour.hour - 12;
                          return (
                            <div
                              key={hour.hour}
                              className={cn(
                                "h-14 rounded-lg flex flex-col items-center justify-center font-medium transition-all hover:scale-105 cursor-pointer shadow-sm",
                                hour.count > 100 ? "bg-purple-600 text-white" :
                                hour.count > 50 ? "bg-purple-400 text-white" :
                                hour.count > 20 ? "bg-purple-200 text-purple-900" :
                                "bg-gray-100 text-gray-600"
                              )}
                              title={`${displayHour} PM: ${hour.count} activities`}
                            >
                              <div className="text-base font-bold">{displayHour}</div>
                              <div className="text-xs opacity-75">PM</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300" />
                      <span className="text-xs font-medium text-gray-600">Low Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-200 rounded" />
                      <span className="text-xs font-medium text-gray-600">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-400 rounded" />
                      <span className="text-xs font-medium text-gray-600">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-600 rounded" />
                      <span className="text-xs font-medium text-gray-600">Peak</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  All Students
                </CardTitle>
                <CardDescription>Manage student accounts and track activity</CardDescription>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="online">Online Only</SelectItem>
                      <SelectItem value="offline">Offline Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3 rounded-tl-lg">Student</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">Last Login</th>
                        <th className="px-4 py-3">Study Time</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((user, index) => (
                        <tr 
                          key={user.id} 
                          className={cn(
                            "text-sm hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors",
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                user.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
                              )} />
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {user.isOnline ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Online</Badge>
                            ) : (
                              <Badge variant="secondary">Offline</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(user.deviceType)}
                              <span className="capitalize text-gray-600 dark:text-gray-400">{user.deviceType || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{formatDate(user.lastLoginAt)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {user.stats?.totalStudyTime || "0"} min
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400">
                              Level {user.stats?.level || "1"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setResetDialogOpen(true);
                              }}
                              className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors"
                            >
                              <Key className="w-3 h-3 mr-1" />
                              Reset
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No students found matching your filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Monitoring Tab */}
          <TabsContent value="analytics">
            <AdminUsageMonitoring />
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health">
            <AdminSystemHealth />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.username} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <Alert>
              <AlertDescription>
                The password will be changed immediately. The student will need to use this new password to login.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={resetting || newPassword.length < 6}
            >
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
