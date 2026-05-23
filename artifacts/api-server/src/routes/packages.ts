import { Router } from "express";
import type { IRouter } from "express";
import { db, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetPackageParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatPackage(p: typeof packagesTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    duration: p.duration,
    features: p.features,
    popular: p.popular,
  };
}

router.get("/packages", async (_req, res): Promise<void> => {
  const packages = await db.select().from(packagesTable).orderBy(packagesTable.price);
  res.json(packages.map(formatPackage));
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPackageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, params.data.id));
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  res.json(formatPackage(pkg));
});

export default router;
