import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Paperclip, X, File, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Todo {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  dayOfWeek?: string | null;
  priority: "low" | "medium" | "high";
  isCompleted: number;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: number;
  todoId: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: string;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TodoPage() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showNewTodo, setShowNewTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showTopPriorities, setShowTopPriorities] = useState(true);

  // Fetch todos from API
  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Fetch attachments for todos
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments/todos"],
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (todoData: any) => {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });
      if (!response.ok) throw new Error("Failed to create todo");
      return response.json();
    },
    onSuccess: async (newTodo) => {
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("todoId", newTodo.id.toString());

        await fetch("/api/attachments/upload", {
          method: "POST",
          body: formData,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attachments/todos"] });
      setNewTodoTitle("");
      setNewTodoDescription("");
      setNewTodoPriority("medium");
      setNewTodoDueDate("");
      setSelectedFiles([]);
      setShowNewTodo(false);
    },
  });

  // Toggle todo mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: number }) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: isCompleted ? 0 : 1 }),
      });
      if (!response.ok) throw new Error("Failed to toggle todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attachments/todos"] });
    },
  });

  const handleCreateTodo = () => {
    if (!newTodoTitle.trim()) return;

    createTodoMutation.mutate({
      title: newTodoTitle,
      description: newTodoDescription || null,
      dueDate: newTodoDueDate || null,
      dayOfWeek: selectedDay,
      priority: newTodoPriority,
      category: "General",
    });
  };

  const handleToggleTodo = (todo: Todo) => {
    toggleTodoMutation.mutate({ id: todo.id, isCompleted: todo.isCompleted });
  };

  const handleDeleteTodo = (todoId: number) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteTodoMutation.mutate(todoId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-300";
    }
  };

  const getTodoAttachments = (todoId: number) => {
    return attachments.filter((a) => a.todoId === todoId);
  };

  // Filter todos by selected day
  const filteredTodos = selectedDay
    ? todos.filter((todo) => todo.dayOfWeek === selectedDay)
    : todos;

  // Get top priority todos (high priority, not completed)
  const topPriorityTodos = todos
    .filter((t) => t.priority === "high" && !t.isCompleted)
    .slice(0, 3);

  const activeTodos = filteredTodos.filter((t) => !t.isCompleted);
  const completedTodos = filteredTodos.filter((t) => t.isCompleted);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily To Do List</h1>
          <p className="text-muted-foreground">{format(new Date(), "MMMM d, yyyy")}</p>
        </div>
        <Button onClick={() => setShowNewTodo(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Day of Week Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              variant={selectedDay === null ? "default" : "outline"}
              onClick={() => setSelectedDay(null)}
              className="rounded-full"
            >
              All
            </Button>
            {DAYS_OF_WEEK.map((day) => {
              const dayTodos = todos.filter((t) => t.dayOfWeek === day);
              return (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => setSelectedDay(day)}
                  className="rounded-full"
                >
                  {day}
                  {dayTodos.length > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-full">
                      {dayTodos.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Priorities Section */}
      {!selectedDay && topPriorityTodos.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="bg-red-50 dark:bg-red-950/20">
            <CardTitle className="text-red-900 dark:text-red-100">⭐ Top Priorities</CardTitle>
            <CardDescription>High priority tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {topPriorityTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 rounded-lg border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10"
                >
                  <Checkbox
                    checked={!!todo.isCompleted}
                    onCheckedChange={() => handleToggleTodo(todo)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{todo.title}</h4>
                    {todo.description && (
                      <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {todo.dayOfWeek && (
                        <Badge variant="outline" className="text-xs">
                          {todo.dayOfWeek}
                        </Badge>
                      )}
                      {todo.dueDate && (
                        <Badge variant="outline" className="text-xs">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDay ? `${selectedDay} Tasks` : "All Tasks"}
          </CardTitle>
          <CardDescription>
            {activeTodos.length} active, {completedTodos.length} completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks for {selectedDay || "today"}. Add one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => {
                const todoAttachments = getTodoAttachments(todo.id);
                return (
                  <div
                    key={todo.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      todo.isCompleted
                        ? "bg-muted/30 border-muted"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={!!todo.isCompleted}
                      onCheckedChange={() => handleToggleTodo(todo)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4
                          className={`font-semibold ${
                            todo.isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {todo.title}
                        </h4>
                        <Badge className={`${getPriorityColor(todo.priority)} border text-xs`}>
                          {todo.priority}
                        </Badge>
                        {todo.dayOfWeek && (
                          <Badge variant="outline" className="text-xs">
                            {todo.dayOfWeek}
                          </Badge>
                        )}
                      </div>
                      {todo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{todo.description}</p>
                      )}
                      {todo.dueDate && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Due: {new Date(todo.dueDate).toLocaleString()}
                        </p>
                      )}
                      {todoAttachments.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {todoAttachments.map((attachment) => (
                            <Badge
                              key={attachment.id}
                              variant="secondary"
                              className="gap-1 text-xs"
                            >
                              <Paperclip className="w-3 h-3" />
                              {attachment.fileName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Todo Dialog */}
      <Dialog open={showNewTodo} onOpenChange={setShowNewTodo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your daily to-do list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="e.g., Complete homework assignment"
                className="text-base"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                placeholder="Additional details about this task..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTodoPriority} onValueChange={(value: any) => setNewTodoPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={selectedDay || "none"} onValueChange={(value) => setSelectedDay(value === "none" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any day</SelectItem>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date & Time</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Attachments</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50"
                      >
                        <File className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewTodo(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTodo} disabled={createTodoMutation.isPending}>
                {createTodoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
