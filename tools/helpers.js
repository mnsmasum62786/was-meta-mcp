/**
 * Universal escape hatches + token introspection + cross-surface helpers.
 */

import { fbGet, fbPost, fbDelete, ACCESS_TOKEN, APP_ID, APP_SECRET, API_VERSION } from '../graph-client.js';

export const helperTools = [
  {
    name: 'meta_graph_get',
    description: 'UNIVERSAL READ — call any Graph API GET endpoint. Use this when no specialized tool exists for what you need. Example path: /me/businesses, /act_123/campaigns, /1234567890/feed. The access_token is added automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Graph API path, e.g. "/me/businesses" or "/12345/feed"' },
        params: { type: 'object', description: 'Query parameters (fields, limit, filter, etc.)' },
      },
      required: ['path'],
    },
    handler: async ({ path, params }) => fbGet(path, params || {}),
  },
  {
    name: 'meta_graph_post',
    description: 'UNIVERSAL WRITE — call any Graph API POST endpoint. Use for create/update operations not covered by specialized tools.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        params: { type: 'object', description: 'Body parameters' },
        jsonBody: { description: 'Optional explicit JSON body (alternative to params)' },
      },
      required: ['path'],
    },
    handler: async ({ path, params, jsonBody }) => fbPost(path, params || {}, jsonBody),
  },
  {
    name: 'meta_graph_delete',
    description: 'UNIVERSAL DELETE — call any Graph API DELETE endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        params: { type: 'object' },
      },
      required: ['path'],
    },
    handler: async ({ path, params }) => fbDelete(path, params || {}),
  },
  {
    name: 'meta_whoami',
    description: 'Identify the authenticated user. Returns id, name, and granted permissions on the current token.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const [me, perms] = await Promise.all([
        fbGet('/me', { fields: 'id,name' }),
        fbGet('/me/permissions'),
      ]);
      const granted = (perms.data || []).filter(p => p.status === 'granted').map(p => p.permission);
      const declined = (perms.data || []).filter(p => p.status === 'declined').map(p => p.permission);
      return { user: me, granted_permissions: granted, declined_permissions: declined };
    },
  },
  {
    name: 'meta_token_info',
    description: 'Show metadata about the current access token: app, type, scopes, expiry, granular scopes. Useful to verify which permissions are active.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const url = `/debug_token`;
      const data = await fbGet(url, { input_token: ACCESS_TOKEN, access_token: `${APP_ID}|${APP_SECRET}` });
      const d = data.data || data;
      return {
        app_id: d.app_id,
        application: d.application,
        type: d.type,
        is_valid: d.is_valid,
        expires_at: d.expires_at === 0 ? 'never' : new Date(d.expires_at * 1000).toISOString(),
        data_access_expires_at: d.data_access_expires_at === 0 ? 'never' : new Date(d.data_access_expires_at * 1000).toISOString(),
        issued_at: d.issued_at ? new Date(d.issued_at * 1000).toISOString() : null,
        scopes: d.scopes,
        granular_scopes: d.granular_scopes,
        user_id: d.user_id,
      };
    },
  },
  {
    name: 'meta_search',
    description: 'Search across Meta entities: pages, places, ad_interest, ad_geolocation. Useful for finding entities by name or for targeting research.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        type: { type: 'string', enum: ['page', 'place', 'adinterest', 'adgeolocation', 'adlocale'], default: 'adinterest' },
        limit: { type: 'integer', default: 25 },
      },
      required: ['q'],
    },
    handler: async ({ q, type = 'adinterest', limit = 25 }) => fbGet('/search', { q, type, limit }),
  },
  {
    name: 'meta_quick_stats',
    description: 'Cross-surface morning brief: count of businesses, pages, ad accounts, IG accounts the token has access to. Great as a daily health check.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const [businesses, pages, adAccounts] = await Promise.all([
        fbGet('/me/businesses', { fields: 'id,name', limit: 100 }).catch(() => ({ data: [] })),
        fbGet('/me/accounts', { fields: 'id,name,instagram_business_account', limit: 100 }).catch(() => ({ data: [] })),
        fbGet('/me/adaccounts', { fields: 'id,name,account_status', limit: 100 }).catch(() => ({ data: [] })),
      ]);
      const igCount = (pages.data || []).filter(p => p.instagram_business_account).length;
      const activeAdAccounts = (adAccounts.data || []).filter(a => a.account_status === 1).length;
      return {
        businesses: { count: businesses.data?.length || 0, sample: (businesses.data || []).slice(0, 5).map(b => ({ id: b.id, name: b.name })) },
        pages: { count: pages.data?.length || 0, sample: (pages.data || []).slice(0, 5).map(p => ({ id: p.id, name: p.name })) },
        instagram_accounts: { count: igCount },
        ad_accounts: { count: adAccounts.data?.length || 0, active: activeAdAccounts, sample: (adAccounts.data || []).slice(0, 5).map(a => ({ id: a.id, name: a.name, status: a.account_status })) },
        api_version: API_VERSION,
      };
    },
  },
];
