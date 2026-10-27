import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ThinkStep, validateThoughtInput, VERSION } from "../src/think.js";

function firstThought(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    thought: "Break the problem into parts.",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 3,
    ...overrides,
  };
}

describe("ThinkStep", () => {
  it("answers the first thought with the full response shape", () => {
    const thinker = new ThinkStep();
    const res = thinker.addThought(firstThought());
    assert.deepEqual(res, {
      thoughtNumber: 1,
      totalThoughts: 3,
      nextThoughtNeeded: true,
      branches: [],
      thoughtHistoryLength: 1,
    });
  });

  it("raises totalThoughts when thoughtNumber passes the estimate", () => {
    const thinker = new ThinkStep();
    thinker.addThought(firstThought());
    const res = thinker.addThought(
      firstThought({ thought: "This is bigger than expected.", thoughtNumber: 5 }),
    );
    assert.equal(res.thoughtNumber, 5);
    assert.equal(res.totalThoughts, 5);
  });

  it("leaves totalThoughts alone while the chain is inside the estimate", () => {
    const thinker = new ThinkStep();
    const res = thinker.addThought(firstThought({ thoughtNumber: 2 }));
    assert.equal(res.totalThoughts, 3);
  });

  it("creates a branch and lists it in the response", () => {
    const thinker = new ThinkStep();
    thinker.addThought(firstThought());
    const res = thinker.addThought(
      firstThought({
        thought: "Alternative approach: try it backwards.",
        thoughtNumber: 2,
        branchFromThought: 1,
        branchId: "backwards",
      }),
    );
    assert.deepEqual(res.branches, ["backwards"]);
    assert.equal(thinker.branchThoughts("backwards").length, 1);
  });

  it("keeps branches in creation order without duplicating an id", () => {
    const thinker = new ThinkStep();
    thinker.addThought(firstThought());
    thinker.addThought(
      firstThought({ thoughtNumber: 2, branchFromThought: 1, branchId: "alpha" }),
    );
    thinker.addThought(
      firstThought({ thoughtNumber: 2, branchFromThought: 1, branchId: "beta" }),
    );
    const res = thinker.addThought(
      firstThought({ thoughtNumber: 3, branchFromThought: 1, branchId: "alpha" }),
    );
    assert.deepEqual(res.branches, ["alpha", "beta"]);
    assert.equal(thinker.branchThoughts("alpha").length, 2);
    assert.equal(thinker.branchThoughts("beta").length, 1);
  });

  it("does not open a branch from a branchId alone (no branching point)", () => {
    const thinker = new ThinkStep();
    const res = thinker.addThought(firstThought({ branchId: "orphan" }));
    assert.deepEqual(res.branches, []);
  });

  it("accepts a revision of an earlier thought", () => {
    const thinker = new ThinkStep();
    thinker.addThought(firstThought());
    const res = thinker.addThought(
      firstThought({
        thought: "On reflection, the split should be by cost, not size.",
        thoughtNumber: 2,
        isRevision: true,
        revisesThought: 1,
      }),
    );
    assert.equal(res.thoughtHistoryLength, 2);
    const stored = thinker.getHistory()[1];
    assert.equal(stored.isRevision, true);
    assert.equal(stored.revisesThought, 1);
  });

  it("grows thoughtHistoryLength with every accepted thought", () => {
    const thinker = new ThinkStep();
    assert.equal(thinker.addThought(firstThought()).thoughtHistoryLength, 1);
    assert.equal(
      thinker.addThought(firstThought({ thoughtNumber: 2 })).thoughtHistoryLength,
      2,
    );
    assert.equal(
      thinker.addThought(
        firstThought({ thoughtNumber: 3, nextThoughtNeeded: false }),
      ).thoughtHistoryLength,
      3,
    );
    assert.equal(thinker.historyLength, 3);
  });

  it("treats needsMoreThoughts as another thought being needed", () => {
    const thinker = new ThinkStep();
    const res = thinker.addThought(
      firstThought({ nextThoughtNeeded: false, needsMoreThoughts: true }),
    );
    assert.equal(res.nextThoughtNeeded, true);
  });

  it("keeps separate instances fully isolated", () => {
    const a = new ThinkStep();
    const b = new ThinkStep();
    a.addThought(firstThought({ branchFromThought: 1, branchId: "only-a" }));
    assert.equal(b.historyLength, 0);
    assert.deepEqual(b.branchIds(), []);
  });
});

describe("validateThoughtInput", () => {
  it("accepts a minimal valid input and drops nothing required", () => {
    const out = validateThoughtInput(firstThought());
    assert.equal(out.thought, "Break the problem into parts.");
    assert.equal(out.thoughtNumber, 1);
    assert.equal(out.totalThoughts, 3);
  });

  it("rejects a missing thought", () => {
    const bad = firstThought();
    delete bad.thought;
    assert.throws(() => validateThoughtInput(bad), /"thought" must be a string/);
  });

  it("rejects a non-boolean nextThoughtNeeded", () => {
    assert.throws(
      () => validateThoughtInput(firstThought({ nextThoughtNeeded: "yes" })),
      /"nextThoughtNeeded" must be a boolean/,
    );
  });

  it("rejects a fractional thoughtNumber", () => {
    assert.throws(
      () => validateThoughtInput(firstThought({ thoughtNumber: 1.5 })),
      /"thoughtNumber" must be an integer/,
    );
  });

  it("rejects a missing totalThoughts", () => {
    const bad = firstThought();
    delete bad.totalThoughts;
    assert.throws(() => validateThoughtInput(bad), /"totalThoughts" must be an integer/);
  });

  it("rejects mistyped optional fields", () => {
    assert.throws(
      () => validateThoughtInput(firstThought({ branchId: 42 })),
      /"branchId" must be a string/,
    );
    assert.throws(
      () => validateThoughtInput(firstThought({ isRevision: "true" })),
      /"isRevision" must be a boolean/,
    );
  });

  it("rejects non-object arguments outright", () => {
    assert.throws(() => validateThoughtInput(null), /arguments must be an object/);
    assert.throws(() => validateThoughtInput("thought"), /arguments must be an object/);
    assert.throws(() => new ThinkStep().addThought(undefined), /arguments must be an object/);
  });
});

describe("VERSION", () => {
  it("is 0.1.0 for the first rebuild release", () => {
    assert.equal(VERSION, "0.1.0");
  });
});
