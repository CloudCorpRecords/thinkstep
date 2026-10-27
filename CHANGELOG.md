# Changelog

## 0.1.0 (2026-10-26)

First release.

- MCP server with one tool, `sequentialthinking`: record a chain of thoughts
  one step at a time for dynamic, reflective problem-solving.
- In-process thought history: every accepted thought is appended, and
  `thoughtHistoryLength` reports how deep the chain runs.
- `totalThoughts` is raised automatically when `thoughtNumber` passes the
  current estimate, so a chain can outgrow its first guess.
- Branches: a thought carrying both `branchFromThought` and `branchId` opens
  or continues a named branch; every response lists the branch ids so far.
- Revisions: `isRevision` plus `revisesThought` records a rethink of an
  earlier thought without erasing it.
- Invalid input (missing or mistyped fields) returns an `isError` result
  naming the offending field, and records nothing.
- One bin, `thinkstep`, serves the CLI (`--version`) and the stdio MCP
  server (`thinkstep mcp`).
