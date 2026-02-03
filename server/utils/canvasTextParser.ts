/**
 * Canvas Text Parser
 * Parses assignment text copied from Canvas and extracts structured data
 * Handles both plain text and HTML table formats
 */

interface ParsedAssignment {
  title: string;
  dueDate: string | null;
  points: number | null;
}

/**
 * Parse Canvas assignment text and extract assignment data
 * 
 * Supports multiple formats:
 * 1. Canvas HTML table (Name | Due | Submitted | Status | Score)
 * 2. Plain text format ("Assignment Name due Jan 29 at 9:50pm - 100 pts")
 * 
 * @param text - Raw text copied from Canvas
 * @returns Array of parsed assignments
 */
export function parseCanvasAssignmentText(text: string): ParsedAssignment[] {
  const assignments: ParsedAssignment[] = [];
  
  // Clean up the text
  const cleanText = text.trim();
  
  // Try to detect if this is from Canvas table format
  if (cleanText.includes('Name') && cleanText.includes('Due') && cleanText.includes('Status')) {
    return parseCanvasTableFormat(cleanText);
  }
  
  // Otherwise, parse as plain text line by line
  return parsePlainTextFormat(cleanText);
}

/**
 * Parse Canvas table format
 * Expected structure: Name | Due | Submitted | Status | Score
 */
function parseCanvasTableFormat(text: string): ParsedAssignment[] {
  const assignments: ParsedAssignment[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip header row
    if (line.includes('Name') && line.includes('Due') && line.includes('Status')) {
      i++;
      continue;
    }
    
    // Look for assignment name (first line of entry)
    // Skip lines that are clearly metadata
    if (line.match(/^(In-class Activities|Assignments|Quizzes|Grade Smoothing|missing|Submitted)$/i)) {
      i++;
      continue;
    }
    
    // Check if this looks like a due date line
    if (line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+by\s+\d{1,2}:\d{2}[ap]m$/i)) {
      i++;
      continue;
    }
    
    // Check if this looks like a score line
    if (line.match(/^[-\d]+\s*\/\s*\d+$/)) {
      i++;
      continue;
    }
    
    // Check if this is "Click to test" or similar
    if (line.match(/^Click to/i)) {
      i++;
      continue;
    }
    
    // This should be an assignment title
    const title = line;
    
    // Look ahead for due date
    let dueDate: string | null = null;
    let points: number | null = null;
    
    // Check next few lines for due date and points
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const nextLine = lines[j];
      
      // Due date format: "Jan 20 by 12:30pm"
      const dueDateMatch = nextLine.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+by\s+(\d{1,2}):(\d{2})([ap]m)$/i);
      if (dueDateMatch) {
        dueDate = parseCanvasDate(nextLine);
      }
      
      // Points format: "0 / 100" or "- / 0"
      const pointsMatch = nextLine.match(/^[-\d]+\s*\/\s*(\d+)$/);
      if (pointsMatch) {
        points = parseInt(pointsMatch[1]);
      }
      
      // Stop if we hit another assignment title
      if (j > i + 1 && !nextLine.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|In-class|Assignments|Quizzes|missing|Click to|[-\d]+\s*\/)/i)) {
        break;
      }
    }
    
    // Only add if we have a valid title
    if (title && title.length > 1 && !title.match(/^(missing|Submitted)$/i)) {
      assignments.push({
        title: title.trim(),
        dueDate,
        points,
      });
    }
    
    i++;
  }
  
  return assignments;
}

/**
 * Parse plain text format (legacy support)
 */
function parsePlainTextFormat(text: string): ParsedAssignment[] {
  const assignments: ParsedAssignment[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    // Skip lines that are clearly not assignments
    if (line.length < 5 || /^(due|points?|pts)$/i.test(line)) {
      continue;
    }
    
    const parsed = parseSingleAssignment(line);
    if (parsed) {
      assignments.push(parsed);
    }
  }
  
  return assignments;
}

/**
 * Parse a single assignment line (plain text format)
 */
function parseSingleAssignment(line: string): ParsedAssignment | null {
  let title = line;
  let dueDate: string | null = null;
  let points: number | null = null;
  
  // Extract points (e.g., "100 pts", "50 points", "68pts")
  const pointsMatch = line.match(/(\d+)\s*(pts?|points?)/i);
  if (pointsMatch) {
    points = parseInt(pointsMatch[1]);
    title = title.replace(pointsMatch[0], '').trim();
  }
  
  // Extract due date - multiple formats
  const dueDatePatterns = [
    /due\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)\s+at\s+(\d{1,2}:\d{2}\s*[ap]m)/i,
    /due:?\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,
    /due:?\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /\|\s*due:?\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];
  
  for (const pattern of dueDatePatterns) {
    const match = line.match(pattern);
    if (match) {
      try {
        let dateStr = match[1];
        if (match[2]) {
          dateStr += ` ${match[2]}`;
        }
        
        const parsedDate = parseCanvasDate(dateStr);
        if (parsedDate) {
          dueDate = parsedDate;
        }
        
        title = title.replace(match[0], '').trim();
      } catch (error) {
        console.error('Error parsing date:', error);
      }
      break;
    }
  }
  
  // Clean up title
  title = title
    .replace(/\s*[-|]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!title || title.length < 2) {
    return null;
  }
  
  return {
    title,
    dueDate,
    points,
  };
}

/**
 * Parse Canvas date string to ISO format
 * 
 * Supports formats:
 * - "Jan 29 by 9:50pm"
 * - "Jan 29 at 9:50pm"
 * - "January 30, 2026 at 5:50 PM"
 * - "Feb 7, 2026"
 */
function parseCanvasDate(dateStr: string): string | null {
  try {
    const monthMap: { [key: string]: number } = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    
    // Parse "Jan 29 by 9:50pm" or "Jan 29 at 9:50pm" or "January 30, 2026 at 5:50 PM"
    const match = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?\s*(?:(?:by|at)\s+(\d{1,2}):(\d{2})\s*([ap]m))?/i);
    
    if (!match) {
      return null;
    }
    
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    let hour = match[4] ? parseInt(match[4]) : 23;
    const minute = match[5] ? parseInt(match[5]) : 59;
    const meridiem = match[6]?.toLowerCase();
    
    // Convert to 24-hour format
    if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    } else if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }
    
    const month = monthMap[monthName];
    if (month === undefined) {
      return null;
    }
    
    const date = new Date(year, month, day, hour, minute, 0);
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing Canvas date:', error);
    return null;
  }
}
