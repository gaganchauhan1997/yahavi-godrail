import { Router } from "express";
import { db } from "@workspace/db";
import { workspacesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
  UpdateWorkspaceParams,
  DeleteWorkspaceParams,
  GetWorkspaceParams,
} from "@workspace/api-zod";

export const workspacesRouter = Router();

workspacesRouter.get("/", async (req, res) => {
  const rows = await db.select().from(workspacesTable).orderBy(workspacesTable.createdAt);
  res.json(rows.map(serializeWorkspace));
});

workspacesRouter.post("/", async (req, res) => {
  const body = CreateWorkspaceBody.parse(req.body);
  const [row] = await db.insert(workspacesTable).values(body).returning();
  res.status(201).json(serializeWorkspace(row));
});

workspacesRouter.get("/:id", async (req, res) => {
  const { id } = GetWorkspaceParams.parse({ id: Number(req.params.id) });
  const [row] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, id));
  if (!row) return res.status(404).json({ error: "Workspace not found" });
  res.json(serializeWorkspace(row));
});

workspacesRouter.patch("/:id", async (req, res) => {
  const { id } = UpdateWorkspaceParams.parse({ id: Number(req.params.id) });
  const body = UpdateWorkspaceBody.parse(req.body);
  const [row] = await db.update(workspacesTable).set(body).where(eq(workspacesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "Workspace not found" });
  res.json(serializeWorkspace(row));
});

workspacesRouter.delete("/:id", async (req, res) => {
  const { id } = DeleteWorkspaceParams.parse({ id: Number(req.params.id) });
  await db.delete(workspacesTable).where(eq(workspacesTable.id, id));
  res.status(204).send();
});

function serializeWorkspace(w: typeof workspacesTable.$inferSelect) {
  return {
    id: w.id,
    name: w.name,
    description: w.description ?? null,
    avatarUrl: w.avatarUrl ?? null,
    createdAt: w.createdAt.toISOString(),
  };
}
