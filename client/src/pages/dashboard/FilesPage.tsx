import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { File, FileText, Image, FileArchive, FileVideo, FileAudio, Download, Eye, Search, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { getCourseColor } from "@/lib/courseColors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Attachment {
  id: number;
  userId: number;
  courseId: number | null;
  assignmentId: number | null;
  quizId: number | null;
  fileName: string;
  fileSize: number | null;
  fileType: string | null;
  filePath: string;
  uploadedAt: string;
  courseName?: string | null;
}

interface Course {
  id: number;
  title: string;
  courseCode: string | null;
}

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCourseId, setUploadCourseId] = useState<string>("");

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch all attachments
  const { data: attachments = [], isLoading } = useQuery<Attachment[]>({
    queryKey: ["/api/files/all"],
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/all"] });
      setShowUpload(false);
      setUploadFile(null);
      setUploadCourseId("");
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete file");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/all"] });
    },
  });

  // Create a map of course IDs to course names
  const courseMap = new Map<number, string>();
  courses.forEach(course => {
    courseMap.set(course.id, course.title);
  });

  // Filter attachments
  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === "all" || attachment.courseId === parseInt(selectedCourse);
    return matchesSearch && matchesCourse;
  });

  // Get file icon based on type
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-5 h-5" />;
    
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (fileType.includes('audio')) return <FileAudio className="w-5 h-5 text-green-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <FileArchive className="w-5 h-5 text-yellow-500" />;
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Handle file download
  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = `/api/files/${attachment.id}/download`;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file preview
  const handlePreview = (attachment: Attachment) => {
    setSelectedFile(attachment);
    setShowPreview(true);
  };

  // Handle file delete
  const handleDelete = (fileId: number, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate(fileId);
    }
  };

  // Handle file upload
  const handleUpload = () => {
    if (!uploadFile || !uploadCourseId) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("courseId", uploadCourseId);

    uploadMutation.mutate(formData);
  };

  // Check if file is previewable
  const isPreviewable = (fileType: string | null) => {
    if (!fileType) return false;
    return fileType.includes('image') || fileType.includes('pdf') || fileType.includes('text');
  };

  // Group files by course
  const filesByCourse = filteredAttachments.reduce((acc, file) => {
    const courseId = file.courseId || 0;
    if (!acc[courseId]) acc[courseId] = [];
    acc[courseId].push(file);
    return acc;
  }, {} as Record<number, Attachment[]>);

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
          <h2 className="text-3xl font-bold tracking-tight">Course Files</h2>
          <p className="text-muted-foreground">Access and manage all your course materials</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload File
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-gray-500" />
              <span className="text-2xl font-bold">{attachments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">
                {attachments.filter(a => a.fileType?.includes('pdf') || a.fileType?.includes('document')).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {attachments.filter(a => a.fileType?.includes('image')).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {formatFileSize(attachments.reduce((sum, a) => sum + (a.fileSize || 0), 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCourse === "all" ? "default" : "outline"}
              onClick={() => setSelectedCourse("all")}
            >
              All Courses ({filteredAttachments.length})
            </Button>
            {courses.map(course => {
              const courseFiles = filesByCourse[course.id] || [];
              return (
                <Button
                  key={course.id}
                  variant={selectedCourse === course.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCourse(course.id.toString())}
                >
                  {course.title} ({courseFiles.length})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {filteredAttachments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? "No files match your search"
                : selectedCourse === "all" 
                  ? "No files uploaded yet"
                  : "No files for this course yet"}
            </p>
            <Button onClick={() => setShowUpload(true)} className="mt-4 gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAttachments.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    {file.courseId && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {courseMap.get(file.courseId)}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPreviewable(file.fileType) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(file)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(file.id, file.fileName)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a file to a course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course">Course *</Label>
              <Select value={uploadCourseId} onValueChange={setUploadCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!uploadFile || !uploadCourseId || uploadMutation.isPending}
              >
                {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFile.fileName}</DialogTitle>
                <DialogDescription>
                  {formatFileSize(selectedFile.fileSize)} • {selectedFile.fileType}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-auto">
                {selectedFile.fileType?.includes('image') && (
                  <img 
                    src={`/api/files/${selectedFile.id}/preview`} 
                    alt={selectedFile.fileName}
                    className="w-full h-auto"
                  />
                )}
                {selectedFile.fileType?.includes('pdf') && (
                  <iframe
                    src={`/api/files/${selectedFile.id}/preview`}
                    className="w-full h-[60vh]"
                    title={selectedFile.fileName}
                  />
                )}
                {selectedFile.fileType?.includes('text') && (
                  <pre className="p-4 bg-muted rounded-lg text-sm">
                    Preview not available
                  </pre>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
