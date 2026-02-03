import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, FileText, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { getCourseColor } from "@/lib/courseColors";

interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  pointsPossible: number | null;
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

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'assignment' | 'quiz' | 'event';
  courseId: number;
  courseName: string;
  points?: number | null;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch all assignments
  const { data: allAssignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/all"],
  });

  // Fetch all quizzes
  const { data: allQuizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/all"],
  });

  // Create a map of course IDs to course names
  const courseMap = useMemo(() => {
    const map = new Map<number, string>();
    courses.forEach(course => {
      map.set(course.id, course.title);
    });
    return map;
  }, [courses]);

  // Combine all events into calendar format
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Add assignments
    allAssignments.forEach(assignment => {
      if (assignment.dueDate) {
        events.push({
          id: assignment.id,
          title: assignment.title,
          date: parseISO(assignment.dueDate),
          type: 'assignment',
          courseId: assignment.courseId,
          courseName: courseMap.get(assignment.courseId) || 'Unknown Course',
          points: assignment.pointsPossible,
        });
      }
    });

    // Add quizzes
    allQuizzes.forEach(quiz => {
      if (quiz.dueDate) {
        events.push({
          id: quiz.id,
          title: quiz.title,
          date: parseISO(quiz.dueDate),
          type: 'quiz',
          courseId: quiz.courseId,
          courseName: courseMap.get(quiz.courseId) || 'Unknown Course',
          points: quiz.pointsPossible,
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allAssignments, allQuizzes, courseMap]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, date));
  };

  // Get events for selected date or today
  const selectedEvents = selectedDate 
    ? getEventsForDate(selectedDate)
    : getEventsForDate(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();

  // Add empty cells for days before month starts
  const calendarDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth,
  ];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300';
      case 'quiz':
        return 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300';
      case 'event':
        return 'bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Calendar</h2>
          <p className="text-muted-foreground">View all your assignments, quizzes, and events</p>
        </div>
        <Button onClick={goToToday} variant="outline" className="gap-2">
          <CalendarIcon className="w-4 h-4" />
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayEvents = getEventsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[100px] p-1.5 rounded-lg border transition-all flex flex-col items-start
                      ${isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'bg-card'}
                      ${isTodayDate && !isSelected ? 'border-primary border-2' : ''}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${!isSelected && isCurrentMonth ? 'hover:bg-accent' : ''}
                    `}
                  >
                    <div className="text-sm font-semibold mb-1">{format(day, 'd')}</div>
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => {
                        const courseColor = getCourseColor(event.courseId);
                        return (
                          <div
                            key={`${event.type}-${event.id}`}
                            className={`text-[9px] px-1 py-0.5 rounded truncate ${courseColor.bg} ${courseColor.text} ${courseColor.border} border font-medium`}
                            title={`${event.title} - ${event.courseName}`}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[8px] text-muted-foreground px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
            </CardTitle>
            <CardDescription>
              {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events scheduled for this day
                </p>
              ) : (
                selectedEvents.map(event => (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {event.type === 'assignment' && <FileText className="w-4 h-4 text-blue-500" />}
                        {event.type === 'quiz' && <CheckSquare className="w-4 h-4 text-purple-500" />}
                        {event.type === 'event' && <CalendarIcon className="w-4 h-4 text-green-500" />}
                        <Badge variant="outline" className={getEventBadgeColor(event.type)}>
                          {event.type}
                        </Badge>
                      </div>
                      {event.points && (
                        <span className="text-xs text-muted-foreground">{event.points} pts</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                    <Badge className={`${getCourseColor(event.courseId).bg} ${getCourseColor(event.courseId).text} ${getCourseColor(event.courseId).border} border`}>
                      <BookOpen className="w-3 h-3 mr-1" />
                      {event.courseName}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events with course tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Next 10 assignments and quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const upcomingEvents = calendarEvents
              .filter(event => event.date >= new Date())
              .slice(0, 10);
            
            if (upcomingEvents.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming deadlines
                </p>
              );
            }

            // Group events by course
            const eventsByCourse = upcomingEvents.reduce((acc, event) => {
              if (!acc[event.courseId]) {
                acc[event.courseId] = {
                  courseName: event.courseName,
                  courseId: event.courseId,
                  events: [],
                };
              }
              acc[event.courseId].events.push(event);
              return acc;
            }, {} as Record<number, { courseName: string; courseId: number; events: CalendarEvent[] }>);

            const courseGroups = Object.values(eventsByCourse);
            const [selectedCourseTab, setSelectedCourseTab] = useState(courseGroups[0]?.courseId || 0);
            const selectedGroup = courseGroups.find(g => g.courseId === selectedCourseTab) || courseGroups[0];

            return (
              <div className="space-y-4">
                {/* Course tabs */}
                <div className="flex gap-2 flex-wrap">
                  {courseGroups.map(({ courseName, courseId, events }) => {
                    const courseColor = getCourseColor(courseId);
                    const isSelected = selectedCourseTab === courseId;
                    return (
                      <button
                        key={courseId}
                        onClick={() => setSelectedCourseTab(courseId)}
                        className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-medium ${
                          isSelected
                            ? `${courseColor.bg} ${courseColor.text} ${courseColor.border}`
                            : 'border-border bg-background hover:bg-accent'
                        }`}
                      >
                        {courseName} ({events.length})
                      </button>
                    );
                  })}
                </div>

                {/* Selected course events */}
                {selectedGroup && (
                  <div className="space-y-2">
                    {selectedGroup.events.map(event => (
                      <div
                        key={`${event.type}-${event.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {event.type === 'assignment' && <FileText className="w-4 h-4 text-blue-500" />}
                          {event.type === 'quiz' && <CheckSquare className="w-4 h-4 text-purple-500" />}
                          <div>
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            {event.points && (
                              <span className="text-xs text-muted-foreground">{event.points} pts</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{format(event.date, 'MMM d')}</p>
                          <p className="text-xs text-muted-foreground">{format(event.date, 'h:mm a')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
