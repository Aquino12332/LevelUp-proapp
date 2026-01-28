import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface User {
  id: string;
  username: string;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check if user is authenticated
  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    retry: false,
  });

  // Store userId in localStorage when user is authenticated
  useEffect(() => {
    if (authData?.user?.id) {
      localStorage.setItem('userId', authData.user.id);
      
      // Re-subscribe to push notifications with the correct userId
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async (registration) => {
          try {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              // Update subscription on server with correct userId
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, userId: authData.user.id })
              });
              console.log('Push subscription updated with userId:', authData.user.id);
            }
          } catch (error) {
            console.error('Failed to update push subscription:', error);
          }
        });
      }
    }
  }, [authData?.user?.id]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem('userId');
      queryClient.clear();
      setLocation("/signin");
    },
  });

  return {
    user: authData?.user,
    isAuthenticated: !!authData?.user,
    isLoading,
    logout: () => logoutMutation.mutate(),
  };
}
