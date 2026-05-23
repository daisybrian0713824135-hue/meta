import { Router } from "express";
import type { IRouter } from "express";
import { db, subscriptionsTable, packagesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";
import { CreateSubscriptionBody } from "@workspace/api-zod";

const PAYMENT_URL = process.env.PAYNECTA_PAYMENT_URL ?? "https://paynecta.co.ke/pay/metapay-agencies";

const router: IRouter = Router();

function formatSubscription(sub: typeof subscriptionsTable.$inferSelect, pkg?: typeof packagesTable.$inferSelect | null) {
  return {
    id: sub.id,
    userId: sub.userId,
    packageId: sub.packageId,
    status: sub.status,
    expiresAt: sub.expiresAt?.toISOString() ?? null,
    transactionId: sub.transactionId,
    createdAt: sub.createdAt.toISOString(),
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: Number(pkg.price),
      duration: pkg.duration,
      features: pkg.features,
      popular: pkg.popular,
    } : undefined,
  };
}

router.post("/subscriptions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, parsed.data.packageId));
  if (!pkg) {
    res.status(400).json({ error: "Package not found" });
    return;
  }

  // Create a pending subscription
  const [sub] = await db.insert(subscriptionsTable).values({
    userId: req.userId!,
    packageId: pkg.id,
    status: "pending",
  }).returning();

  // Return payment URL with subscription reference
  const paymentUrl = `${PAYMENT_URL}?ref=sub_${sub.id}&user=${req.userId}`;

  res.status(201).json({
    subscription: formatSubscription(sub, pkg),
    paymentUrl,
  });
});

router.get("/subscriptions/my", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.userId!))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (subs.length === 0) {
    res.status(404).json({ error: "No subscription found" });
    return;
  }

  const sub = subs[0];
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));

  res.json(formatSubscription(sub, pkg));
});

export default router;
