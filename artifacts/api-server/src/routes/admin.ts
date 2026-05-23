import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";
import { AdminUpdateUserStatusParams, AdminUpdateUserStatusBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone ?? null,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/admin/users", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(formatUser));
});

router.patch("/admin/users/:id/status", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateUserStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateUserStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ status: parsed.data.status })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

export default router;
