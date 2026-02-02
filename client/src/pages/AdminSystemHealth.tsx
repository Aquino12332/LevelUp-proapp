import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  Database, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Zap
} from "lucide-react";

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const adminSecret = sessionStorage.getItem("adminSecret");

  useEffect(() => {
    if (!adminSecret) return;
    fetchHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [adminSecret]);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/health', {
        headers: { 'x-admin-secret': adminSecret! }
      });

      if (!response.ok) throw new Error('Failed to fetch health data');

      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load system health data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-gray-600">Real-time server and database monitoring</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getStatusIcon(health.server.status)}</span>
              <div>
                <div className="text-lg font-bold capitalize">{health.server.status}</div>
                <p className="text-xs text-gray-600">
                  Uptime: {health.server.uptimeFormatted}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getStatusIcon(health.database.status)}</span>
              <div>
                <div className="text-lg font-bold capitalize">{health.database.status}</div>
                <p className="text-xs text-gray-600">
                  Ping: {health.database.ping}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Users className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <div className="text-lg font-bold">{health.load.currentLoad.concurrentUsers}</div>
                <p className="text-xs text-gray-600">
                  Capacity: {health.load.capacity.percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Server Resources</CardTitle>
          <CardDescription>CPU and memory usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">CPU Usage</span>
                <span className={`font-bold ${health.server.cpu.usage > 70 ? 'text-red-600' : 'text-gray-600'}`}>
                  {health.server.cpu.usage}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(health.server.cpu.usage)}`}
                  style={{ width: `${health.server.cpu.usage}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 capitalize">
                Status: {health.server.cpu.status}
              </p>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Memory Usage</span>
                <span className={`font-bold ${health.server.memory.percentage > 80 ? 'text-red-600' : 'text-gray-600'}`}>
                  {health.server.memory.used} / {health.server.memory.total} MB
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(health.server.memory.percentage)}`}
                  style={{ width: `${health.server.memory.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 capitalize">
                {health.server.memory.percentage}% used - Status: {health.server.memory.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle>Database Health</CardTitle>
          <CardDescription>Connection and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connections */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Connections</span>
                <span className="font-bold text-gray-600">
                  {health.database.connections.active} / {health.database.connections.max}
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(health.database.connections.percentage)}`}
                  style={{ width: `${health.database.connections.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {health.database.connections.idle} idle connections
              </p>
            </div>

            {/* Query Speed */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Query Speed</span>
                <span className="font-bold text-gray-600">
                  {health.database.performance.averageQueryTime}ms
                </span>
              </div>
              <div className="text-lg font-bold">
                {health.database.performance.averageQueryTime < 100 ? '⚡' : 
                 health.database.performance.averageQueryTime < 300 ? '✅' : '⚠️'} 
                {health.database.performance.averageQueryTime < 100 ? ' Fast' :
                 health.database.performance.averageQueryTime < 300 ? ' Normal' : ' Slow'}
              </div>
              <p className="text-xs text-gray-600">
                Average query time
              </p>
            </div>

            {/* Ping */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Connection Latency</span>
                <span className="font-bold text-gray-600">
                  {health.database.ping}ms
                </span>
              </div>
              <div className="text-lg font-bold">
                {health.database.ping < 50 ? '🟢' : 
                 health.database.ping < 100 ? '🟡' : '🔴'} 
                {health.database.ping < 50 ? ' Excellent' :
                 health.database.ping < 100 ? ' Good' : ' Poor'}
              </div>
              <p className="text-xs text-gray-600">
                Database ping time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      {health.api.endpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>API Performance</CardTitle>
            <CardDescription>Top endpoint response times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.api.endpoints.slice(0, 5).map((endpoint: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{endpoint.path}</span>
                      <span className={`${endpoint.averageTime > 500 ? 'text-red-600' : 'text-gray-600'}`}>
                        {endpoint.averageTime}ms avg
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-600">
                      <span>{endpoint.count} requests</span>
                      <span>•</span>
                      <span>Max: {endpoint.maxTime}ms</span>
                      {endpoint.errorRate > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">{endpoint.errorRate}% errors</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(endpoint.status)}>
                    {endpoint.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Warnings and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.map((alert: any, index: number) => (
                <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <AlertDescription className="mt-1">
                        {alert.details}
                      </AlertDescription>
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {alert.recommendations.map((rec: string, i: number) => (
                            <div key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <span>•</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Capacity</CardTitle>
          <CardDescription>Current load vs estimated capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">Concurrent Users</div>
                <div className="text-2xl font-bold">{health.load.currentLoad.concurrentUsers}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Estimated Capacity</div>
                <div className="text-2xl font-bold text-gray-600">{health.load.capacity.estimated}</div>
              </div>
            </div>
            
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(health.load.capacity.percentage)}`}
                style={{ width: `${health.load.capacity.percentage}%` }}
              />
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {health.load.capacity.recommendation}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
