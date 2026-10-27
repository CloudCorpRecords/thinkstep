# thinkstep

**Think in steps, out loud, with a server keeping the thread.**

Some problems do not yield to a single pass. You form a first idea, poke at it, realise the second step contradicts the first, double back, try a different route from an earlier point, and only then see the shape of the answer. thinkstep is the notebook for that process: an MCP server with one tool, `sequentialthinking`, that records a chain of thoughts one step at a time and keeps the whole history — revisions and side branches included — straight for you.

Each call adds one thought. You say where you are (`thoughtNumber`), roughly how far you think you have to go (`totalThoughts`), and whether you need another step. If the chain outgrows your estimate, the server raises the total for you instead of complaining. When a step rethinks an earlier one, flag it as a revision and point at the thought it reconsiders. When you want to explore a different route without losing the main line, fork a named branch from an earlier thought; every response lists the branch ids created so far, so you always know which threads are open.

State lives in the server process for the length of the session. Nothing is written to disk, nothing leaves the machine, and closing the session closes the notebook.

## Usage

### MCP server

```bash
npx @reneturcios/thinkstep mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "thinkstep": {
      "command": "npx",
      "args": ["-y", "@reneturcios/thinkstep", "mcp"]
    }
  }
}
```

### Docker

```bash
docker run -i ghcr.io/cloudcorprecords/thinkstep          # stdio MCP server (default command is "mcp")
docker run --rm ghcr.io/cloudcorprecords/thinkstep --version
```

## The tool

### `sequentialthinking`

Record one thinking step and get back a summary of the chain.

| parameter | type | required | meaning |
| --- | --- | --- | --- |
| `thought` | string | yes | Your current thinking step |
| `nextThoughtNeeded` | boolean | yes | Whether another thought step is needed |
| `thoughtNumber` | integer | yes | Current thought number (numeric value, e.g., 1, 2, 3) |
| `totalThoughts` | integer | yes | Estimated total thoughts needed (numeric value, e.g., 5, 10) |
| `isRevision` | boolean | no | Whether this revises a previous thought |
| `revisesThought` | integer | no | Which thought is being reconsidered |
| `branchFromThought` | integer | no | Branching point thought number |
| `branchId` | string | no | Branch identifier |
| `needsMoreThoughts` | boolean | no | If more thoughts are needed |

A branch is tracked when a thought carries both `branchFromThought` and `branchId`. A revision is recorded with `isRevision: true` and `revisesThought` set to the number of the thought it rethinks; the original stays in the history.

Every accepted thought returns a JSON summary:

```json
{
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "branches": ["cheaper-route"],
  "thoughtHistoryLength": 4
}
```

- `thoughtNumber` / `totalThoughts` — where the chain stands. If `thoughtNumber` exceeds the estimated `totalThoughts`, the total is raised to `thoughtNumber`.
- `nextThoughtNeeded` — whether the chain continues. Sending `needsMoreThoughts: true` also reports this as `true`.
- `branches` — the id of every branch created so far, in creation order.
- `thoughtHistoryLength` — how many thoughts the server has recorded, including this one.

Missing or mistyped fields are refused with an error result (`isError`) naming the offending field; nothing is recorded for a rejected call.

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # tsx --test test/*.test.ts
npm run dev     # run the CLI from source
```

## License

MIT — see [LICENSE](LICENSE).
