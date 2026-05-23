import { Router } from "express";
import type { IRouter } from "express";
import { db, subscriptionsTable, usersTable, packagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const WEBHOOK_SECRET = process.env.PAYNECTA_WEBHOOK_SECRET ?? "devan1234";

const router: IRouter = Router();

router.post("/webhooks/paynecta", async (req, res): Promise<void> => {
  const signature = req.headers["x-webhook-signature"] as string | undefined;
  
  // Validate webhook signature if provided
  if (signature && signature !== WEBHOOK_SECRET) {
    req.log.warn("Invalid webhook signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const { event, reference, status, amount, metadata } = req.body;

  req.log.info({ event, reference, status }, "Received Paynecta webhook");

  // Parse subscription reference: sub_<id>&user=<userId>
  let subId: number | null = null;
  let userId: number | null = null;

  if (reference) {
    const subMatch = reference.match(/sub_(\d+)/);
    const userMatch = reference.match(/user=(\d+)/);
    if (subMatch) subId = parseInt(subMatch[1], 10);
    if (userMatch) userId = parseInt(userMatch[1], 10);
  }

  // Also check metadata
  if (!subId && metadata?.subscriptionId) subId = parseInt(metadata.subscriptionId, 10);
  if (!userId && metadata?.userId) userId = parseInt(metadata.userId, 10);

  if (event === "payment.success" || status === "success" || status === "completed") {
    if (subId) {
      // Get subscription to find package
      const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, subId));
      if (sub) {
        const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
        const expiresAt = pkg ? new Date(Date.now() + pkg.duration * 24 * 60 * 60 * 1000) : null;

        await db.update(subscriptionsTable)
          .set({
            status: "active",
            transactionId: metadata?.transactionId ?? reference,
            expiresAt,
          })
          .where(eq(subscriptionsTable.id, subId));

        // Activate the user
        const targetUserId = userId ?? sub.userId;
        await db.update(usersTable)
          .set({ status: "active" })
          .where(eq(usersTable.id, targetUserId));

        req.log.info({ subId, userId: targetUserId }, "Subscription activated, user account activated");
      }
    }

    // If no subId but we have a userId, activate user directly
    if (!subId && userId) {
      await db.update(usersTable)
        .set({ status: "active" })
        .where(eq(usersTable.id, userId));
      req.log.info({ userId }, "User activated via webhook without subscription reference");
    }
  } else if (event === "payment.failed" || status === "failed") {
    if (subId) {
      await db.update(subscriptionsTable)
        .set({ status: "cancelled" })
        .where(eq(subscriptionsTable.id, subId));
      req.log.info({ subId }, "Subscription marked as cancelled due to failed payment");
    }
  }

  res.json({ message: "Webhook processed" });
});

export default router;
