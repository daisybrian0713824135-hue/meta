import { useState } from "react";
import { useGetTasks, getGetTasksQueryKey, useCompleteTask } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, CheckCircle, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(priority !== "all" ? { priority } : {}),
  };

  const { data, isLoading } = useGetTasks(queryParams, {
    query: { queryKey: getGetTasksQueryKey(queryParams) }
  });

  const completeMutation = useCompleteTask();

  const handleToggleComplete = (taskId: number, currentStatus: string) => {
    const isCompleted = currentStatus === "completed";
    completeMutation.mutate(
      { id: taskId, data: { completed: !isCompleted } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey(queryParams) });
          toast({ title: isCompleted ? "Task uncompleted" : "Task completed" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button asChild className="shrink-0 font-semibold shadow-sm">
          <Link href="/tasks/new">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data?.tasks || data.tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tasks found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or create a new task.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.tasks.map((task) => (
              <div key={task.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <button 
                  onClick={() => handleToggleComplete(task.id, task.status)}
                  className="mt-1 text-slate-400 hover:text-primary transition-colors focus:outline-none shrink-0"
                  disabled={completeMutation.isPending}
                >
                  {task.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <Link href={`/tasks/${task.id}`} className="block">
                    <h4 className={`text-base font-medium mb-1 truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white group-hover:text-primary transition-colors'}`}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                      <Badge variant="outline" className="font-normal border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        {task.category}
                      </Badge>
                      <Badge variant={
                        task.priority === 'urgent' ? 'destructive' :
                        task.priority === 'high' ? 'default' :
                        task.priority === 'medium' ? 'secondary' : 'outline'
                      } className="font-normal capitalize shadow-none">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="flex items-center text-xs">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
          <span className="text-sm text-slate-500">
            Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total} tasks
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * data.limit >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
