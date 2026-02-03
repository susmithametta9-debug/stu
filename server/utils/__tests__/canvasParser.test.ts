import { describe, it, expect } from "vitest";
import {
  parseCanvasCourseData,
  flattenFileStructure,
  extractCourseOutline,
} from "../canvasParser";

describe("Canvas Parser", () => {
  describe("parseCanvasCourseData", () => {
    it("should parse valid Canvas course data", () => {
      const mockCourseData = `
        window.COURSE_DATA = {
          "name": "Computer Systems and Low-Level Programming",
          "course_code": "CIS2107",
          "public_description": "Learn about computer systems",
          "assignments": [
            {
              "exportId": "g123",
              "title": "HW1",
              "content": "<p>Assignment 1</p>",
              "dueAt": "2026-01-24T23:59:59-05:00",
              "pointsPossible": 40,
              "graded": true
            }
          ],
          "quizzes": [],
          "modules": [],
          "wikiPages": [],
          "files": []
        };
      `;

      const result = parseCanvasCourseData(mockCourseData);

      expect(result.course.name).toBe(
        "Computer Systems and Low-Level Programming"
      );
      expect(result.course.code).toBe("CIS2107");
      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].title).toBe("HW1");
      expect(result.assignments[0].pointsPossible).toBe(40);
    });

    it("should handle missing course data fields", () => {
      const mockCourseData = `
        window.COURSE_DATA = {
          "name": "Test Course",
          "assignments": [],
          "quizzes": [],
          "modules": [],
          "wikiPages": [],
          "files": []
        };
      `;

      const result = parseCanvasCourseData(mockCourseData);

      expect(result.course.name).toBe("Test Course");
      expect(result.course.code).toBe("");
      expect(result.assignments).toHaveLength(0);
    });

    it("should clean HTML content from assignments", () => {
      const mockCourseData = `
        window.COURSE_DATA = {
          "name": "Test Course",
          "assignments": [
            {
              "exportId": "g123",
              "title": "HW1",
              "content": "<p>This is <strong>important</strong></p>",
              "dueAt": "2026-01-24T23:59:59-05:00",
              "pointsPossible": 40,
              "graded": true
            }
          ],
          "quizzes": [],
          "modules": [],
          "wikiPages": [],
          "files": []
        };
      `;

      const result = parseCanvasCourseData(mockCourseData);

      expect(result.assignments[0].description).toBe("This is important");
    });

    it("should extract file links from HTML content", () => {
      const mockCourseData = `
        window.COURSE_DATA = {
          "name": "Test Course",
          "assignments": [
            {
              "exportId": "g123",
              "title": "HW1",
              "content": "<a href=\\"viewer/files/homework.pdf\\">Download</a>",
              "dueAt": "2026-01-24T23:59:59-05:00",
              "pointsPossible": 40,
              "graded": true
            }
          ],
          "quizzes": [],
          "modules": [],
          "wikiPages": [],
          "files": []
        };
      `;

      const result = parseCanvasCourseData(mockCourseData);

      expect(result.assignments[0].linkedFiles).toContain(
        "viewer/files/homework.pdf"
      );
    });

    it("should throw error for invalid course data", () => {
      const invalidData = "invalid data";

      expect(() => parseCanvasCourseData(invalidData)).toThrow();
    });
  });

  describe("flattenFileStructure", () => {
    it("should flatten nested file structure", () => {
      const files = [
        {
          name: "Lectures",
          type: "folder" as const,
          path: "Lectures",
          files: [
            {
              name: "Lec1.pdf",
              type: "file" as const,
              path: "Lectures/Lec1.pdf",
              size: 1000,
            },
            {
              name: "Lec2.pdf",
              type: "file" as const,
              path: "Lectures/Lec2.pdf",
              size: 2000,
            },
          ],
        },
        {
          name: "Assignments",
          type: "folder" as const,
          path: "Assignments",
          files: [
            {
              name: "HW1.pdf",
              type: "file" as const,
              path: "Assignments/HW1.pdf",
              size: 500,
            },
          ],
        },
      ];

      const result = flattenFileStructure(files);

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.name)).toContain("Lec1.pdf");
      expect(result.map((f) => f.name)).toContain("Lec2.pdf");
      expect(result.map((f) => f.name)).toContain("HW1.pdf");
    });

    it("should handle empty file structure", () => {
      const files: any[] = [];
      const result = flattenFileStructure(files);

      expect(result).toHaveLength(0);
    });
  });

  describe("extractCourseOutline", () => {
    it("should extract course outline from wiki pages", () => {
      const wikiPages = [
        {
          exportId: "g1",
          title: "Course Syllabus",
          content: "This is the course syllabus",
          type: "WikiPage",
        },
        {
          exportId: "g2",
          title: "Other Page",
          content: "Other content",
          type: "WikiPage",
        },
      ];

      const result = extractCourseOutline(wikiPages);

      expect(result).toBe("This is the course syllabus");
    });

    it("should return first page if no outline found", () => {
      const wikiPages = [
        {
          exportId: "g1",
          title: "Welcome",
          content: "Welcome to the course",
          type: "WikiPage",
        },
      ];

      const result = extractCourseOutline(wikiPages);

      expect(result).toBe("Welcome to the course");
    });

    it("should return empty string for empty wiki pages", () => {
      const wikiPages: any[] = [];
      const result = extractCourseOutline(wikiPages);

      expect(result).toBe("");
    });
  });
});
