import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface User {
  id: string;
  username: string;
}

interface FriendWithStats {
  id: string;
  username: string;
  stats: {
    name: string;
    level: string;
    xp: string;
    streak: string;
    totalStudyTime: string;
  } | null;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: { id: string; username: string } | null;
  receiver?: { id: string; username: string } | null;
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendWithStats[]>({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/friends?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch friends");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Get incoming friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ["friendRequests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/friends/requests?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch friend requests");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Get sent friend requests
  const { data: sentRequests = [], isLoading: sentRequestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ["sentFriendRequests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/friends/requests/sent?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch sent requests");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Search users
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!user?.id || !query.trim()) return [];
    const res = await fetch(`/api/friends/search?query=${encodeURIComponent(query)}&userId=${user.id}`);
    if (!res.ok) throw new Error("Failed to search users");
    return res.json();
  };

  // Send friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.id, receiverId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentFriendRequests"] });
    },
  });

  // Accept friend request
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/friends/request/${requestId}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to accept friend request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // Reject friend request
  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/friends/request/${requestId}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reject friend request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await fetch(`/api/friends/${friendId}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove friend");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  return {
    friends,
    friendRequests,
    sentRequests,
    isLoading: friendsLoading || requestsLoading || sentRequestsLoading,
    searchUsers,
    sendFriendRequest: sendFriendRequestMutation.mutate,
    acceptFriendRequest: acceptFriendRequestMutation.mutate,
    rejectFriendRequest: rejectFriendRequestMutation.mutate,
    removeFriend: removeFriendMutation.mutate,
    isSendingRequest: sendFriendRequestMutation.isPending,
  };
}
