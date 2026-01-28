import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FocusSession, InsertFocusSession } from "@shared/schema";
import { useAuth } from "./useAuth";

export function useFocusSessions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || "demo-user";

  const { data: sessions = [], isLoading, error } = useQuery<FocusSession[]>({
    queryKey: ["/api/focus-sessions", userId],
    queryFn: async () => {
      const response = await fetch(`/api/focus-sessions?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch focus sessions");
      }
      return response.json();
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: Partial<InsertFocusSession>) => {
      const response = await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...session }),
      });
      if (!response.ok) {
        throw new Error("Failed to create focus session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/focus-sessions", userId] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertFocusSession> }) => {
      const response = await fetch(`/api/focus-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update focus session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/focus-sessions", userId] });
    },
  });

  const completeSession = (id: string, completedDuration: number, xpEarned: number, coinsEarned: number) => {
    updateSessionMutation.mutate({
      id,
      updates: {
        isCompleted: true,
        completedDuration: completedDuration.toString(),
        completedAt: new Date(),
        xpEarned: xpEarned.toString(),
        coinsEarned: coinsEarned.toString(),
      },
    });
  };

  // Get today's total study time
  const getTodayStudyTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sessions
      .filter(s => {
        const sessionDate = new Date(s.startedAt);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime() && s.isCompleted;
      })
      .reduce((total, s) => total + parseInt(s.completedDuration), 0);
  };

  // Get weekly statistics
  const getWeeklyStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = sessions.filter(s => 
      new Date(s.startedAt) >= weekAgo && s.isCompleted
    );
    
    return {
      totalSessions: weekSessions.length,
      totalMinutes: weekSessions.reduce((total, s) => total + parseInt(s.completedDuration), 0),
      totalXP: weekSessions.reduce((total, s) => total + parseInt(s.xpEarned), 0),
      totalCoins: weekSessions.reduce((total, s) => total + parseInt(s.coinsEarned), 0),
    };
  };

  // Get monthly statistics
  const getMonthlyStats = () => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const monthSessions = sessions.filter(s => 
      new Date(s.startedAt) >= monthAgo && s.isCompleted
    );
    
    return {
      totalSessions: monthSessions.length,
      totalMinutes: monthSessions.reduce((total, s) => total + parseInt(s.completedDuration), 0),
      totalXP: monthSessions.reduce((total, s) => total + parseInt(s.xpEarned), 0),
      totalCoins: monthSessions.reduce((total, s) => total + parseInt(s.coinsEarned), 0),
    };
  };

  // Get all-time statistics
  const getAllTimeStats = () => {
    const completedSessions = sessions.filter(s => s.isCompleted);
    
    return {
      totalSessions: completedSessions.length,
      totalMinutes: completedSessions.reduce((total, s) => total + parseInt(s.completedDuration), 0),
      totalXP: completedSessions.reduce((total, s) => total + parseInt(s.xpEarned), 0),
      totalCoins: completedSessions.reduce((total, s) => total + parseInt(s.coinsEarned), 0),
      averageSessionLength: completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((total, s) => total + parseInt(s.completedDuration), 0) / completedSessions.length)
        : 0,
    };
  };

  // Get daily breakdown for the last 7 days
  const getDailyBreakdown = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startedAt);
        return sessionDate >= date && sessionDate < nextDay && s.isCompleted;
      });

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        minutes: daySessions.reduce((total, s) => total + parseInt(s.completedDuration), 0),
        sessions: daySessions.length,
      };
    });
  };

  return {
    sessions,
    isLoading,
    error,
    createSession: createSessionMutation.mutateAsync,
    updateSession: updateSessionMutation.mutate,
    completeSession,
    getTodayStudyTime,
    getWeeklyStats,
    getMonthlyStats,
    getAllTimeStats,
    getDailyBreakdown,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
  };
}
