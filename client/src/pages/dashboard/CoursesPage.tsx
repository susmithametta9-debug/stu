import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookOpen, Trash2, ChevronRight, Plus } from "lucide-react";
import { getCourseColor } from "@/lib/courseColors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Course {
  id: number;
  title: string;
  description?: string;
  courseCode?: string;
  semester?: string;
  outline?: string;
  createdAt: string;
}

interface CourseDetail extends Course {
  assignments?: any[];
  quizzes?: any[];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state for adding a course
  const [newCourse, setNewCourse] = useState({
    title: "",
    courseCode: "",
    description: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCourse(data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (response.ok) {
        setCourses(courses.filter((c) => c.id !== courseId));
        setShowDetails(false);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.title.trim()) {
      alert("Please enter a course title");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        const created = await response.json();
        setCourses([...courses, created]);
        setShowAddDialog(false);
        setNewCourse({ title: "", courseCode: "", description: "" });
      } else {
        alert("Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error creating course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Courses</h2>
          <p className="text-muted-foreground">
            {courses.length === 0
              ? "No courses yet. Upload a Canvas export to get started."
              : `You have ${courses.length} course${courses.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              No courses uploaded yet. Start by uploading a Canvas course export.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const courseColor = getCourseColor(course.id);
            return (
            <Card key={course.id} className={`hover:shadow-lg transition-shadow cursor-pointer ${courseColor.bg} border-2 ${courseColor.border}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${courseColor.text}`}>{course.title}</CardTitle>
                    {course.courseCode && (
                      <Badge className={`mt-2 ${courseColor.badge} text-white`}>
                        {course.courseCode}
                      </Badge>
                    )}
                  </div>
                </div>
                {course.description && (
                  <CardDescription className="mt-2 line-clamp-2">{course.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleViewCourse(course.id)}
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Add Course Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>Create a new course manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                value={newCourse.courseCode}
                onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                placeholder="e.g., CS 101"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddCourse} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Course
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourse.title}</DialogTitle>
                <DialogDescription>{selectedCourse.courseCode}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedCourse.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                )}

                {selectedCourse.outline && (
                  <div>
                    <h3 className="font-semibold mb-2">Course Outline / Syllabus</h3>
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedCourse.outline }}
                    />
                  </div>
                )}

                {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Assignments ({selectedCourse.assignments.length})</h3>
                    <div className="space-y-2">
                      {selectedCourse.assignments.map((assignment, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{assignment.title}</p>
                              {assignment.dueDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {assignment.pointsPossible && (
                              <Badge variant="outline">{assignment.pointsPossible} pts</Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Quizzes & Tests ({selectedCourse.quizzes.length})</h3>
                    <div className="space-y-2">
                      {selectedCourse.quizzes.map((quiz, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{quiz.title}</p>
                              {quiz.dueDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(quiz.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {quiz.pointsPossible && (
                              <Badge variant="outline">{quiz.pointsPossible} pts</Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDeleteCourse(selectedCourse.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Course
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
