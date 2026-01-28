import React, { useState, useEffect } from "react";
import { useGamification } from "@/lib/gamification";
import { useFriends } from "@/hooks/useFriends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Medal, Users, UserPlus, X, Check, Search, 
  UserMinus, Clock, Loader2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function Social() {
  const { stats } = useGamification();
  const { 
    friends, 
    friendRequests, 
    sentRequests,
    isLoading, 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest,
    removeFriend,
    isSendingRequest 
  } = useFriends();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState<"global" | "friends">("global");

  // Fetch global leaderboard data
  const { data: globalLeaderboardData, isLoading: isLoadingGlobal } = useQuery({
    queryKey: ["/api/leaderboard/global"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/global?limit=100");
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
    enabled: leaderboardView === "global",
  });

  // Build leaderboard based on selected view
  const leaderboard = React.useMemo(() => {
    if (leaderboardView === "friends") {
      // Friends-only leaderboard
      const friendsData = friends.map(friend => ({
        id: friend.id,
        name: friend.username,
        xp: friend.stats ? parseInt(friend.stats.xp) : 0,
        level: friend.stats ? parseInt(friend.stats.level) : 1,
        avatar: friend.username.substring(0, 2).toUpperCase(),
        isUser: false,
      }));

      // Add current user
      const allUsers = [
        ...friendsData,
        {
          id: "current",
          name: stats.name,
          xp: stats.xp,
          level: stats.level,
          avatar: stats.name.substring(0, 2).toUpperCase(),
          isUser: true,
        }
      ];

      // Sort by XP and assign ranks
      return allUsers
        .sort((a, b) => b.xp - a.xp)
        .map((user, idx) => ({ ...user, rank: idx + 1 }));
    } else {
      // Global leaderboard with real data
      if (!globalLeaderboardData) return [];
      
      const globalUsers = globalLeaderboardData.map((userStat: any) => ({
        id: userStat.userId,
        name: userStat.name,
        xp: parseInt(userStat.xp),
        level: parseInt(userStat.level),
        avatar: userStat.name.substring(0, 2).toUpperCase(),
        isUser: userStat.userId === stats.userId,
      }));

      // Sort by XP and assign ranks
      return globalUsers
        .sort((a, b) => b.xp - a.xp)
        .map((user, idx) => ({ ...user, rank: idx + 1 }));
    }
  }, [leaderboardView, friends, stats, globalLeaderboardData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not search for users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendFriendRequest(receiverId);
      toast({
        title: "Friend request sent!",
        description: "Wait for them to accept your request",
      });
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      toast({
        title: "Could not send request",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast({
        title: "Friend added!",
        description: "You are now friends",
      });
    } catch (error) {
      toast({
        title: "Could not accept request",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast({
        title: "Request rejected",
      });
    } catch (error) {
      toast({
        title: "Could not reject request",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendId: string, username: string) => {
    if (!confirm(`Remove ${username} from your friends?`)) return;
    
    try {
      await removeFriend(friendId);
      toast({
        title: "Friend removed",
        description: `${username} has been removed from your friends`,
      });
    } catch (error) {
      toast({
        title: "Could not remove friend",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Leaderboard Section */}
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {leaderboardView === "global" ? "Global Rankings" : "Friends Rankings"}
          </h1>
          <div className="flex bg-muted p-1 rounded-lg gap-1">
             <button 
               onClick={() => setLeaderboardView("global")}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                 leaderboardView === "global" 
                   ? "bg-background font-bold shadow-sm" 
                   : "text-muted-foreground hover:text-foreground"
               }`}
             >
               Global
             </button>
             <button 
               onClick={() => setLeaderboardView("friends")}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                 leaderboardView === "friends" 
                   ? "bg-background font-bold shadow-sm" 
                   : "text-muted-foreground hover:text-foreground"
               }`}
             >
               Friends
             </button>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-b from-card to-muted/20">
          <CardContent className="p-0">
             {isLoadingGlobal && leaderboardView === "global" ? (
               <div className="p-8 text-center text-muted-foreground">
                 <Loader2 className="h-12 w-12 mx-auto mb-3 opacity-50 animate-spin" />
                 <p className="font-medium">Loading global rankings...</p>
               </div>
             ) : leaderboard.length > 0 ? (
               leaderboard.map((user) => (
                 <div 
                   key={user.id}
                   className={`flex items-center p-4 border-b last:border-0 hover:bg-muted/50 transition-colors ${user.isUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                 >
                   <div className="w-12 font-bold text-xl text-muted-foreground flex justify-center">
                     {user.rank === 1 ? <Medal className="h-6 w-6 text-yellow-500" /> : 
                      user.rank === 2 ? <Medal className="h-6 w-6 text-slate-400" /> :
                      user.rank === 3 ? <Medal className="h-6 w-6 text-amber-700" /> :
                      `#${user.rank}`}
                   </div>
                   <Avatar className="h-10 w-10 border-2 border-background mr-4">
                     <AvatarFallback className={user.isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>{user.avatar}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1">
                     <h3 className={`font-bold ${user.isUser ? 'text-primary' : ''}`}>{user.name} {user.isUser && '(You)'}</h3>
                     <p className="text-xs text-muted-foreground">Lvl {user.level} Scholar</p>
                   </div>
                   <div className="font-mono font-bold text-lg text-right">
                     {user.xp.toLocaleString()} <span className="text-xs text-muted-foreground font-sans">XP</span>
                   </div>
                 </div>
               ))
             ) : (
               <div className="p-8 text-center text-muted-foreground">
                 <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p className="font-medium">{leaderboardView === "global" ? "No users yet" : "No friends yet"}</p>
                 <p className="text-sm mt-1">{leaderboardView === "global" ? "Be the first to join!" : "Add friends to see them in the leaderboard!"}</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Friends Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <Users className="h-5 w-5" /> Study Buddies
             {friendRequests.length > 0 && (
               <Badge variant="destructive" className="ml-2">{friendRequests.length}</Badge>
             )}
           </h2>
           <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
             <DialogTrigger asChild>
               <Button size="icon" variant="ghost">
                 <UserPlus className="h-4 w-4" />
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add Friend</DialogTitle>
                 <DialogDescription>Search for users by username</DialogDescription>
               </DialogHeader>
               <div className="space-y-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     placeholder="Search username..."
                     value={searchQuery}
                     onChange={(e) => handleSearch(e.target.value)}
                     className="pl-9"
                   />
                 </div>
                 
                 {isSearching && (
                   <div className="flex justify-center py-4">
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                   </div>
                 )}
                 
                 <div className="max-h-[300px] overflow-y-auto space-y-2">
                   {searchResults.map((user) => {
                     const alreadySent = sentRequests.some(req => req.receiverId === user.id);
                     const alreadyFriends = friends.some(f => f.id === user.id);
                     
                     return (
                       <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                             <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <span className="font-medium">{user.username}</span>
                         </div>
                         {alreadyFriends ? (
                           <Badge variant="secondary">Friends</Badge>
                         ) : alreadySent ? (
                           <Badge variant="outline">Sent</Badge>
                         ) : (
                           <Button
                             size="sm"
                             onClick={() => handleSendRequest(user.id)}
                             disabled={isSendingRequest}
                           >
                             Add
                           </Button>
                         )}
                       </div>
                     );
                   })}
                   {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                     <p className="text-center text-muted-foreground text-sm py-4">No users found</p>
                   )}
                 </div>
               </div>
             </DialogContent>
           </Dialog>
        </div>

        <div className="grid gap-4">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {request.sender?.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{request.sender?.username}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : friends.length > 0 ? (
            friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{friend.username}</h4>
                    <p className="text-xs text-muted-foreground">
                      Level {friend.stats ? Math.floor(parseInt(friend.stats.level)) : 1} • 
                      {friend.stats ? ` ${parseInt(friend.stats.xp).toLocaleString()} XP` : ' 0 XP'}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveFriend(friend.id, friend.username)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="font-bold text-sm">No Friends Yet</h4>
                <p className="text-xs text-muted-foreground">Add friends to study together and compete!</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setAddFriendOpen(true)}
                >
                  Add Friends
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
