import { queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";
import { handleJob } from "./job-handlers.js";

export async function enqueue(orgId: string, type: string, payload: object): Promise<string> {
  const id = uuid();
  await run(
    `INSERT INTO job_queue (id, org_id, type, payload) VALUES ($1, $2, $3, $4)`,
    [id, orgId, type, JSON.stringify(payload)]
  );
  return id;
}

export async function getJob(id: string) {
  return await queryOne(`SELECT * FROM job_queue WHERE id = $1`, [id]);
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
      `UPDATE job_queue SET status = 'running', started_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
      [job.id]
    );

    try {
      const result = await handleJob(job as any);
      await run(
        `UPDATE job_queue SET status = 'completed', result = $1, completed_at = NOW() WHERE id = $2`,
        [JSON.stringify(result), job.id]
      );
    } catch (err: any) {
      const attempts = (job.attempts as number) + 1;
      const maxAttempts = job.max_attempts as number;
      const isFinalFailure = attempts >= maxAttempts;
      const newStatus = isFinalFailure ? "failed" : "queued";

      console.error(
        `Job ${job.id} (${job.type}) failed attempt ${attempts}/${maxAttempts}: ${err.message}`
      );

      await run(
        `UPDATE job_queue SET status = $1, error = $2 WHERE id = $3`,
        [newStatus, err.message, job.id]
      );

      // Dead letter logging: record permanently failed jobs in activity_log
      if (isFinalFailure) {
        console.error(`Job ${job.id} (${job.type}) permanently failed after ${maxAttempts} attempts`);
        try {
          await run(
            `INSERT INTO activity_log (id, org_id, type, summary, detail, created_at)
             VALUES ($1, $2, 'job_failed', $3, $4, NOW())`,
            [
              uuid(),
              job.org_id,
              `Job "${job.type}" permanently failed after ${maxAttempts} attempts`,
              JSON.stringify({ job_id: job.id, type: job.type, error: err.message, payload: job.payload }),
            ]
          );
        } catch (logErr: any) {
          console.error(`Failed to write dead letter log for job ${job.id}:`, logErr.message);
        }
      }
    }
  } catch (err: any) {
    // Catch-all so one poll error doesn't crash the runner
    console.error("Job runner poll error:", err.message);
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
