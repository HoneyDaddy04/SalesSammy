import { queryAll } from "../db/database.js";

export interface MergedContext {
  persona: string;
  instructions: string;
  voiceExamples: string[];
}

/**
 * Merge base teammate persona/instructions with applicable context overrides.
 * Overrides match by sequence, channel, or contact tag (segment).
 */
export function mergeContext(
  orgId: string,
  basePersona: string,
  baseInstructions: string,
  baseVoice: string[],
  sequenceId: string | null,
  channel: string,
  contactTags: string[]
): MergedContext {
  const overrides = queryAll(
    `SELECT * FROM context_overrides WHERE org_id = ?`,
    [orgId]
  );

  let persona = basePersona;
  let instructions = baseInstructions;
  let voice = [...baseVoice];

  for (const ov of overrides) {
    const matches =
      (ov.scope_type === "sequence" && ov.scope_id === sequenceId) ||
      (ov.scope_type === "channel" && ov.scope_id === channel) ||
      (ov.scope_type === "segment" && contactTags.includes(ov.scope_id as string));

    if (matches) {
      if (ov.persona_additions) persona += `\n${ov.persona_additions}`;
      if (ov.instruction_additions) instructions += `\n${ov.instruction_additions}`;
      const voiceOv = JSON.parse((ov.voice_overrides as string) || "[]");
      if (voiceOv.length > 0) voice = voiceOv;
    }
  }

  return { persona, instructions, voiceExamples: voice };
}
