import { useState } from "react";
import { useGetPostsCalendar, getGetPostsCalendarQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, FileEdit, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData, isLoading } = useGetPostsCalendar(
    { workspaceId: 1, year, month },
    { query: { queryKey: getGetPostsCalendarQueryKey({ workspaceId: 1, year, month }) } }
  );

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Calendar grid logic
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month - 1, i + 1);
    const dateString = date.toISOString().split('T')[0];
    const dayData = calendarData?.find(d => d.date.startsWith(dateString));
    
    return {
      date,
      dateString,
      dayOfMonth: i + 1,
      posts: dayData?.posts || []
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-orange-500';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">Plan and visualize your social media schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-[140px] text-center font-medium">
            {monthName} {year}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b shrink-0 bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="border-r border-b p-2 space-y-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)] bg-background">
            {/* Empty cells for start of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b bg-muted/10 p-2" />
            ))}
            
            {/* Days of month */}
            {days.map((day) => {
              const isToday = new Date().toDateString() === day.date.toDateString();
              
              return (
                <div 
                  key={day.dayOfMonth} 
                  className={`border-r border-b p-2 hover:bg-muted/20 transition-colors cursor-pointer flex flex-col gap-1 overflow-hidden
                    ${isToday ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}
                    `}>
                      {day.dayOfMonth}
                    </span>
                    {day.posts.length > 0 && (
                      <span className="text-xs text-muted-foreground">{day.posts.length}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {day.posts.map(post => (
                      <div 
                        key={post.id} 
                        className={`text-xs p-1.5 rounded-md border flex items-center gap-1.5 truncate
                          ${post.status === 'published' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : ''}
                          ${post.status === 'scheduled' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' : ''}
                          ${post.status === 'draft' ? 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' : ''}
                          ${post.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' : ''}
                        `}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(post.status)}`} />
                        <span className="truncate">{post.content || "Empty post"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Empty cells for end of month */}
            {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="border-r border-b bg-muted/10 p-2" />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
