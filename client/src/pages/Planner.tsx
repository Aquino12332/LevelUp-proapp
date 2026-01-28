import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, Plus, Check, Trash2, Tag, Bell, BellRing, X, Repeat } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useGamification } from "@/lib/gamification";
import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Alarm } from "@shared/schema";

export default function Planner() {
  const { addCoins, addXp } = useGamification();
  const { tasks, isLoading, createTask, toggleTaskComplete, deleteTask } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskCategory, setNewTaskCategory] = useState<"general" | "study" | "work" | "personal">("study");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  const [alarmTime, setAlarmTime] = useState("");
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarmSound, setAlarmSound] = useState<"bell" | "chime" | "buzz" | "piano">("bell");
  const [taskAlarms, setTaskAlarms] = useState<Record<string, Alarm>>({});
  
  // Recurring task states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekdays" | "weekends" | "custom">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    // Check if this is a high-priority task
    if (newTaskPriority === "high") {
      setAlarmLabel(`${newTaskTitle} - Task Reminder`);
      setShowAlarmDialog(true);
      return;
    }
    
    // Prepare recurring task data
    const taskData: any = {
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: date || new Date(),
      completed: false,
    };

    // Add recurring fields if enabled
    if (isRecurring) {
      taskData.isRecurring = true;
      taskData.recurrenceType = recurrenceType;
      taskData.recurringGroupId = crypto.randomUUID(); // Create a group ID for this recurring task
      
      if (recurrenceType === "custom") {
        taskData.recurrenceDays = JSON.stringify(selectedDays);
      } else {
        // Auto-set days based on type
        if (recurrenceType === "weekdays") {
          taskData.recurrenceDays = JSON.stringify([1, 2, 3, 4, 5]); // Mon-Fri
        } else if (recurrenceType === "weekends") {
          taskData.recurrenceDays = JSON.stringify([0, 6]); // Sun, Sat
        } else {
          taskData.recurrenceDays = JSON.stringify([]); // Daily = all days
        }
      }
    }
    
    // Create task
    createTask(taskData, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create task",
          variant: "destructive",
        });
      }
    });
    
    // Reset form
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskCategory("study");
    setIsRecurring(false);
    setRecurrenceType("daily");
    setSelectedDays([]);
    setIsDialogOpen(false);
  };

  const handleCreateAlarm = async () => {
    if (!alarmTime) {
      toast({
        title: "Time Required",
        description: "Please set an alarm time",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = user?.id || "default-user";
      
      // Create the alarm first
      const alarmResponse = await fetch("/api/alarms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          label: alarmLabel,
          time: alarmTime,
          enabled: true,
          sound: alarmSound,
          repeatDays: "[]",
        }),
      });

      if (!alarmResponse.ok) {
        throw new Error("Failed to create alarm");
      }

      const alarm = await alarmResponse.json();

      // Create the task with the alarm ID
      createTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
        category: newTaskCategory,
        dueDate: date || new Date(),
        completed: false,
        alarmId: alarm.id,
      }, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Task created with alarm at ${alarmTime}`,
          });
          setIsDialogOpen(false);
          setShowAlarmDialog(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to create task",
            variant: "destructive",
          });
        }
      });

      // Reset form
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskCategory("study");
      setAlarmTime("");
      setAlarmLabel("");
      setAlarmSound("bell");
      setIsDialogOpen(false);
      setShowAlarmDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task with alarm",
        variant: "destructive",
      });
    }
  };

  const handleSkipAlarm = () => {
    // Create task without alarm
    createTask({
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: date || new Date(),
      completed: false,
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        setIsDialogOpen(false);
        setShowAlarmDialog(false);
        
        // Reset form
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskCategory("study");
        setAlarmTime("");
        setAlarmLabel("");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create task",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleTask = (id: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;
    toggleTaskComplete(id, newCompleted);
    if (newCompleted) {
      addCoins(15);
      addXp(20);
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "study": return "bg-purple-100 text-purple-700 border-purple-200";
      case "work": return "bg-blue-100 text-blue-700 border-blue-200";
      case "personal": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-gray-400";
      default: return "border-l-gray-300";
    }
  };

  const handleSetReminder = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if task already has an alarm
    if (task.alarmId) {
      toast({
        title: "Alarm Already Set",
        description: "This task already has an alarm configured.",
      });
      return;
    }

    // Set up alarm dialog for existing task
    setAlarmLabel(`${task.title} - Task Reminder`);
    setShowAlarmDialog(true);
    
    // Store the task ID for later use
    (window as any).__currentTaskForAlarm = taskId;
  };

  const handleAddAlarmToExistingTask = async () => {
    const taskId = (window as any).__currentTaskForAlarm;
    if (!taskId || !alarmTime) {
      toast({
        title: "Error",
        description: "Missing task or alarm time",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = user?.id || "default-user";
      
      // Create the alarm
      const alarmResponse = await fetch("/api/alarms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          label: alarmLabel,
          time: alarmTime,
          enabled: true,
          sound: alarmSound,
          repeatDays: "[]",
        }),
      });

      if (!alarmResponse.ok) {
        throw new Error("Failed to create alarm");
      }

      const alarm = await alarmResponse.json();

      // Update the task with the alarm ID
      const updateResponse = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alarmId: alarm.id }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update task");
      }

      toast({
        title: "Alarm Added",
        description: `Alarm set for ${alarmTime}`,
      });

      // Reset
      setAlarmTime("");
      setAlarmLabel("");
      setAlarmSound("bell");
      setShowAlarmDialog(false);
      (window as any).__currentTaskForAlarm = null;
      
      // Refresh tasks to show updated alarm status
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add alarm to task",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Smart Planner</h1>
          <p className="text-muted-foreground">Organize your academic life and earn rewards.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input 
                  placeholder="e.g. Calculus Chapter 3" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input 
                  placeholder="Add details..." 
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newTaskCategory} onValueChange={(v: any) => setNewTaskCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Recurring Task Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Make this a recurring task</Label>
                  <Button
                    type="button"
                    variant={isRecurring ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRecurring(!isRecurring)}
                  >
                    {isRecurring ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                {isRecurring && (
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label>Repeat</Label>
                      <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Every Day</SelectItem>
                          <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                          <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                          <SelectItem value="custom">Custom Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {recurrenceType === "custom" && (
                      <div className="space-y-2">
                        <Label>Select Days</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                            <Button
                              key={idx}
                              type="button"
                              variant={selectedDays.includes(idx) ? "default" : "outline"}
                              size="sm"
                              className="h-10 w-full text-xs"
                              onClick={() => {
                                if (selectedDays.includes(idx)) {
                                  setSelectedDays(selectedDays.filter(d => d !== idx));
                                } else {
                                  setSelectedDays([...selectedDays, idx]);
                                }
                              }}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-xs text-blue-700">
                        <strong>📅 Daily Tasks:</strong> This task will automatically be created each day based on your schedule. Complete it daily to maintain your streak!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleAddTask} className="w-full">
                {isRecurring ? "Create Recurring Task" : "Add to Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alarm Configuration Dialog */}
        <Dialog open={showAlarmDialog} onOpenChange={setShowAlarmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Set Task Alarm
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>High Priority Task!</strong> Set an alarm to remind you about this important task.
              </div>
              
              <div className="space-y-2">
                <Label>Alarm Label</Label>
                <Input 
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Task reminder"
                />
              </div>

              <div className="space-y-2">
                <Label>Alarm Time</Label>
                <Input 
                  type="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  placeholder="HH:MM"
                />
              </div>

              <div className="space-y-2">
                <Label>Alarm Sound</Label>
                <Select value={alarmSound} onValueChange={(v: any) => setAlarmSound(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="buzz">Buzz</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSkipAlarm}
                >
                  Skip Alarm
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={(window as any).__currentTaskForAlarm ? handleAddAlarmToExistingTask : handleCreateAlarm}
                >
                  <BellRing className="h-4 w-4" />
                  Set Alarm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 flex-1">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full flex justify-center"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 border-none shadow-none bg-transparent">
          <Tabs defaultValue="list" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Tasks for {date ? format(date, "MMMM do") : "Today"}</h2>
              <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="list" className="space-y-3 mt-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
                  <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p>No tasks yet. Add one to get started!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-xl border-l-4 bg-card border transition-all hover:shadow-md",
                      task.completed ? "opacity-60" : "",
                      getPriorityColor(task.priority)
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                          task.completed 
                            ? "bg-green-500 border-green-500 scale-110" 
                            : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {task.completed && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </h3>
                          {task.alarmId && (
                            <BellRing className="h-3.5 w-3.5 text-primary animate-pulse" />
                          )}
                          {task.isRecurring && (
                            <Repeat className="h-3.5 w-3.5 text-blue-500" title="Recurring task" />
                          )}
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", getCategoryColor(task.category))}>
                            {task.category}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {task.priority} priority
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 
                            {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                          </span>
                          {!task.completed && (
                            <span className="text-xs text-amber-600 font-medium">+15 coins, +20 XP</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetReminder(task.id)}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this task?")) {
                            handleDeleteTask(task.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="timeline">
              <div className="text-center p-10 text-muted-foreground">
                Timeline view coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
