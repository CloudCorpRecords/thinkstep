#!/usr/bin/env node
/**
 * thinkstep CLI.
 *
 *   thinkstep mcp          start the stdio MCP server
 *   thinkstep --version    print the version
 *
 * The thought chain itself lives behind the MCP server: there is no
 * local file or state to inspect from the CLI, so the bin's job is to
 * serve the protocol (and answer --version). Exit code 2 is a usage
 * error.
 */
import { VERSION } from "./think.js";

function usage(): never {
  console.error(`Usage:
  thinkstep mcp
  thinkstep --version`);
  process.exit(2);
}

async function main(): Promise<void> {
  const [cmd] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    await import("./mcp.js");
    return;
  }
  usage();
}

void main();
