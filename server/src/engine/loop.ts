import { v4 as uuid } from "uuid";
import { queryAll, queryOne, run } from "../db/database.js";
import { evaluateTrigger } from "./triggers.js";
import { runResearch } from "./research.js";
import { draftAction, executeAction } from "./actions.js";
import type { AgentConfig, TriggerConfig, WorkTarget, ChannelType, ResearchStep } from "../types/index.js";

/**
 * The proactive agent loop.
 *
 * For each active agent:
 *   1. SCAN — evaluate triggers against data sources
 *   2. DEDUPE — skip targets we've already created work items for
 *   3. RESEARCH — gather context about each new target
 *   4. DRAFT — use Claude to craft the right action
 *   5. ROUTE — if approval required, queue for human review; otherwise execute
 *   6. LOG — record everything in the activity log
 */

export async function runAgentCycle(agentRow: Record<string, unknown>): Promise<number> {
  const agent = parseAgentRow(agentRow);
  let workCreated = 0;

  await logActivity(agent, null, `Starting scan cycle`, agent.triggers.length + " triggers to check", "info");

  for (const trigger of agent.triggers) {
    try {
      // 1. SCAN
      const targets = await evaluateTrigger(trigger);

      for (const target of targets) {
        // 2. DEDUPE — don't create duplicate work items
        const existing = await queryOne(
          `SELECT id FROM work_items WHERE agent_id = ? AND json_extract(target, '$.id') = ? AND status NOT IN ('executed', 'rejected', 'failed')`,
          [agent.id, target.id]
        );
        if (existing) continue;

        const workItemId = uuid();

        // Create work item in "discovered" state
        await run(
          `INSERT INTO work_items (id, org_id, agent_id, trigger_type, target, status) VALUES (?, ?, ?, ?, ?, 'discovered')`,
          [workItemId, agent.org_id, agent.id, trigger.type, JSON.stringify(target)]
        );

        await logActivity(agent, workItemId, `Found ${target.type}: ${target.name}`, `Trigger: ${trigger.type}`, "info");

        // 3. RESEARCH
        await run(`UPDATE work_items SET status = 'researching', updated_at = NOW() WHERE id = ?`, [workItemId]);

        const researchContext = await runResearch(agent.research, target, agent.org_id);

        await run(
          `UPDATE work_items SET research_context = ?, updated_at = NOW() WHERE id = ?`,
          [researchContext, workItemId]
        );

        await logActivity(agent, workItemId, `Researched ${target.name}`, `Gathered context from ${agent.research.length} sources`, "info");

        // 4. DRAFT
        const proposedAction = await draftAction(
          agent.persona,
          trigger.type,
          target,
          researchContext,
          agent.actions,
          agent.channels
        );

        // 5. ROUTE
        if (agent.approval_required) {
          await run(
            `UPDATE work_items SET status = 'pending_approval', proposed_action = ?, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(proposedAction), workItemId]
          );
          await logActivity(agent, workItemId, `Drafted message for ${target.name} — awaiting approval`, proposedAction.content.slice(0, 100), "pending");
        } else {
          // Auto-execute
          await run(
            `UPDATE work_items SET status = 'approved', proposed_action = ?, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(proposedAction), workItemId]
          );

          const result = await executeAction(proposedAction, target);

          await run(
            `UPDATE work_items SET status = 'executed', result = ?, updated_at = NOW() WHERE id = ?`,
            [result, workItemId]
          );
          await logActivity(agent, workItemId, `Sent ${proposedAction.type.replace("_", " ")} to ${target.name}`, result, "success");
        }

        workCreated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await logActivity(agent, null, `Error evaluating trigger ${trigger.type}`, msg, "error");
    }
  }

  await logActivity(agent, null, `Scan complete — ${workCreated} new work items`, "", "info");
  return workCreated;
}

/**
 * Run all active agents in the org.
 */
export async function runAllAgents(orgId: string): Promise<Record<string, number>> {
  const agents = await queryAll(`SELECT * FROM agents WHERE org_id = ? AND status = 'active'`, [orgId]);
  const results: Record<string, number> = {};

  for (const agent of agents) {
    results[agent.name as string] = await runAgentCycle(agent);
  }

  return results;
}

/**
 * Start the scheduler that runs agents on their configured intervals.
 */
export async function startScheduler(orgId: string) {
  const agents = await queryAll(`SELECT * FROM agents WHERE org_id = ? AND status = 'active'`, [orgId]);

  for (const agentRow of agents) {
    const agent = parseAgentRow(agentRow);
    const intervalMs = agent.schedule_interval_minutes * 60 * 1000;

    console.log(`Scheduling ${agent.name} (${agent.role}) every ${agent.schedule_interval_minutes} minutes`);

    // Run immediately on first tick, then on interval
    setTimeout(() => {
      runAgentCycle(agentRow).catch((err) =>
        console.error(`Agent ${agent.name} cycle failed:`, err)
      );
    }, 5000); // 5s delay on startup

    setInterval(() => {
      runAgentCycle(agentRow).catch((err) =>
        console.error(`Agent ${agent.name} cycle failed:`, err)
      );
    }, intervalMs);
  }
}

// --- Helpers ---

function parseAgentRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    org_id: row.org_id as string,
    name: row.name as string,
    role: row.role as string,
    persona: row.persona as string,
    triggers: JSON.parse(row.triggers as string) as TriggerConfig[],
    research: JSON.parse(row.research_steps as string) as ResearchStep[],
    actions: JSON.parse(row.actions as string) as string[],
    channels: JSON.parse(row.channels as string) as ChannelType[],
    approval_required: !!(row.approval_required as number),
    schedule_interval_minutes: row.schedule_interval_minutes as number,
  };
}

async function logActivity(
  agent: { id: string; org_id: string; name: string },
  workItemId: string | null,
  action: string,
  detail: string,
  status: "info" | "success" | "warning" | "error" | "pending"
) {
  await run(
    `INSERT INTO activity_log (id, org_id, agent_id, agent_name, work_item_id, action, detail, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid(), agent.org_id, agent.id, agent.name, workItemId, action, detail, status]
  );
}
