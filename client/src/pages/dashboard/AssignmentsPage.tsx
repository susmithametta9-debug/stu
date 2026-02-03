import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckSquare, Clock, AlertCircle, CheckCircle2, Calendar as CalendarIcon, BookOpen, Plus, FileInput, Loader2 } from "lucide-react";
import { format, isPast, isFuture, isToday, parseISO, differenceInDays } from "date-fns";
import { getCourseColor } from "@/lib/courseColors";

interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  pointsPossible: number | null;
  isCompleted?: boolean;
}

interface Quiz {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  pointsPossible: number | null;
}

interface Course {
  id: number;
  title: string;
  courseCode: string | null;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showParseDialog, setShowParseDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  // Form state for adding assignment
  const [newAssignment, setNewAssignment] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
    pointsPossible: "",
  });
  
  // Form state for parsing Canvas text
  const [parseForm, setParseForm] = useState({
    courseId: "",
    text: "",
  });

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch all assignments
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/all"],
  });

  // Fetch all quizzes
  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/all"],
  });

  // Create a map of course IDs to course names
  const courseMap = new Map<number, string>();
  courses.forEach(course => {
    courseMap.set(course.id, course.title);
  });

  // Filter by selected course
  const filteredAssignments = selectedCourse 
    ? assignments.filter(a => a.courseId === selectedCourse)
    : assignments;
  const filteredQuizzes = selectedCourse
    ? quizzes.filter(q => q.courseId === selectedCourse)
    : quizzes;

  // Categorize assignments
  const now = new Date();
  const upcomingAssignments = filteredAssignments.filter(a => a.dueDate && isFuture(parseISO(a.dueDate)));
  const overdueAssignments = filteredAssignments.filter(a => a.dueDate && isPast(parseISO(a.dueDate)) && !isToday(parseISO(a.dueDate)));
  const todayAssignments = filteredAssignments.filter(a => a.dueDate && isToday(parseISO(a.dueDate)));

  // Categorize quizzes
  const upcomingQuizzes = filteredQuizzes.filter(q => q.dueDate && isFuture(parseISO(q.dueDate)));
  const overdueQuizzes = filteredQuizzes.filter(q => q.dueDate && isPast(parseISO(q.dueDate)) && !isToday(parseISO(q.dueDate)));
  const todayQuizzes = filteredQuizzes.filter(q => q.dueDate && isToday(parseISO(q.dueDate)));

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), now);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 0) return `${Math.abs(days)} days overdue`;
    return `${days} days`;
  };

  const getUrgencyColor = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), now);
    if (days < 0) return "text-red-600 dark:text-red-400";
    if (days === 0) return "text-orange-600 dark:text-orange-400";
    if (days <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.courseId || !newAssignment.title.trim()) {
      alert("Please select a course and enter an assignment title");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: parseInt(newAssignment.courseId),
          title: newAssignment.title.trim(),
          description: newAssignment.description.trim() || null,
          dueDate: newAssignment.dueDate || null,
          pointsPossible: newAssignment.pointsPossible ? parseFloat(newAssignment.pointsPossible) : null,
        }),
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/assignments/all"] });
        setShowAddDialog(false);
        setNewAssignment({ courseId: "", title: "", description: "", dueDate: "", pointsPossible: "" });
      } else {
        alert("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Error creating assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleParseCanvas = async () => {
    if (!parseForm.courseId || !parseForm.text.trim()) {
      alert("Please select a course and paste Canvas assignment text");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/assignments/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: parseInt(parseForm.courseId),
          text: parseForm.text.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await queryClient.invalidateQueries({ queryKey: ["/api/assignments/all"] });
        setShowParseDialog(false);
        setParseForm({ courseId: "", text: "" });
        alert(`Successfully created ${result.count} assignment(s)!`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to parse assignments");
      }
    } catch (error) {
      console.error("Error parsing assignments:", error);
      alert("Error parsing assignments");
    } finally {
      setSaving(false);
    }
  };

  const AssignmentCard = ({ assignment, type = "assignment" }: { assignment: Assignment | Quiz; type?: "assignment" | "quiz" }) => {
    const courseColor = getCourseColor(assignment.courseId);
    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {type === "assignment" ? (
                <FileText className="w-4 h-4 text-blue-500" />
              ) : (
                <CheckSquare className="w-4 h-4 text-purple-500" />
              )}
              <Badge variant="outline" className={type === "assignment" ? "bg-blue-50 dark:bg-blue-950" : "bg-purple-50 dark:bg-purple-950"}>
                {type}
              </Badge>
            </div>
            <h4 className="font-semibold mb-1">{assignment.title}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${courseColor.bg} ${courseColor.text} ${courseColor.border} border`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {courseMap.get(assignment.courseId) || "Unknown Course"}
              </Badge>
            </div>
            {assignment.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
            )}
          </div>
          <div className="text-right">
            {assignment.pointsPossible && (
              <Badge variant="secondary" className="mb-2">
                {assignment.pointsPossible} pts
              </Badge>
            )}
            {assignment.dueDate && (
              <div className="space-y-1">
                <p className={`text-sm font-medium ${getUrgencyColor(assignment.dueDate)}`}>
                  {getDaysUntilDue(assignment.dueDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(assignment.dueDate), "MMM d, h:mm a")}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments & Tests</h2>
          <p className="text-muted-foreground">Manage your assignments and upcoming tests</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowParseDialog(true)} variant="outline" className="gap-2">
            <FileInput className="w-4 h-4" />
            Parse Canvas Text
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Course Filter Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCourse === null ? "default" : "outline"}
              onClick={() => setSelectedCourse(null)}
            >
              All Courses ({assignments.length + quizzes.length})
            </Button>
            {courses.map(course => {
              const courseAssignments = assignments.filter(a => a.courseId === course.id).length;
              const courseQuizzes = quizzes.filter(q => q.courseId === course.id).length;
              const total = courseAssignments + courseQuizzes;
              const courseColor = getCourseColor(course.id);
              return (
                <Button
                  key={course.id}
                  variant={selectedCourse === course.id ? "default" : "outline"}
                  onClick={() => setSelectedCourse(course.id)}
                  style={{
                    backgroundColor: selectedCourse === course.id ? courseColor.bg.replace('bg-', '').replace('-50', '') : undefined,
                    borderColor: selectedCourse === course.id ? undefined : courseColor.border.replace('border-', ''),
                  }}
                  className={`${selectedCourse === course.id ? courseColor.text : ''} border-2`}
                >
                  {course.title} ({total})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">{todayAssignments.length + todayQuizzes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{upcomingAssignments.length + upcomingQuizzes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">{overdueAssignments.length + overdueQuizzes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-2xl font-bold">{assignments.length + quizzes.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingAssignments.length === 0 && upcomingQuizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-muted-foreground text-center">
                  No upcoming assignments or tests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...upcomingAssignments, ...upcomingQuizzes]
                .sort((a, b) => {
                  if (!a.dueDate || !b.dueDate) return 0;
                  return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
                })
                .map((item) => (
                  <AssignmentCard
                    key={`${'pointsPossible' in item ? 'assignment' : 'quiz'}-${item.id}`}
                    assignment={item}
                    type={'pointsPossible' in item && 'submissionType' in item ? 'assignment' : 'quiz'}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4 mt-6">
          {todayAssignments.length === 0 && todayQuizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-muted-foreground text-center">
                  Nothing due today
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...todayAssignments, ...todayQuizzes].map((item) => (
                <AssignmentCard
                  key={`${'pointsPossible' in item ? 'assignment' : 'quiz'}-${item.id}`}
                  assignment={item}
                  type={'pointsPossible' in item && 'submissionType' in item ? 'assignment' : 'quiz'}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4 mt-6">
          {overdueAssignments.length === 0 && overdueQuizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-muted-foreground text-center">
                  No overdue assignments
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...overdueAssignments, ...overdueQuizzes]
                .sort((a, b) => {
                  if (!a.dueDate || !b.dueDate) return 0;
                  return parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime();
                })
                .map((item) => (
                  <AssignmentCard
                    key={`${'pointsPossible' in item ? 'assignment' : 'quiz'}-${item.id}`}
                    assignment={item}
                    type={'pointsPossible' in item && 'submissionType' in item ? 'assignment' : 'quiz'}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Assignment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
            <DialogDescription>Create a new assignment manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course">Course *</Label>
              <Select value={newAssignment.courseId} onValueChange={(value) => setNewAssignment({ ...newAssignment, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="e.g., Homework 1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Assignment description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={newAssignment.pointsPossible}
                  onChange={(e) => setNewAssignment({ ...newAssignment, pointsPossible: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddAssignment} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Assignment
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Parse Canvas Text Dialog */}
      <Dialog open={showParseDialog} onOpenChange={setShowParseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parse Canvas Assignment Text</DialogTitle>
            <DialogDescription>
              Paste assignment text from Canvas and we'll automatically extract titles, due dates, and points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="parseCourse">Course *</Label>
              <Select value={parseForm.courseId} onValueChange={(value) => setParseForm({ ...parseForm, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="canvasText">Canvas Assignment Text *</Label>
              <Textarea
                id="canvasText"
                value={parseForm.text}
                onChange={(e) => setParseForm({ ...parseForm, text: e.target.value })}
                placeholder="Paste Canvas assignment text here...&#10;&#10;Example:&#10;Homework 1 due Jan 29 at 9:50pm - 100 pts&#10;Quiz 1 due Feb 5 at 11:59pm - 50 pts"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleParseCanvas} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Parse & Create Assignments
              </Button>
              <Button variant="outline" onClick={() => setShowParseDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
