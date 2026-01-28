import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [username, setUsername] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");

    if (!tokenParam) {
      toast({
        title: "Error",
        description: "No reset token provided",
        variant: "destructive",
      });
      setIsVerifying(false);
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setIsValidToken(true);
        setUsername(data.username);
      } else {
        setIsValidToken(false);
        toast({
          title: "Invalid Token",
          description: data.error || "This reset link is invalid or has expired",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValidToken(false);
      toast({
        title: "Error",
        description: "Failed to verify reset token",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Reset Password
          </h1>
          {username && (
            <p className="text-muted-foreground mt-2">
              Setting new password for <strong>{username}</strong>
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
            <CardDescription>
              {isValidToken
                ? "Enter your new password below"
                : "This reset link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isValidToken ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Invalid or Expired Link</strong>
                    <p className="mt-1">
                      This password reset link is no longer valid. Reset links expire after 1 hour.
                    </p>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setLocation("/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/signin")}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            ) : resetSuccess ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Password Reset Successfully!</strong>
                    <p className="mt-1">
                      Your password has been changed. You can now sign in with your new password.
                    </p>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setLocation("/signin")}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/signin")}
                  className="w-full"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <button
              onClick={() => setLocation("/forgot-password")}
              className="text-purple-600 hover:underline font-medium"
            >
              Request new link
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
