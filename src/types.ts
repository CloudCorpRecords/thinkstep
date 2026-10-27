/**
 * thinkstep types.
 *
 * A thought chain is built one ThoughtInput at a time. The server keeps
 * every accepted thought in an in-process history, tracks named branches
 * that fork off an earlier thought, and answers each call with a
 * ThoughtResponse summarising where the chain now stands: the current
 * thought number, the (possibly raised) total estimate, whether another
 * thought is needed, the branch ids seen so far, and how many thoughts
 * the history holds.
 */

/** One thinking step, as accepted by the sequentialthinking tool. */
export interface ThoughtInput {
  /** Your current thinking step. */
  thought: string;
  /** Whether another thought step is needed. */
  nextThoughtNeeded: boolean;
  /** Current thought number (numeric value, e.g., 1, 2, 3). */
  thoughtNumber: number;
  /** Estimated total thoughts needed (numeric value, e.g., 5, 10). */
  totalThoughts: number;
  /** Whether this revises a previous thought. */
  isRevision?: boolean;
  /** Which thought is being reconsidered. */
  revisesThought?: number;
  /** Branching point thought number. */
  branchFromThought?: number;
  /** Branch identifier. */
  branchId?: string;
  /** If more thoughts are needed. */
  needsMoreThoughts?: boolean;
}

/** The JSON summary returned for every accepted thought. */
export interface ThoughtResponse {
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  /** Ids of every branch created so far, in creation order. */
  branches: string[];
  /** Number of thoughts stored in the history, including this one. */
  thoughtHistoryLength: number;
}
