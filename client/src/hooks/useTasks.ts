import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, InsertTask } from "@shared/schema";
import { useAuth } from "./useAuth";

export function useTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks", userId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Partial<InsertTask>) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...task }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertTask> }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
    },
  });

  const toggleTaskComplete = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({ id, updates: { completed } });
  };

  return {
    tasks,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    toggleTaskComplete,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}
