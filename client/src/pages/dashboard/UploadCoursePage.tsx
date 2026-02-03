import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertCircle, Loader2, File } from "lucide-react";

interface UploadCoursePageProps {
  onUploadSuccess?: () => void;
}

export default function UploadCoursePage({ onUploadSuccess }: UploadCoursePageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/zip" || selectedFile.name.endsWith(".zip")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please select a valid ZIP file");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append("zipFile", file);

      const response = await fetch("/api/courses/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      setUploadResult(result);
      setSuccess(true);
      setFile(null);

      // Call the success callback after a delay
      setTimeout(() => {
        onUploadSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Upload Canvas Course
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Import your course data from Canvas by uploading the exported ZIP file
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Course ZIP</CardTitle>
              <CardDescription>
                Export your course from Canvas and upload the ZIP file here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How to export from Canvas:
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Go to your course in Canvas</li>
                  <li>Click on "Settings" in the left sidebar</li>
                  <li>Scroll down and click "Export Course Content"</li>
                  <li>Select "Common Cartridge" format</li>
                  <li>Wait for the export to complete and download the ZIP file</li>
                  <li>Upload the ZIP file here</li>
                </ol>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  {file ? (
                    <>
                      <File className="w-12 h-12 text-green-600 mb-3" />
                      <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="mt-2"
                      >
                        Change File
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-400 mb-3" />
                      <p className="font-medium text-slate-900 dark:text-white mb-1">
                        Click to select or drag and drop
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ZIP files only (max 500MB)
                      </p>
                      <Input
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("file-input")?.click()}
                        className="mt-3"
                      >
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full gap-2"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Course
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Success Summary */}
        {success && uploadResult && (
          <div className="lg:col-span-1">
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <CardTitle className="text-green-900 dark:text-green-100">
                    Upload Successful!
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Course
                  </p>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-100 mt-1">
                    {uploadResult.course?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Assignments</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {uploadResult.assignmentCount}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Quizzes</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {uploadResult.quizCount}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded p-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Files</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {uploadResult.fileCount}
                  </p>
                </div>

                <p className="text-xs text-green-700 dark:text-green-300 text-center mt-4">
                  Redirecting to courses...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Info Section */}
      <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">What Gets Imported?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Course information (title, code, description)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Assignments with due dates and point values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Quizzes and tests with deadlines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Course files organized by folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Course outline and syllabus</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
