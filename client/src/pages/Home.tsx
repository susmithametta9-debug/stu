import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Notebook, CheckSquare, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Hub</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Your All-in-One Academic Organizer
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Upload Canvas courses, organize assignments, take notes, and manage your tasks all in one place
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <LogIn className="w-5 h-5" />
            Enter Student Hub
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Canvas Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your Canvas course exports and automatically extract assignments, quizzes, schedules, and course materials
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Notebook className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>OneNote-Style Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create subject-wise notebooks with organized pages for taking rich, formatted notes with full editing capabilities
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Todo Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stay organized with a powerful todo list featuring priorities, due dates, categories, and progress tracking
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}