import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserStats as DBUserStats } from '@shared/schema';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  coins: number;
  streak: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  name: string;
  avatar: string; // URL
  totalStudyTime: number;
  tasksCompleted: number;
}

interface GamificationContextType {
  stats: UserStats;
  addCoins: (amount: number) => void;
  addXp: (amount: number) => void;
  incrementStreak: () => void;
  buyItem: (cost: number) => boolean;
  isLoading: boolean;
  userId: string | null;
}

// Convert DB stats to client stats
function convertToClientStats(dbStats: DBUserStats): UserStats {
  const level = parseInt(dbStats.level);
  const xp = parseInt(dbStats.xp);
  const xpToNextLevel = Math.floor(1000 * Math.pow(1.2, level - 1));
  
  return {
    coins: parseInt(dbStats.coins),
    streak: parseInt(dbStats.streak),
    level,
    xp,
    xpToNextLevel,
    name: dbStats.name,
    avatar: "",
    totalStudyTime: parseInt(dbStats.totalStudyTime),
    tasksCompleted: parseInt(dbStats.tasksCompleted),
  };
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { getXpMultiplier, getCoinMultiplier } = usePowerUps();
  const { user } = useAuth();
  
  // Use authenticated user ID or fallback to demo-user for backwards compatibility
  const userId = user?.id || "demo-user";

  // Fetch stats from backend
  const { data: dbStats, isLoading } = useQuery<DBUserStats>({
    queryKey: ['/api/user-stats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user-stats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
    enabled: !!userId, // Only run query when userId is available
  });

  const stats = dbStats ? convertToClientStats(dbStats) : {
    coins: 0,
    streak: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    name: "Student",
    avatar: "",
    totalStudyTime: 0,
    tasksCompleted: 0,
  };

  // Mutation to update stats
  const updateStatsMutation = useMutation({
    mutationFn: async (updates: Partial<DBUserStats>) => {
      const response = await fetch(`/api/user-stats/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update stats');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-stats', userId] });
    },
  });

  const addCoins = (amount: number) => {
    // Apply coin multiplier from active power-ups
    const multiplier = getCoinMultiplier();
    const multipliedAmount = Math.floor(amount * multiplier);
    const newCoins = stats.coins + multipliedAmount;
    updateStatsMutation.mutate({ coins: newCoins.toString() });
  };

  const addXp = (amount: number) => {
    // Apply XP multiplier from active power-ups
    const multiplier = getXpMultiplier();
    const multipliedAmount = Math.floor(amount * multiplier);
    
    let newXp = stats.xp + multipliedAmount;
    let newLevel = stats.level;

    // Check for level up
    if (newXp >= stats.xpToNextLevel) {
      newXp -= stats.xpToNextLevel;
      newLevel += 1;
      // Level up logic (could trigger a modal here)
    }

    updateStatsMutation.mutate({ 
      xp: newXp.toString(),
      level: newLevel.toString(),
    });
  };

  const incrementStreak = () => {
    const newStreak = stats.streak + 1;
    updateStatsMutation.mutate({ 
      streak: newStreak.toString(),
      lastActiveDate: new Date(),
    });
  };

  const buyItem = (cost: number) => {
    if (stats.coins >= cost) {
      const newCoins = stats.coins - cost;
      updateStatsMutation.mutate({ coins: newCoins.toString() });
      return true;
    }
    return false;
  };

  return (
    <GamificationContext.Provider value={{ stats, addCoins, addXp, incrementStreak, buyItem, isLoading, userId }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
