/**
 * Course Color System
 * Assigns consistent colors to courses based on course ID
 */

// Color palette with good contrast and visual distinction
const COURSE_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-500" },
  { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-500" },
  { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700", badge: "bg-green-500" },
  { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-500" },
  { bg: "bg-pink-100 dark:bg-pink-900", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700", badge: "bg-pink-500" },
  { bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-300 dark:border-indigo-700", badge: "bg-indigo-500" },
  { bg: "bg-teal-100 dark:bg-teal-900", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700", badge: "bg-teal-500" },
  { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700", badge: "bg-red-500" },
  { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700", badge: "bg-yellow-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700", badge: "bg-cyan-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", badge: "bg-emerald-500" },
  { bg: "bg-rose-100 dark:bg-rose-900", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700", badge: "bg-rose-500" },
];

/**
 * Get color classes for a course based on its ID
 * Uses modulo to cycle through colors if there are more courses than colors
 */
export function getCourseColor(courseId: number) {
  const index = courseId % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

/**
 * Get just the badge color for a course
 */
export function getCourseBadgeColor(courseId: number) {
  return getCourseColor(courseId).badge;
}

/**
 * Get color for calendar events
 */
export function getCourseCalendarColor(courseId: number) {
  const colors = [
    "#3b82f6", // blue
    "#a855f7", // purple
    "#22c55e", // green
    "#f97316", // orange
    "#ec4899", // pink
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#ef4444", // red
    "#eab308", // yellow
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f43f5e", // rose
  ];
  return colors[courseId % colors.length];
}
