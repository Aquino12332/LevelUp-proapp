import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, AlertCircle } from "lucide-react";
import { LIMITS } from "@shared/limits";

interface StorageInfoProps {
  counts: {
    tasks: number;
    notes: number;
    alarms: number;
    friends: number;
  };
}

export function StorageInfo({ counts }: StorageInfoProps) {
  const getPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const items = [
    {
      label: "Active Tasks",
      current: counts.tasks,
      max: LIMITS.MAX_TASKS_PER_USER,
      description: "Complete tasks to free up space",
    },
    {
      label: "Notes",
      current: counts.notes,
      max: LIMITS.MAX_NOTES_PER_USER,
      description: "Delete unused notes",
    },
    {
      label: "Alarms",
      current: counts.alarms,
      max: LIMITS.MAX_ALARMS_PER_USER,
      description: "Remove old alarms",
    },
    {
      label: "Friends",
      current: counts.friends,
      max: LIMITS.MAX_FRIENDS_PER_USER,
      description: "Manage friend list",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Storage Usage</CardTitle>
        </div>
        <CardDescription>
          Track your usage to stay within limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const percentage = getPercentage(item.current, item.max);
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(percentage)}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getStatusColor(percentage)}`}>
                    {item.current} / {item.max}
                  </span>
                  <Badge variant={percentage >= 90 ? "destructive" : percentage >= 70 ? "secondary" : "outline"}>
                    {percentage}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              {percentage >= 70 && (
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> The app automatically manages storage to ensure smooth performance for everyone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
