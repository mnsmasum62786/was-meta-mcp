#!/usr/bin/env node
/**
 * WAS Meta MCP — CLI router
 *
 *   was-meta-mcp           Start the MCP server (used by Claude Desktop via stdio).
 *   was-meta-mcp auth      Connect with your Meta App + user token.
 *   was-meta-mcp logout    Delete the saved credentials.
 *   was-meta-mcp status    Show whether credentials are saved.
 *   was-meta-mcp help      Show usage.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './config-paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

if (cmd === 'auth') {
  const { runAuthFlow } = await import(join(__dirname, 'auth.js'));
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(join(__dirname, 'auth.js'));
  const deleted = await deleteConfigFile();
  console.log(deleted ? `Removed ${CONFIG_FILE}` : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(join(__dirname, 'auth.js'));
  const cfg = await readConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y github:mnsmasum62786/was-meta-mcp auth` to connect.');
  } else {
    console.log(`Config:        ${CONFIG_FILE}`);
    console.log(`Saved:         ${cfg.saved_at || '(unknown)'}`);
    console.log(`User:          ${cfg.user_name || '(unknown)'} (${cfg.user_id || ''})`);
    console.log(`App ID:        ${cfg.app_id || '(unknown)'}`);
    console.log(`Token:         ${cfg.access_token ? cfg.access_token.slice(0, 12) + '...' : '(missing)'}`);
    console.log(`Permissions:   ${(cfg.permissions || []).length} granted`);
    if (cfg.permissions?.length) {
      console.log(`               ${cfg.permissions.join(', ')}`);
    }
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`
was-meta-mcp — Facebook/Instagram/Business Manager MCP server

Usage:
  was-meta-mcp           Start the MCP server (used by Claude Desktop via stdio)
  was-meta-mcp auth      Connect with your Meta App + user token
  was-meta-mcp logout    Delete the saved credentials
  was-meta-mcp status    Show config status
  was-meta-mcp help      This message

Quick start:
  1. Create a Meta app at https://developers.facebook.com/apps
  2. Get App ID + Secret from App Settings -> Basic
  3. Get a long-lived user token via Graph API Explorer (npx auth walks you through)
  4. Run:   npx -y github:mnsmasum62786/was-meta-mcp auth
  5. Add this to your Claude Desktop config and restart Claude:
       {
         "mcpServers": {
           "WAS Meta MCP": { "command": "npx", "args": ["-y", "github:mnsmasum62786/was-meta-mcp"] }
         }
       }

Docs:  https://github.com/mnsmasum62786/was-meta-mcp
`);
  process.exit(0);
} else if (!cmd) {
  await import(join(__dirname, 'server.js'));
} else {
  console.error(`Unknown command: "${cmd}"\nRun "was-meta-mcp help" for usage.`);
  process.exit(1);
}
