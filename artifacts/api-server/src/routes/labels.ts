import { Router } from "express";
import { db } from "@workspace/db";
import { labelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateLabelBody,
  UpdateLabelBody,
  UpdateLabelParams,
  DeleteLabelParams,
  ListLabelsQueryParams,
} from "@workspace/api-zod";

export const labelsRouter = Router();

labelsRouter.get("/", async (req, res) => {
  const { workspaceId } = ListLabelsQueryParams.parse(req.query);
  let rows = await db.select().from(labelsTable).orderBy(labelsTable.name);
  if (workspaceId) rows = rows.filter((l) => l.workspaceId === workspaceId);
  res.json(rows.map(serializeLabel));
});

labelsRouter.post("/", async (req, res) => {
  const body = CreateLabelBody.parse(req.body);
  const [row] = await db.insert(labelsTable).values(body).returning();
  res.status(201).json(serializeLabel(row));
});

labelsRouter.patch("/:id", async (req, res) => {
  const { id } = UpdateLabelParams.parse({ id: Number(req.params.id) });
  const body = UpdateLabelBody.parse(req.body);
  const [row] = await db.update(labelsTable).set(body).where(eq(labelsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Label not found" }); return; }
  res.json(serializeLabel(row));
});

labelsRouter.delete("/:id", async (req, res) => {
  const { id } = DeleteLabelParams.parse({ id: Number(req.params.id) });
  await db.delete(labelsTable).where(eq(labelsTable.id, id));
  res.status(204).send();
});

function serializeLabel(l: typeof labelsTable.$inferSelect) {
  return {
    id: l.id,
    workspaceId: l.workspaceId,
    name: l.name,
    color: l.color,
    createdAt: l.createdAt.toISOString(),
  };
}
