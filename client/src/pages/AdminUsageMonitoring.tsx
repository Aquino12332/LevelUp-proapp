import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Target, 
  CheckCircle, 
  Users,
  TrendingUp,
  Download,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TimeRange = 'today' | 'week' | 'month';

export default function AdminUsageMonitoring() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [studyTimeTrend, setStudyTimeTrend] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [studentUsage, setStudentUsage] = useState<any[]>([]);

  const adminSecret = sessionStorage.getItem("adminSecret");

  useEffect(() => {
    if (!adminSecret) return;
    fetchData();
  }, [timeRange, adminSecret]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'x-admin-secret': adminSecret! };

      const [overviewRes, trendRes, hoursRes, studentsRes] = await Promise.all([
        fetch(`/api/admin/analytics/overview?range=${timeRange}`, { headers }),
        fetch(`/api/admin/analytics/study-time-trend?range=${timeRange}`, { headers }),
        fetch(`/api/admin/analytics/peak-hours?range=${timeRange}`, { headers }),
        fetch(`/api/admin/analytics/student-usage?range=${timeRange}`, { headers }),
      ]);

      if (!overviewRes.ok) {
        const errorText = await overviewRes.text();
        console.error('API Error:', overviewRes.status, errorText);
        throw new Error(`Failed to fetch data: ${overviewRes.status}`);
      }

      const overviewData = await overviewRes.json();
      const trendData = await trendRes.json();
      const hoursData = await hoursRes.json();
      const studentsData = await studentsRes.json();

      setOverview(overviewData);
      setStudyTimeTrend(trendData);
      setPeakHours(hoursData);
      setStudentUsage(studentsData);
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/export?type=${type}&range=${timeRange}`, {
        headers: { 'x-admin-secret': adminSecret! },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usage Monitoring</h2>
          <p className="text-gray-600">Track student activity and engagement</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'today' ? 'default' : 'outline'}
            onClick={() => setTimeRange('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
            size="sm"
          >
            This Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            size="sm"
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
              <Clock className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(overview.totalStudyTime)}</div>
              <p className="text-xs text-gray-600 mt-1">Across all students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Focus Sessions</CardTitle>
              <Target className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalSessions}</div>
              <p className="text-xs text-gray-600 mt-1">
                Avg: {formatMinutes(overview.averageSessionDuration)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.tasksCompleted}</div>
              <p className="text-xs text-gray-600 mt-1">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{overview.activeToday}</div>
              <p className="text-xs text-gray-600 mt-1">
                of {overview.totalUsers} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Study Time Trend */}
      {studyTimeTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Study Time Trend</CardTitle>
            <CardDescription>Daily study time over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {studyTimeTrend.map((day, i) => {
                const maxMinutes = Math.max(...studyTimeTrend.map(d => d.minutes));
                const height = (day.minutes / maxMinutes) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-gray-600 font-medium">
                      {formatMinutes(day.minutes)}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${formatMinutes(day.minutes)} (${day.sessions} sessions)`}
                    />
                    <div className="text-xs text-gray-500">
                      {new Date(day.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Peak Usage Hours</CardTitle>
              <CardDescription>When students are most active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {peakHours.map((hour) => {
                  const maxCount = Math.max(...peakHours.map(h => h.count));
                  const height = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
                  return (
                    <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${hour.label}: ${hour.count} activities`}
                      />
                      <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                        {hour.hour % 3 === 0 ? hour.hour : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>Most used app features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview?.featureUsage?.slice(0, 5).map((feature: any) => (
                  <div key={feature.feature} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{feature.feature}</span>
                        <span className="text-gray-600">{feature.count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                          style={{ width: `${feature.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{feature.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Usage Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Student Activity</CardTitle>
              <CardDescription>Individual student usage statistics</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport('students')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Study Time</th>
                  <th className="pb-3 font-medium">Sessions</th>
                  <th className="pb-3 font-medium">Tasks Done</th>
                  <th className="pb-3 font-medium">Level</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studentUsage.slice(0, 10).map((student) => (
                  <tr key={student.userId} className="text-sm">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{student.username}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      {formatMinutes(student.totalStudyTime)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {student.sessionCount}
                    </td>
                    <td className="py-3 text-gray-600">
                      {student.tasksCompleted}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">Level {student.level}</Badge>
                    </td>
                    <td className="py-3">
                      {student.isOnline ? (
                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                      ) : (
                        <Badge variant="secondary">Offline</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
