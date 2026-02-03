import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, CheckSquare, Notebook, Upload, Plus, Calendar, ClipboardList, FolderOpen } from "lucide-react";
import CoursesPage from "./dashboard/CoursesPage";
import NotesPage from "./dashboard/NotesPage";
import TodoPage from "./dashboard/TodoPage";
import UploadCoursePage from "./dashboard/UploadCoursePage";
import CalendarPage from "./dashboard/CalendarPage";
import AssignmentsPage from "./dashboard/AssignmentsPage";
import FilesPage from "./dashboard/FilesPage";
import SearchPage from "./dashboard/SearchPage";
import AIChatbot from "@/components/AIChatbotNew";
import ProfileButton from "@/components/ProfileButton";
import { Sparkles } from "lucide-react";

export default function DevDashboard() {
  const [activeTab, setActiveTab] = useState("courses");
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Hub</h1>
              <p className="text-sm text-muted-foreground">Development Mode</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsChatOpen(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI Assistant
              </Button>
              <ProfileButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <Notebook className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Todos</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <CoursesPage />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <AssignmentsPage />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <NotesPage />
          </TabsContent>

          <TabsContent value="todos" className="space-y-4">
            <TodoPage />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarPage />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <FilesPage />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <SearchPage />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <UploadCoursePage onUploadSuccess={() => setActiveTab("courses")} />
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Chatbot */}
      <AIChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
