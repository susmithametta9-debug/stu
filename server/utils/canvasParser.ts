import { extname } from "path";

/**
 * Canvas course export structure (based on actual Canvas export format)
 */
export interface CanvasCourseData {
  course: {
    name: string;
    code?: string;
    description?: string;
  };
  assignments: CanvasAssignment[];
  quizzes: CanvasQuiz[];
  modules: CanvasModule[];
  files: CanvasFile[];
  pages: CanvasPage[];
}

export interface CanvasAssignment {
  exportId: string;
  title: string;
  type: string;
  content: string;
  dueAt?: string;
  lockAt?: string;
  unlockAt?: string;
  pointsPossible?: number;
  submissionTypes?: string;
  graded?: boolean;
}

export interface CanvasQuiz {
  exportId: string;
  title: string;
  type: string;
  content?: string;
  dueAt?: string;
  lockAt?: string;
  unlockAt?: string;
  pointsPossible?: number;
  assignmentExportId?: string;
  questionCount?: number;
  timeLimit?: number;
  attempts?: number;
  graded?: boolean;
}

export interface CanvasModule {
  exportId: string;
  title: string;
  items?: CanvasModuleItem[];
}

export interface CanvasModuleItem {
  exportId: string;
  title: string;
  type: string;
  indent?: number;
}

export interface CanvasFile {
  name: string;
  path?: string;
  size?: number;
  type: "file" | "folder";
  files?: CanvasFile[] | null;
}

export interface CanvasPage {
  exportId: string;
  title: string;
  content: string;
  type: string;
}

/**
 * Parse Canvas course-data.js file
 * Extracts course information, assignments, quizzes, and file structure
 */
export function parseCanvasCourseData(
  courseDataContent: string
): CanvasCourseData {
  try {
    // Extract JSON from the JavaScript variable assignment
    // Canvas exports as: window.COURSE_DATA = {...}
    let jsonMatch = courseDataContent.match(
      /window\.COURSE_DATA\s*=\s*({[\s\S]*});?/
    );
    
    if (!jsonMatch) {
      throw new Error("Could not find window.COURSE_DATA in course-data.js");
    }

    const courseDataJson = JSON.parse(jsonMatch[1]);

    // Extract course metadata from the top-level structure
    const courseName = courseDataJson.title || "Untitled Course";
    
    // Parse assignments
    const assignments: CanvasAssignment[] = (courseDataJson.assignments || [])
      .map((assignment: any) => ({
        exportId: assignment.exportId,
        title: assignment.title,
        type: assignment.type || "Assignment",
        content: cleanHtmlContent(assignment.content || ""),
        dueAt: assignment.dueAt,
        lockAt: assignment.lockAt,
        unlockAt: assignment.unlockAt,
        pointsPossible: assignment.pointsPossible,
        submissionTypes: assignment.submissionTypes,
        graded: assignment.graded,
      }));

    // Parse quizzes
    const quizzes: CanvasQuiz[] = (courseDataJson.quizzes || [])
      .map((quiz: any) => ({
        exportId: quiz.exportId,
        title: quiz.title,
        type: quiz.type || "Quiz",
        content: cleanHtmlContent(quiz.content || ""),
        dueAt: quiz.dueAt,
        lockAt: quiz.lockAt,
        unlockAt: quiz.unlockAt,
        pointsPossible: quiz.pointsPossible,
        assignmentExportId: quiz.assignmentExportId,
        questionCount: quiz.questionCount,
        timeLimit: quiz.timeLimit,
        attempts: quiz.attempts,
        graded: quiz.graded,
      }));

    // Parse modules (course structure)
    const modules: CanvasModule[] = (courseDataJson.modules || [])
      .map((module: any) => ({
        exportId: module.exportId,
        title: module.title,
        items: (module.items || []).map((item: any) => ({
          exportId: item.exportId,
          title: item.title,
          type: item.type,
          indent: item.indent,
        })),
      }));

    // Parse pages (course outline, syllabus, etc.)
    const pages: CanvasPage[] = (courseDataJson.pages || [])
      .map((page: any) => ({
        exportId: page.exportId,
        title: page.title,
        content: page.content || "",
        type: page.type || "Page",
      }));

    // Parse file structure
    const files: CanvasFile[] = courseDataJson.files || [];

    return {
      course: {
        name: courseName,
        code: "",
        description: "",
      },
      assignments,
      quizzes,
      modules,
      files,
      pages,
    };
  } catch (error) {
    console.error("Error parsing Canvas course data:", error);
    throw new Error(
      `Failed to parse Canvas course data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clean HTML content to plain text
 */
function cleanHtmlContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[a-z]+;/g, (match) => {
      // Decode HTML entities
      const entities: { [key: string]: string } = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&nbsp;": " ",
      };
      return entities[match] || match;
    })
    .trim();
}

/**
 * Build a flat list of all files from the nested file structure
 */
export function flattenFileStructure(
  files: CanvasFile[],
  basePath: string = ""
): Array<{ name: string; path: string; size?: number }> {
  const flatFiles: Array<{ name: string; path: string; size?: number }> = [];

  for (const file of files) {
    const currentPath = basePath ? `${basePath}/${file.name}` : file.name;

    if (file.type === "file") {
      flatFiles.push({
        name: file.name,
        path: currentPath,
        size: file.size,
      });
    } else if (file.type === "folder" && file.files) {
      // Recursively flatten nested folders
      flatFiles.push(...flattenFileStructure(file.files, currentPath));
    }
  }

  return flatFiles;
}

/**
 * Extract course outline from pages
 */
export function extractCourseOutline(pages: CanvasPage[]): string {
  // Look for syllabus or outline pages
  const outlinePage = pages.find(
    (page) =>
      page.title.toLowerCase().includes("syllabus") ||
      page.title.toLowerCase().includes("outline") ||
      page.title.toLowerCase().includes("schedule")
  );

  if (outlinePage) {
    return cleanHtmlContent(outlinePage.content);
  }

  // If no outline page found, create a basic outline from modules
  return "";
}
