import { adsTools } from './ads.js';
import { adsWriteTools } from './ads-writes.js';
import { capiTools } from './capi.js';
import { pixelAdminTools } from './pixel-admin.js';
import { businessTools } from './business.js';
import { catalogTools } from './catalogs.js';
import { catalogWriteTools } from './catalogs-writes.js';
import { helperTools } from './helpers.js';

// NOTE: pages + instagram tools moved to was-meta-page-mcp as of v2.0.0 (2026-05-27).
// This MCP now focuses on Ads, Conversions API, Catalogues, Business Manager, Pixel admin.
// For Page + IG management, install: github:mnsmasum62786/was-meta-page-mcp

export const allTools = [
  ...adsTools,
  ...adsWriteTools,
  ...capiTools,
  ...pixelAdminTools,
  ...businessTools,
  ...catalogTools,
  ...catalogWriteTools,
  ...helperTools,
];

export function toolByName(name) {
  return allTools.find(t => t.name === name);
}
