import { queryOne, queryAll, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

export type EntityType = "teammate" | "sequence" | "context_override";
export type ChangedBy = "user" | "system" | "chat";

/** Snapshot the current state before making a change. Returns revision id. */
export function snapshotBeforeUpdate(
  orgId: string,
  entityType: EntityType,
  entityId: string,
  currentState: Record<string, unknown>,
  description: string,
  changedBy: ChangedBy = "user"
): string {
  const lastRevision = queryOne(
    `SELECT MAX(revision_number) as max_rev FROM config_revisions WHERE entity_type = ? AND entity_id = ?`,
    [entityType, entityId]
  );
  const revisionNumber = ((lastRevision?.max_rev as number) || 0) + 1;
  const id = uuid();
  run(
    `INSERT INTO config_revisions (id, org_id, entity_type, entity_id, revision_number, snapshot, change_description, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, orgId, entityType, entityId, revisionNumber, JSON.stringify(currentState), description, changedBy]
  );
  return id;
}

/** List all revisions for an entity (newest first). */
export function getRevisions(entityType: string, entityId: string) {
  return queryAll(
    `SELECT id, revision_number, change_description, changed_by, created_at FROM config_revisions WHERE entity_type = ? AND entity_id = ? ORDER BY revision_number DESC`,
    [entityType, entityId]
  );
}

/** Get a single revision's full snapshot. */
export function getRevision(revisionId: string) {
  return queryOne(`SELECT * FROM config_revisions WHERE id = ?`, [revisionId]);
}
