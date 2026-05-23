import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentTasks, getGetRecentTasksQueryKey, useGetMySubscription, getGetMySubscriptionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, Clock, AlertCircle, LayoutList, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });

  const { data: recentTasks, isLoading: tasksLoading } = useGetRecentTasks({
    query: { queryKey: getGetRecentTasksQueryKey() }
  });

  const { data: subscription } = useGetMySubscription({
    query: { queryKey: getGetMySubscriptionQueryKey() }
  });

  if (statsLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Welcome & Subscription info */}
      {subscription && (
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Active Plan: {subscription.package?.name || "Premium"}</h2>
              <p className="text-sm text-slate-500">Your workspace is active and running smoothly.</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Tasks</CardTitle>
            <LayoutList className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.completedTasks}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">{stats.overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>You have {stats.pendingTasks} pending tasks remaining.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                  No recent tasks found.
                </div>
              ) : (
                recentTasks?.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="space-y-1">
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline hover:text-primary transition-colors">
                        {task.title}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{task.category}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{task.status.replace("_", " ")}</span>
                      </div>
                    </div>
                    <Badge variant={
                      task.priority === 'urgent' ? 'destructive' :
                      task.priority === 'high' ? 'default' :
                      task.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Tasks by priority and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-medium mb-3 text-slate-500">By Priority</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byPriority).map(([prio, count]) => (
                    <div key={prio} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{prio}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{count as React.ReactNode}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-slate-500">By Category</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium truncate max-w-[200px]">{cat}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">{count as React.ReactNode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
