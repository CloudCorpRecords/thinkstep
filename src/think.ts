/**
 * thinkstep core: an in-process thought chain for reflective
 * problem-solving.
 *
 * Each accepted thought is appended to the history. When a thought's
 * number runs past the estimated total, the total is raised to match —
 * a chain is allowed to grow beyond its first estimate. A thought that
 * carries both a branching point and a branch id opens (or continues) a
 * named branch: an alternative line of reasoning forked from an earlier
 * thought. Revisions are ordinary history entries flagged with
 * isRevision / revisesThought; the original wording stays in the
 * history so the chain remains auditable.
 *
 * All validation lives here, not in the transport, so the MCP layer and
 * the tests exercise exactly the same rules. Invalid input throws an
 * Error with a plain-language message; the MCP layer turns that into an
 * isError tool result.
 */
import type { ThoughtInput, ThoughtResponse } from "./types.js";

export const VERSION = "0.1.0";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function fail(message: string): never {
  throw new Error(`Invalid thought input: ${message}`);
}

function requireString(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  if (typeof v !== "string") fail(`"${key}" must be a string`);
  return v;
}

function optionalString(raw: Record<string, unknown>, key: string): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  if (typeof v !== "string") fail(`"${key}" must be a string`);
  return v;
}

function requireBoolean(raw: Record<string, unknown>, key: string): boolean {
  const v = raw[key];
  if (typeof v !== "boolean") fail(`"${key}" must be a boolean`);
  return v;
}

function optionalBoolean(raw: Record<string, unknown>, key: string): boolean | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  if (typeof v !== "boolean") fail(`"${key}" must be a boolean`);
  return v;
}

function requireInteger(raw: Record<string, unknown>, key: string): number {
  const v = raw[key];
  if (typeof v !== "number" || !Number.isInteger(v)) {
    fail(`"${key}" must be an integer`);
  }
  return v as number;
}

function optionalInteger(raw: Record<string, unknown>, key: string): number | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  if (typeof v !== "number" || !Number.isInteger(v)) {
    fail(`"${key}" must be an integer`);
  }
  return v;
}

/**
 * Validate untrusted tool arguments into a ThoughtInput.
 * Throws an Error describing the first problem found.
 */
export function validateThoughtInput(input: unknown): ThoughtInput {
  if (!isRecord(input)) fail("arguments must be an object");
  const raw = input as Record<string, unknown>;

  const thought = requireString(raw, "thought");
  const nextThoughtNeeded = requireBoolean(raw, "nextThoughtNeeded");
  const thoughtNumber = requireInteger(raw, "thoughtNumber");
  const totalThoughts = requireInteger(raw, "totalThoughts");
  const isRevision = optionalBoolean(raw, "isRevision");
  const revisesThought = optionalInteger(raw, "revisesThought");
  const branchFromThought = optionalInteger(raw, "branchFromThought");
  const branchId = optionalString(raw, "branchId");
  const needsMoreThoughts = optionalBoolean(raw, "needsMoreThoughts");

  const out: ThoughtInput = { thought, nextThoughtNeeded, thoughtNumber, totalThoughts };
  if (isRevision !== undefined) out.isRevision = isRevision;
  if (revisesThought !== undefined) out.revisesThought = revisesThought;
  if (branchFromThought !== undefined) out.branchFromThought = branchFromThought;
  if (branchId !== undefined) out.branchId = branchId;
  if (needsMoreThoughts !== undefined) out.needsMoreThoughts = needsMoreThoughts;
  return out;
}

/**
 * A single thought-chain session. One instance holds one history and
 * one set of branches; the MCP server owns one instance for the life of
 * the process.
 */
export class ThinkStep {
  private thoughtHistory: ThoughtInput[] = [];
  private branches = new Map<string, ThoughtInput[]>();

  /** Number of thoughts accepted so far. */
  get historyLength(): number {
    return this.thoughtHistory.length;
  }

  /** Every thought accepted so far, in arrival order. */
  getHistory(): readonly ThoughtInput[] {
    return this.thoughtHistory;
  }

  /** Branch ids created so far, in creation order. */
  branchIds(): string[] {
    return [...this.branches.keys()];
  }

  /** The thoughts recorded under one branch id (empty when unknown). */
  branchThoughts(branchId: string): readonly ThoughtInput[] {
    return this.branches.get(branchId) ?? [];
  }

  /**
   * Validate and record one thought, then summarise the chain.
   *
   * Side effects on the stored copy: totalThoughts is raised to
   * thoughtNumber when the chain has outgrown its estimate, so the
   * response (and later history reads) never report a total below the
   * current thought number.
   */
  addThought(input: unknown): ThoughtResponse {
    const data = validateThoughtInput(input);

    if (data.thoughtNumber > data.totalThoughts) {
      data.totalThoughts = data.thoughtNumber;
    }

    this.thoughtHistory.push(data);

    if (data.branchFromThought !== undefined && data.branchId !== undefined) {
      const branch = this.branches.get(data.branchId);
      if (branch) branch.push(data);
      else this.branches.set(data.branchId, [data]);
    }

    return {
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded || (data.needsMoreThoughts ?? false),
      branches: this.branchIds(),
      thoughtHistoryLength: this.thoughtHistory.length,
    };
  }
}
