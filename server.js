#!/usr/bin/env node
/**
 * WAS Meta MCP — stdio server (shareable).
 *
 * 58 tools covering the full Meta API surface:
 *   Ads (13), Conversions API (5), Pages (9), Business Manager (8),
 *   Catalogs (8), Instagram (8), Universal helpers (7).
 *
 * Auth: your Meta App + long-lived user access token.
 *   Loaded from env vars (advanced) or ~/.was-meta-mcp/config.json (default).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolByName } from './tools/registry.js';

function ok(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return { content: [{ type: 'text', text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars]` }] };
  }
  return { content: [{ type: 'text', text }] };
}

function bad(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Meta MCP error:\n' + JSON.stringify({
        message: err?.message || String(err),
        status: err?.status,
        code: err?.code,
        type: err?.type,
        error_subcode: err?.error_subcode,
        fbtrace_id: err?.fbtrace_id,
        body: err?.body,
      }, null, 2),
    }],
  };
}

const server = new Server(
  { name: 'was-meta-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = toolByName(req.params.name);
  if (!tool) return bad({ message: `Unknown tool: ${req.params.name}` });
  try {
    const result = await tool.handler(req.params.arguments || {});
    return ok(result);
  } catch (err) {
    return bad(err);
  }
});

await server.connect(new StdioServerTransport());
console.error(`was-meta-mcp v1.0.0 ready — ${allTools.length} tools loaded`);
