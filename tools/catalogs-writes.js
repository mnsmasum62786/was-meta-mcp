/**
 * Catalog — batch uploads, product sets, feeds.
 */

import { fbGet, fbPost, fbDelete } from '../graph-client.js';

export const catalogWriteTools = [
  {
    name: 'meta_catalog_batch_upload_products',
    description: 'Batch create/update/delete up to 5000 products in one call. Pass an array of operations. Each operation has method (CREATE | UPDATE | DELETE) and data (product fields). Returns batch handle for status checking.',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string' },
        requests: {
          type: 'array',
          minItems: 1,
          maxItems: 5000,
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
              retailer_id: { type: 'string' },
              data: { type: 'object', description: 'For CREATE/UPDATE: product fields (name, price, currency, availability, condition, image_url, url, brand, etc.). For DELETE: only retailer_id matters.' },
            },
            required: ['method', 'retailer_id'],
          },
        },
        allow_upsert: { type: 'boolean', default: true, description: 'If true, UPDATE missing items become creates.' },
      },
      required: ['catalogId', 'requests'],
    },
    handler: async ({ catalogId, requests, allow_upsert = true }) => fbPost(`/${catalogId}/items_batch`, {
      requests: JSON.stringify(requests),
      allow_upsert,
    }),
  },
  {
    name: 'meta_catalog_get_batch_status',
    description: 'Check status of a batch upload. handle comes from meta_catalog_batch_upload_products response.',
    inputSchema: { type: 'object', properties: { catalogId: { type: 'string' }, handle: { type: 'string' } }, required: ['catalogId', 'handle'] },
    handler: async ({ catalogId, handle }) => fbGet(`/${catalogId}/check_batch_request_status`, { handle }),
  },
  {
    name: 'meta_catalog_list_product_sets',
    description: 'List product sets in a catalog (used for Dynamic Ads — segments products by criteria).',
    inputSchema: { type: 'object', properties: { catalogId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['catalogId'] },
    handler: async ({ catalogId, limit = 50 }) => fbGet(`/${catalogId}/product_sets`, {
      fields: 'id,name,filter,product_count,auto_creation_url',
      limit,
    }),
  },
  {
    name: 'meta_catalog_create_product_set',
    description: 'Create a product set (a filtered slice of a catalog). filter is a JSON spec — e.g. { "brand": { "i_contains": "Nike" } } or { "availability": { "eq": "in stock" } }.',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string' },
        name: { type: 'string' },
        filter: { type: 'object', description: 'Filter spec' },
      },
      required: ['catalogId', 'name', 'filter'],
    },
    handler: async ({ catalogId, name, filter }) => fbPost(`/${catalogId}/product_sets`, {
      name,
      filter: JSON.stringify(filter),
    }),
  },
  {
    name: 'meta_catalog_update_product_set',
    description: 'Rename or change filter on a product set.',
    inputSchema: {
      type: 'object',
      properties: {
        productSetId: { type: 'string' },
        name: { type: 'string' },
        filter: { type: 'object' },
      },
      required: ['productSetId'],
    },
    handler: async ({ productSetId, name, filter }) => {
      const params = {};
      if (name) params.name = name;
      if (filter) params.filter = JSON.stringify(filter);
      return fbPost(`/${productSetId}`, params);
    },
  },
  {
    name: 'meta_catalog_delete_product_set',
    description: 'Delete a product set by ID.',
    inputSchema: { type: 'object', properties: { productSetId: { type: 'string' } }, required: ['productSetId'] },
    handler: async ({ productSetId }) => fbDelete(`/${productSetId}`),
  },
  {
    name: 'meta_catalog_list_feeds',
    description: 'List product feeds (scheduled imports) configured on a catalog.',
    inputSchema: { type: 'object', properties: { catalogId: { type: 'string' } }, required: ['catalogId'] },
    handler: async ({ catalogId }) => fbGet(`/${catalogId}/product_feeds`, {
      fields: 'id,name,file_name,schedule,latest_upload,quoted_fields_mode,encoding,country,currency',
    }),
  },
  {
    name: 'meta_catalog_create_feed',
    description: 'Create a scheduled product feed that imports from a URL on a schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string', description: 'Public URL of the feed file (CSV, TSV, XML)' },
        scheduleHour: { type: 'integer', minimum: 0, maximum: 23, description: 'Hour of day to import (0-23)' },
        scheduleInterval: { type: 'string', enum: ['HOURLY', 'DAILY', 'WEEKLY'], default: 'DAILY' },
        country: { type: 'string', description: 'ISO 2-letter' },
        currency: { type: 'string' },
      },
      required: ['catalogId', 'name', 'url'],
    },
    handler: async ({ catalogId, name, url, scheduleHour, scheduleInterval, country, currency }) => {
      const params = {
        name,
        schedule: JSON.stringify({
          url,
          hour: scheduleHour ?? 0,
          interval: scheduleInterval || 'DAILY',
        }),
      };
      if (country) params.country = country;
      if (currency) params.currency = currency;
      return fbPost(`/${catalogId}/product_feeds`, params);
    },
  },
];
