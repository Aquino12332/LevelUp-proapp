import React from "react";
import { useGamification } from "@/lib/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import avatarImg from '@assets/generated_images/3d_student_avatar.png';

export default function Profile() {
  const { stats, userId } = useGamification();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: stats.name,
    age: "",
    gender: "",
  });

  // Fetch user stats with age and gender
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/user-stats/${userId || "demo-user"}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || "Student",
            age: data.age || "",
            gender: data.gender || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchUserProfile();
  }, [userId]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/user-stats/${userId || "demo-user"}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        setIsEditing(false);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: stats.name,
      age: "",
      gender: "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={avatarImg} 
                alt="Profile Avatar" 
                className="h-32 w-32 rounded-full bg-indigo-100 border-4 border-primary/20" 
              />
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-full border-4 border-background">
                Lvl {stats.level}
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{formData.name}</h2>
              <p className="text-muted-foreground">Level {stats.level} Scholar</p>
            </div>
            
            <div className="w-full space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">{stats.xp} / {stats.xpToNextLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Coins</span>
                <span className="font-medium text-amber-600">{stats.coins}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Streak</span>
                <span className="font-medium text-orange-600">{stats.streak} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{formData.name}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Age</Label>
                  <p className="text-lg font-medium">{formData.age || "Not specified"}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="text-lg font-medium capitalize">
                    {formData.gender 
                      ? formData.gender.replace("-", " ")
                      : "Not specified"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100">
              <div className="text-sm text-muted-foreground mb-1">Study Time</div>
              <div className="text-2xl font-bold text-indigo-600">
                {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-emerald-100">
              <div className="text-sm text-muted-foreground mb-1">Tasks Completed</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.tasksCompleted}</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
              <div className="text-sm text-muted-foreground mb-1">Total Coins</div>
              <div className="text-2xl font-bold text-amber-600">{stats.coins}</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100">
              <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
              <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
