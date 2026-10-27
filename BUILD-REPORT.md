# BUILD REPORT — thinkstep (Wave 1, MCP Rebuild 100)

Clean-room rebuild of the `sequential-thinking` MCP server
(`@modelcontextprotocol/server-sequential-thinking`), implemented from the
public tool spec only. No original source or README was fetched or read.
Local build only — nothing pushed or published.

- npm: `@reneturcios/thinkstep`
- MCP server name: `io.github.CloudCorpRecords/thinkstep`
- Version: `0.1.0` (consistent across package.json, server.json top-level +
  npm entry + OCI tag, src/think.ts `VERSION`, CHANGELOG heading)
- Build dir: `~/workspace/mcp-rebuild-100/builds/thinkstep/`

## Files (19 template items, all present)

- `package.json` — bin `thinkstep: dist/cli.js`, `mcpName`
  `io.github.CloudCorpRecords/thinkstep`, fleet scripts/deps.
- `server.json` — description **76 chars** (≤100):
  "Step-by-step reflective thinking: record, revise, and branch thought
  chains." npm entry carries `version: 0.1.0`; **OCI entry has no
  `version` field** (version only in the tagged identifier
  `ghcr.io/cloudcorprecords/thinkstep:0.1.0`).
- `Dockerfile` — two-stage `node:20-alpine`, ENTRYPOINT
  `node /app/dist/cli.js`, CMD `mcp`, label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/thinkstep"`.
- `tsconfig.json` — byte-identical to shipcheck's (318 bytes).
- `.gitignore`, `LICENSE` (MIT, © 2026 Rene Turcios), `README.md` (fresh
  prose), `CHANGELOG.md` (single 0.1.0 entry, 2026-10-26).
- `src/types.ts` — `ThoughtInput`, `ThoughtResponse`.
- `src/think.ts` — core: `VERSION`, `validateThoughtInput`, `ThinkStep`
  class (`addThought` appends to in-process history, raises
  `totalThoughts` to `thoughtNumber` when outgrown, tracks branches when
  both `branchFromThought` and `branchId` are given, records revisions,
  returns `{thoughtNumber, totalThoughts, nextThoughtNeeded, branches,
  thoughtHistoryLength}`).
- `src/mcp.ts` — stdio MCP server, one tool `sequentialthinking`.
- `src/cli.ts` — `mcp` subcommand dispatch, `--version`; unknown commands
  print Usage and exit 2.
- `src/index.ts` — re-exports types + think.
- `test/think.test.ts` — 18 tests (see below).
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`
  — adapted from shipcheck; publish-container IMAGE and smoke assertion
  renamed to thinkstep.

## Design note — tool registration

`src/mcp.ts` registers the tool through the SDK's low-level `Server` API
(`setRequestHandler` for `tools/list` / `tools/call`) instead of the
`McpServer` + zod path used by shipcheck. Reason, verified against
shipcheck's installed SDK before building: the zod path serves an
inputSchema with two extra keys the public spec does not have
(`additionalProperties: false` and `$schema:
http://json-schema.org/draft-07/schema#`), which the parity harness
scores as a schema difference (a 1-tool server would land at 50%). The
low-level API serves the spec schema exactly. Validation is shared with
the core, so behaviour is identical either way; invalid input returns an
`isError` result naming the offending field. Everything else follows the
template mechanics unchanged.

## Verification (exact outputs)

1. **Build:** `./node_modules/.bin/tsc` → exit **0**; `dist/` contains
   cli/index/mcp/think/types (.js + .d.ts + maps).
2. **Tests:** `./node_modules/.bin/tsx --test test/*.test.ts` →
   **tests 18, pass 18, fail 0** (suites: ThinkStep 10, validateThoughtInput
   7, VERSION 1). Covers: first-thought response shape, totalThoughts
   auto-raise, branch creation + branches list (incl. order/no-duplicate
   and branchId-only no-branch), revision accepted, thoughtHistoryLength
   growth, needsMoreThoughts, instance isolation, 6 validation rejections.
3. **Live smoke** (stdio JSON-RPC against `dist/cli.js mcp`):
   initialize → `serverInfo {name: "thinkstep", version: "0.1.0"}`; valid
   thought → `{"thoughtNumber":1,"totalThoughts":2,"nextThoughtNeeded":true,"branches":[],"thoughtHistoryLength":1}`;
   branch thought → `branches:["alt"]`, `thoughtHistoryLength:2`; invalid
   args (missing `thought`) → `isError: true`, text
   `Invalid thought input: "thought" must be a string`; `--version` →
   `0.1.0`; unknown command → Usage on stderr, exit 2.
4. **Parity (required): PASS, parity_pct 100.0**, harness exit 0.
   Fixture written first:
   `~/workspace/mcp-rebuild-100/harness/fixtures/sequential-thinking-tools-original.json`
   (`{"_source":"public spec; audited GT 1 tool GT-clean","tools":[…]}`, the
   `sequentialthinking` tool exactly as specced). Command, from the harness
   dir: `python3 parity.py --original fixtures/sequential-thinking-tools-original.json --rebuild "stdio:node /home/hatch/workspace/mcp-rebuild-100/builds/thinkstep/dist/cli.js mcp" --out /home/hatch/workspace/mcp-rebuild-100/builds/thinkstep/parity-out`.
   Output: `verdict=PASS parity_pct=100.0 original_tools=1 rebuild_tools=1 missing=[] extra=[] schema_diffs=[]`.
   **Residual diffs: none.** Full report in `parity-out/parity.md` /
   `parity-out/parity.json` inside the build dir.

## Lockfile status

`package-lock.json` present via the sanctioned copy path: copied from
shipcheck (identical dependency ranges) and the three identity strings
renamed with the file edit tool (top-level name, root package name, root
bin key — all now `@reneturcios/thinkstep` / `thinkstep`); verified valid
JSON with zero `shipcheck` strings remaining. Caveat per the fleet lesson:
the lock was derived from a copied tree rather than generated clean with
no `node_modules` present (npm install hangs in this environment), so a
clean `npm install` regeneration is worth doing before the first real
publish. `node_modules` was copied with `cp -a` from shipcheck;
ownership-preservation warnings were emitted but the copy is complete
(97 top-level entries, matching source) and `tsc`/`tsx` run from it.

## Blockers

None for the local build. Not done (by task scope): no git repo created,
no push, no npm/GHCR/Registry publish, no mcpaudit/mcpvet/shipcheck
validation pass — those belong to the program's validation phase.
