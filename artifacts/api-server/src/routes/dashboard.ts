import { Router } from "express";
import type { IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, count, desc, lt, and, isNotNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function formatTask(t: typeof tasksTable.$inferSelect) {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    category: t.category,
    dueDate: t.dueDate?.toISOString() ?? null,
    assignedTo: t.assignedTo ?? null,
    tags: t.tags,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

router.get("/dashboard/stats", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const [{ total }] = await db.select({ total: count() }).from(tasksTable);
  const [{ completed }] = await db.select({ completed: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
  const [{ pending }] = await db.select({ pending: count() }).from(tasksTable).where(eq(tasksTable.status, "pending"));
  const [{ inProgress }] = await db.select({ inProgress: count() }).from(tasksTable).where(eq(tasksTable.status, "in_progress"));

  const now = new Date();
  const [{ overdue }] = await db.select({ overdue: count() }).from(tasksTable).where(
    and(
      isNotNull(tasksTable.dueDate),
      lt(tasksTable.dueDate, now),
      sql`${tasksTable.status} != 'completed'`
    )
  );

  // Priority breakdown
  const priorityRows = await db
    .select({ priority: tasksTable.priority, cnt: count() })
    .from(tasksTable)
    .groupBy(tasksTable.priority);

  const byPriority: Record<string, number> = {};
  for (const row of priorityRows) {
    byPriority[row.priority] = Number(row.cnt);
  }

  // Category breakdown
  const categoryRows = await db
    .select({ category: tasksTable.category, cnt: count() })
    .from(tasksTable)
    .groupBy(tasksTable.category);

  const byCategory: Record<string, number> = {};
  for (const row of categoryRows) {
    byCategory[row.category] = Number(row.cnt);
  }

  res.json({
    totalTasks: Number(total),
    completedTasks: Number(completed),
    pendingTasks: Number(pending),
    inProgressTasks: Number(inProgress),
    overdueCount: Number(overdue),
    byPriority,
    byCategory,
  });
});

router.get("/dashboard/recent-tasks", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .orderBy(desc(tasksTable.updatedAt))
    .limit(10);

  res.json(tasks.map(formatTask));
});

export default router;
