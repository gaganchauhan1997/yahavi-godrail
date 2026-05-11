import { Router } from "express";
import { db } from "@workspace/db";
import { mediaAssetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateMediaBody,
  DeleteMediaParams,
  ListMediaQueryParams,
} from "@workspace/api-zod";

export const mediaRouter = Router();

mediaRouter.get("/", async (req, res) => {
  const { workspaceId, type } = ListMediaQueryParams.parse(req.query);
  let rows = await db.select().from(mediaAssetsTable).orderBy(mediaAssetsTable.createdAt);
  if (workspaceId) rows = rows.filter((m) => m.workspaceId === workspaceId);
  if (type) rows = rows.filter((m) => m.type === type);
  res.json(rows.map(serializeMedia));
});

mediaRouter.post("/", async (req, res) => {
  const body = CreateMediaBody.parse(req.body);
  const [row] = await db.insert(mediaAssetsTable).values(body).returning();
  res.status(201).json(serializeMedia(row));
});

mediaRouter.delete("/:id", async (req, res) => {
  const { id } = DeleteMediaParams.parse({ id: Number(req.params.id) });
  await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
  res.status(204).send();
});

function serializeMedia(m: typeof mediaAssetsTable.$inferSelect) {
  return {
    id: m.id,
    workspaceId: m.workspaceId,
    url: m.url,
    type: m.type,
    filename: m.filename,
    fileSize: m.fileSize ?? null,
    mimeType: m.mimeType ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}
