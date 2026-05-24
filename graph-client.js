/**
 * Meta Graph API client.
 *
 * Reads creds from env vars first, falls back to ~/.was-meta-mcp/config.json (for stdio mode).
 * Handles retry with exponential backoff on 4xx/5xx rate limits.
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_FILE = join(homedir(), '.was-meta-mcp', 'config.json');

let saved = {};
try { saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch {}

export const APP_ID = process.env.META_APP_ID || saved.app_id;
export const APP_SECRET = process.env.META_APP_SECRET || saved.app_secret;
export const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || saved.access_token;
export const API_VERSION = process.env.META_API_VERSION || 'v22.0';

if (!ACCESS_TOKEN) {
  console.error(
    'WAS Meta MCP — not configured yet.\n\n' +
    'For local install (stdio): npx -y github:mnsmasum62786/was-meta-mcp auth\n' +
    'For server install (HTTP): set META_APP_ID + META_APP_SECRET + META_ACCESS_TOKEN env vars\n\n' +
    'Token storage: ' + CONFIG_FILE
  );
  process.exit(1);
}

const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function buildUrl(path, params) {
  let url = BASE_URL + (path.startsWith('/') ? path : '/' + path);
  const all = { ...(params || {}), access_token: ACCESS_TOKEN };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(all)) {
    if (v === undefined || v === null) continue;
    qs.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  return url + '?' + qs.toString();
}

async function doFetch(method, url, body) {
  const init = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { ok: res.ok, status: res.status, body: parsed };
}

async function withRetry(method, url, body, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    const r = await doFetch(method, url, body);
    if (r.ok) return r.body;
    // Meta error envelope: { error: { message, code, type, error_subcode } }
    const err = r.body?.error || r.body || { message: 'Unknown error', status: r.status };
    const isRateLimit = err.code === 4 || err.code === 17 || err.code === 32 || err.code === 613;
    const isServerErr = r.status >= 500;
    if ((isRateLimit || isServerErr) && i < attempts - 1) {
      const wait = Math.min(2000 * Math.pow(2, i), 10000);
      await new Promise(s => setTimeout(s, wait));
      lastErr = err;
      continue;
    }
    const e = new Error(`Meta Graph API error: ${err.message || JSON.stringify(err)}`);
    e.status = r.status;
    e.code = err.code;
    e.type = err.type;
    e.error_subcode = err.error_subcode;
    e.fbtrace_id = err.fbtrace_id;
    e.body = r.body;
    e.url = url.split('?')[0]; // strip query for log safety
    throw e;
  }
  throw new Error(`Retry exhausted: ${JSON.stringify(lastErr)}`);
}

// ─── public client API ────────────────────────────────────────────────────────

/** GET request to any Graph API path */
export async function fbGet(path, params) {
  const url = buildUrl(path, params);
  return await withRetry('GET', url);
}

/** POST request. Most Meta writes use POST. body is form-data style params merged with access_token. */
export async function fbPost(path, params, jsonBody) {
  // If jsonBody is provided, send as JSON. Else send everything as query params.
  if (jsonBody !== undefined) {
    const url = buildUrl(path, params);
    return await withRetry('POST', url, jsonBody);
  }
  // Meta accepts POST with params either as query string or as JSON body.
  // For write operations, query string is more compatible.
  const url = buildUrl(path, params);
  return await withRetry('POST', url);
}

/** DELETE request */
export async function fbDelete(path, params) {
  const url = buildUrl(path, params);
  return await withRetry('DELETE', url);
}

/** Strip the leading `act_` if present, or add it if missing */
export const adAcct = (id) => id.startsWith('act_') ? id : `act_${id}`;
export const stripAct = (id) => id.startsWith('act_') ? id.slice(4) : id;
