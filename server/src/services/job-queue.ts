import { queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";
import { handleJob } from "./job-handlers.js";

export async function enqueue(orgId: string, type: string, payload: object): Promise<string> {
  const id = uuid();
  await run(
    `INSERT INTO job_queue (id, org_id, type, payload) VALUES (?, ?, ?, ?)`,
    [id, orgId, type, JSON.stringify(payload)]
  );
  return id;
}

export async function getJob(id: string) {
  return await queryOne(`SELECT * FROM job_queue WHERE id = ?`, [id]);
}

let running = false;

async function poll() {
  if (running) return;
  running = true;
  try {
    const job = await queryOne(
      `SELECT * FROM job_queue WHERE status = 'queued' AND attempts < max_attempts ORDER BY created_at ASC LIMIT 1`
    );
    if (!job) return;

    await run(
      `UPDATE job_queue SET status = 'running', started_at = NOW(), attempts = attempts + 1 WHERE id = ?`,
      [job.id]
    );

    try {
      const result = await handleJob(job as any);
      await run(
        `UPDATE job_queue SET status = 'completed', result = ?, completed_at = NOW() WHERE id = ?`,
        [JSON.stringify(result), job.id]
      );
    } catch (err: any) {
      const attempts = (job.attempts as number) + 1;
      const maxAttempts = job.max_attempts as number;
      await run(
        `UPDATE job_queue SET status = ?, error = ? WHERE id = ?`,
        [attempts >= maxAttempts ? "failed" : "queued", err.message, job.id]
      );
    }
  } finally {
    running = false;
  }
}

let intervalId: ReturnType<typeof setInterval>;

export function startJobRunner(intervalMs = 2000) {
  intervalId = setInterval(poll, intervalMs);
  console.log(`Job runner started (polling every ${intervalMs}ms)`);
}

export function stopJobRunner() {
  if (intervalId) clearInterval(intervalId);
}
