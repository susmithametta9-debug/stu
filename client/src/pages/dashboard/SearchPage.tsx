import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, FileText, Notebook, CheckSquare, File, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SearchResult {
  type: 'course' | 'assignment' | 'quiz' | 'note' | 'todo' | 'file';
  id: number;
  title: string;
  description?: string;
  content?: string;
  courseName?: string;
  dueDate?: string;
  relevance: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch all data
  const { data: courses = [] } = useQuery<any[]>({ queryKey: ["/api/courses"] });
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: ["/api/assignments/all"] });
  const { data: quizzes = [] } = useQuery<any[]>({ queryKey: ["/api/quizzes/all"] });
  const { data: notes = [] } = useQuery<any[]>({ queryKey: ["/api/notes/all"] });
  const { data: todos = [] } = useQuery<any[]>({ queryKey: ["/api/todos"] });
  const { data: files = [] } = useQuery<any[]>({ queryKey: ["/api/attachments/all"] });

  // Create course map
  const courseMap = new Map<number, string>();
  courses.forEach((course: any) => {
    courseMap.set(course.id, course.title);
  });

  // Perform search
  const searchResults: SearchResult[] = [];

  if (searchQuery.trim().length >= 2) {
    const query = searchQuery.toLowerCase();

    // Search courses
    courses.forEach((course: any) => {
      const titleMatch = course.title?.toLowerCase().includes(query);
      const descMatch = course.description?.toLowerCase().includes(query);
      const codeMatch = course.courseCode?.toLowerCase().includes(query);
      
      if (titleMatch || descMatch || codeMatch) {
        searchResults.push({
          type: 'course',
          id: course.id,
          title: course.title,
          description: course.description,
          relevance: titleMatch ? 3 : codeMatch ? 2 : 1,
        });
      }
    });

    // Search assignments
    assignments.forEach((assignment: any) => {
      const titleMatch = assignment.title?.toLowerCase().includes(query);
      const descMatch = assignment.description?.toLowerCase().includes(query);
      
      if (titleMatch || descMatch) {
        searchResults.push({
          type: 'assignment',
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          courseName: courseMap.get(assignment.courseId),
          dueDate: assignment.dueDate,
          relevance: titleMatch ? 3 : 1,
        });
      }
    });

    // Search quizzes
    quizzes.forEach((quiz: any) => {
      const titleMatch = quiz.title?.toLowerCase().includes(query);
      const descMatch = quiz.description?.toLowerCase().includes(query);
      
      if (titleMatch || descMatch) {
        searchResults.push({
          type: 'quiz',
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          courseName: courseMap.get(quiz.courseId),
          dueDate: quiz.dueDate,
          relevance: titleMatch ? 3 : 1,
        });
      }
    });

    // Search notes
    notes.forEach((note: any) => {
      const titleMatch = note.title?.toLowerCase().includes(query);
      const contentMatch = note.content?.toLowerCase().includes(query);
      
      if (titleMatch || contentMatch) {
        searchResults.push({
          type: 'note',
          id: note.id,
          title: note.title,
          content: note.content,
          relevance: titleMatch ? 3 : 1,
        });
      }
    });

    // Search todos
    todos.forEach((todo: any) => {
      const titleMatch = todo.title?.toLowerCase().includes(query);
      const descMatch = todo.description?.toLowerCase().includes(query);
      
      if (titleMatch || descMatch) {
        searchResults.push({
          type: 'todo',
          id: todo.id,
          title: todo.title,
          description: todo.description,
          courseName: todo.courseId ? courseMap.get(todo.courseId) : undefined,
          dueDate: todo.dueDate,
          relevance: titleMatch ? 3 : 1,
        });
      }
    });

    // Search files
    files.forEach((file: any) => {
      const nameMatch = file.fileName?.toLowerCase().includes(query);
      
      if (nameMatch) {
        searchResults.push({
          type: 'file',
          id: file.id,
          title: file.fileName,
          courseName: file.courseId ? courseMap.get(file.courseId) : undefined,
          relevance: 2,
        });
      }
    });
  }

  // Sort by relevance
  searchResults.sort((a, b) => b.relevance - a.relevance);

  // Filter results
  const filteredResults = activeFilter === "all" 
    ? searchResults 
    : searchResults.filter(r => r.type === activeFilter);

  // Get counts by type
  const counts = {
    all: searchResults.length,
    course: searchResults.filter(r => r.type === 'course').length,
    assignment: searchResults.filter(r => r.type === 'assignment').length,
    quiz: searchResults.filter(r => r.type === 'quiz').length,
    note: searchResults.filter(r => r.type === 'note').length,
    todo: searchResults.filter(r => r.type === 'todo').length,
    file: searchResults.filter(r => r.type === 'file').length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'assignment': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'quiz': return <CheckSquare className="w-4 h-4 text-orange-500" />;
      case 'note': return <Notebook className="w-4 h-4 text-green-500" />;
      case 'todo': return <CheckSquare className="w-4 h-4 text-pink-500" />;
      case 'file': return <File className="w-4 h-4 text-gray-500" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      course: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      assignment: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      quiz: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      note: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      todo: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
      file: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Search</h2>
        <p className="text-muted-foreground">Search across all your courses, assignments, notes, and files</p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 text-lg h-12"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery.trim().length < 2 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-center">
              Enter at least 2 characters to search
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="course">Courses ({counts.course})</TabsTrigger>
              <TabsTrigger value="assignment">Assignments ({counts.assignment})</TabsTrigger>
              <TabsTrigger value="note">Notes ({counts.note})</TabsTrigger>
              <TabsTrigger value="todo">Todos ({counts.todo})</TabsTrigger>
              <TabsTrigger value="quiz">Quizzes ({counts.quiz})</TabsTrigger>
              <TabsTrigger value="file">Files ({counts.file})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-6">
              {filteredResults.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-muted-foreground text-center">
                      No results found for "{searchQuery}"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result, index) => (
                    <Card key={`${result.type}-${result.id}-${index}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getTypeBadge(result.type)}>
                                {result.type}
                              </Badge>
                              {result.courseName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {result.courseName}
                                </span>
                              )}
                              {result.dueDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(result.dueDate), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold mb-1">{result.title}</h4>
                            {result.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            {result.content && !result.description && (
                              <div 
                                className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: result.content }}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
