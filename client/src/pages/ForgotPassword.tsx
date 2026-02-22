import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Forgot Password?
          </h1>
          <p className="text-muted-foreground mt-2">
            No worries, we're here to help!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Need Password Reset?</CardTitle>
            <CardDescription>
              Contact us through any of these channels and we'll help you reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-blue-200 bg-blue-50">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <p className="font-semibold mb-3">
                  If you forgot your password, please chat with these accounts:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      FB
                    </div>
                    <div>
                      <p className="font-medium text-sm">Facebook Page</p>
                      <a 
                        href="https://facebook.com/levelupproapp" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline text-sm"
                      >
                        LevelUp Proapp
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email Support</p>
                      <a 
                        href="mailto:timothyaquino438@gmail.com"
                        className="text-blue-700 hover:underline text-sm"
                      >
                        timothyaquino438@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-blue-800">
                  💡 We'll reset your password manually and send you the new credentials!
                </p>
              </AlertDescription>
            </Alert>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/signin")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Remember your password?{" "}
            <button
              onClick={() => setLocation("/signin")}
              className="text-purple-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
