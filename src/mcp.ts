/**
 * thinkstep MCP server. Tools: sequentialthinking.
 *
 * The tool is registered with the SDK's low-level Server API so the
 * served inputSchema is exactly the published tool spec — property set,
 * types, required list, and per-property descriptions — with no
 * code-generation extras added on top. Argument validation is shared
 * with the core (src/think.ts): invalid input is answered with an
 * isError tool result carrying the validation message.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ThinkStep, VERSION } from "./think.js";

const SEQUENTIAL_THINKING_TOOL = {
  name: "sequentialthinking",
  description:
    "A tool for dynamic reflective problem-solving through thoughts. Record one thinking step at a time, revise earlier thoughts, and branch into alternative lines of reasoning; the server tracks the thought history and branches for the life of the session.",
  inputSchema: {
    type: "object" as const,
    properties: {
      thought: {
        type: "string" as const,
        description: "Your current thinking step",
      },
      nextThoughtNeeded: {
        type: "boolean" as const,
        description: "Whether another thought step is needed",
      },
      thoughtNumber: {
        type: "integer" as const,
        description: "Current thought number (numeric value, e.g., 1, 2, 3)",
      },
      totalThoughts: {
        type: "integer" as const,
        description: "Estimated total thoughts needed (numeric value, e.g., 5, 10)",
      },
      isRevision: {
        type: "boolean" as const,
        description: "Whether this revises a previous thought",
      },
      revisesThought: {
        type: "integer" as const,
        description: "Which thought is being reconsidered",
      },
      branchFromThought: {
        type: "integer" as const,
        description: "Branching point thought number",
      },
      branchId: {
        type: "string" as const,
        description: "Branch identifier",
      },
      needsMoreThoughts: {
        type: "boolean" as const,
        description: "If more thoughts are needed",
      },
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"],
  },
};

const thinker = new ThinkStep();

const server = new Server(
  { name: "thinkstep", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name !== SEQUENTIAL_THINKING_TOOL.name) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }
  try {
    const result = thinker.addThought(args ?? {});
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: err instanceof Error ? err.message : String(err),
        },
      ],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
