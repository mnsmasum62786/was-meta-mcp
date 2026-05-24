import { adsTools } from './ads.js';
import { adsWriteTools } from './ads-writes.js';
import { capiTools } from './capi.js';
import { pixelAdminTools } from './pixel-admin.js';
import { pagesTools } from './pages.js';
import { pagesWriteTools } from './pages-writes.js';
import { businessTools } from './business.js';
import { catalogTools } from './catalogs.js';
import { catalogWriteTools } from './catalogs-writes.js';
import { instagramTools } from './instagram.js';
import { instagramWriteTools } from './instagram-writes.js';
import { helperTools } from './helpers.js';

export const allTools = [
  ...adsTools,
  ...adsWriteTools,
  ...capiTools,
  ...pixelAdminTools,
  ...pagesTools,
  ...pagesWriteTools,
  ...businessTools,
  ...catalogTools,
  ...catalogWriteTools,
  ...instagramTools,
  ...instagramWriteTools,
  ...helperTools,
];

export function toolByName(name) {
  return allTools.find(t => t.name === name);
}
