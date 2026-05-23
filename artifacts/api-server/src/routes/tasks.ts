import { Router } from "express";
import type { IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, count, lt } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";
import {
  GetTasksQueryParams,
  GetTaskParams,
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
  CompleteTaskParams,
  CompleteTaskBody,
} from "@workspace/api-zod";

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

router.get("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const queryParams = GetTasksQueryParams.safeParse({
    status: req.query.status,
    priority: req.query.priority,
    category: req.query.category,
    search: req.query.search,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
  });

  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { status, priority, category, search, page, limit } = queryParams.data;
  const pageNum = page ?? 1;
  const limitNum = limit ?? 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status) conditions.push(eq(tasksTable.status, status));
  if (priority) conditions.push(eq(tasksTable.priority, priority));
  if (category) conditions.push(eq(tasksTable.category, category));
  if (search) conditions.push(ilike(tasksTable.title, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(tasksTable).where(whereClause);
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(whereClause)
    .orderBy(desc(tasksTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  res.json({
    tasks: tasks.map(formatTask),
    total: Number(total),
    page: pageNum,
    limit: limitNum,
  });
});

router.post("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, priority, category, dueDate, assignedTo, tags } = parsed.data;

  const [task] = await db.insert(tasksTable).values({
    title,
    description: description ?? null,
    priority,
    category,
    dueDate: dueDate ? new Date(dueDate) : null,
    assignedTo: assignedTo ?? null,
    tags: tags ?? [],
  }).returning();

  res.status(201).json(formatTask(task));
});

router.get("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.patch("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTaskParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  const { title, description, status, priority, category, dueDate, assignedTo, tags } = parsed.data;
  if (title != null) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status != null) updateData.status = status;
  if (priority != null) updateData.priority = priority;
  if (category != null) updateData.category = category;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
  if (tags != null) updateData.tags = tags;

  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.delete("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/tasks/:id/complete", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CompleteTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const newStatus = parsed.data.completed ? "completed" : "pending";
  const [task] = await db
    .update(tasksTable)
    .set({ status: newStatus })
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

export default router;
