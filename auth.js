/**
 * Meta auth flow — interactive prompts for App ID, App Secret, User Token.
 * Validates the token against Graph API before saving.
 *
 * Run from terminal: `npx -y github:mnsmasum62786/was-meta-mcp auth`
 */

import { mkdir, writeFile, chmod, readFile, unlink } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { CONFIG_DIR, CONFIG_FILE } from './config-paths.js';

const API_VERSION = 'v22.0';

async function probeToken(token) {
  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/me?fields=id,name&access_token=${token}`);
    const data = await res.json();
    if (data.error) return { ok: false, error: data.error.message };
    return { ok: true, user: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function probePermissions(token) {
  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/me/permissions?access_token=${token}`);
    const data = await res.json();
    return (data.data || []).filter(p => p.status === 'granted').map(p => p.permission);
  } catch {
    return [];
  }
}

export async function runAuthFlow() {
  console.log('\n=== WAS Meta MCP — Connect ===\n');

  let appId = process.env.META_APP_ID;
  let appSecret = process.env.META_APP_SECRET;
  let token = process.env.META_ACCESS_TOKEN;

  const rl = readline.createInterface({ input, output });

  if (!appId || !appSecret || !token) {
    console.log('You need three things from Meta Developer Portal. Quick setup (5-10 min, one-time):');
    console.log('');
    console.log('  1. Create a Meta app: https://developers.facebook.com/apps');
    console.log('     -> Create App -> Business type -> name it -> Create');
    console.log('');
    console.log('  2. Get your App ID + App Secret:');
    console.log('     App Dashboard -> App settings -> Basic');
    console.log('');
    console.log('  3. Get a long-lived user access token:');
    console.log('     a. Open https://developers.facebook.com/tools/explorer/');
    console.log('     b. Select your app from the Meta App dropdown');
    console.log('     c. Click Get User Access Token -> check the permissions you need:');
    console.log('        ads_management, ads_read, business_management,');
    console.log('        pages_show_list, pages_read_engagement, pages_manage_metadata,');
    console.log('        pages_manage_posts, pages_read_user_content, pages_messaging,');
    console.log('        pages_manage_engagement, catalog_management,');
    console.log('        instagram_basic, instagram_content_publish,');
    console.log('        instagram_manage_comments, instagram_manage_insights,');
    console.log('        read_insights');
    console.log('     d. Click Generate Access Token -> approve in popup');
    console.log('     e. Open https://developers.facebook.com/tools/debug/accesstoken/');
    console.log('     f. Paste the token -> Debug -> Extend Access Token');
    console.log('     g. Copy the long-lived token. If you are an admin of the app,');
    console.log('        this token never expires.\n');
  }

  if (!appId) appId = (await rl.question('Paste your META_APP_ID: ')).trim();
  if (!appSecret) appSecret = (await rl.question('Paste your META_APP_SECRET: ')).trim();
  if (!token) token = (await rl.question('Paste your long-lived META_ACCESS_TOKEN: ')).trim();
  rl.close();

  if (!appId || !appSecret || !token) {
    throw new Error('All three values are required.');
  }

  console.log('\nValidating token against Graph API...');
  const probe = await probeToken(token);
  if (!probe.ok) {
    throw new Error(`Token validation failed: ${probe.error}`);
  }
  console.log(`Connected as: ${probe.user.name} (id: ${probe.user.id})`);

  const perms = await probePermissions(token);
  console.log(`Granted permissions (${perms.length}): ${perms.join(', ')}`);

  // Persist to ~/.was-meta-mcp/config.json (0600).
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = {
    app_id: appId,
    app_secret: appSecret,
    access_token: token,
    user_id: probe.user.id,
    user_name: probe.user.name,
    permissions: perms,
    saved_at: new Date().toISOString(),
  };
  await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  try { await chmod(CONFIG_FILE, 0o600); } catch {}

  console.log(`\nSaved credentials to ${CONFIG_FILE}`);
  console.log('\nLast step — add this to your Claude Desktop config and restart Claude:\n');
  console.log(JSON.stringify({
    mcpServers: {
      'WAS Meta MCP': {
        command: 'npx',
        args: ['-y', 'github:mnsmasum62786/was-meta-mcp'],
      },
    },
  }, null, 2));
  console.log('\nClaude Desktop config location:');
  console.log('  Mac:     ~/Library/Application Support/Claude/claude_desktop_config.json');
  console.log('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
  console.log('\nAfter restarting Claude, ask: "Run meta_quick_stats" or "List my Facebook businesses".\n');
}

export async function readConfigFile() {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await unlink(CONFIG_FILE);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
