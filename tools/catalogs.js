/**
 * Meta Commerce / Catalog API — product catalogs, products, feeds, diagnostics.
 */

import { fbGet, fbPost, fbDelete } from '../graph-client.js';

export const catalogTools = [
  {
    name: 'meta_catalog_list_catalogs',
    description: 'List product catalogs owned by a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/owned_product_catalogs`, {
      fields: 'id,name,vertical,product_count,feed_count,da_display_settings,fallback_image_url',
      limit,
    }),
  },
  {
    name: 'meta_catalog_get_info',
    description: 'Get details about a specific product catalog.',
    inputSchema: { type: 'object', properties: { catalogId: { type: 'string' } }, required: ['catalogId'] },
    handler: async ({ catalogId }) => fbGet(`/${catalogId}`, {
      fields: 'id,name,vertical,product_count,feed_count,da_display_settings,default_image_url,fallback_image_url,is_catalog_segment',
    }),
  },
  {
    name: 'meta_catalog_list_products',
    description: 'List products in a catalog with key fields (id, name, price, availability, image_url).',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
        filter: { type: 'object', description: 'Filter object e.g. { "availability": { "eq": "in stock" } }' },
      },
      required: ['catalogId'],
    },
    handler: async ({ catalogId, limit = 50, filter }) => {
      const params = {
        fields: 'id,retailer_id,name,description,availability,condition,price,sale_price,currency,image_url,additional_image_urls,url,brand,category,gtin,visibility,review_status',
        limit,
      };
      if (filter) params.filter = JSON.stringify(filter);
      return fbGet(`/${catalogId}/products`, params);
    },
  },
  {
    name: 'meta_catalog_get_product',
    description: 'Get full details of a single product by ID.',
    inputSchema: { type: 'object', properties: { productId: { type: 'string' } }, required: ['productId'] },
    handler: async ({ productId }) => fbGet(`/${productId}`, {
      fields: 'id,retailer_id,name,description,availability,condition,price,sale_price,currency,image_url,additional_image_urls,url,brand,category,gtin,visibility,review_status,errors,inventory,sale_price_start_date,sale_price_end_date',
    }),
  },
  {
    name: 'meta_catalog_create_product',
    description: 'Add a product to a catalog. Price is in account currency cents (e.g. 1999 for $19.99 USD). Required: retailer_id (your SKU), name, image_url, url, price, currency, availability, condition, brand.',
    inputSchema: {
      type: 'object',
      properties: {
        catalogId: { type: 'string' },
        retailerId: { type: 'string', description: 'Your internal SKU/ID' },
        name: { type: 'string' },
        description: { type: 'string' },
        priceCents: { type: 'integer' },
        currency: { type: 'string' },
        salePriceCents: { type: 'integer' },
        availability: { type: 'string', enum: ['in stock', 'out of stock', 'preorder', 'available for order', 'discontinued'], default: 'in stock' },
        condition: { type: 'string', enum: ['new', 'refurbished', 'used'], default: 'new' },
        imageUrl: { type: 'string' },
        url: { type: 'string', description: 'Product landing page URL' },
        brand: { type: 'string' },
        category: { type: 'string' },
        gtin: { type: 'string' },
      },
      required: ['catalogId', 'retailerId', 'name', 'priceCents', 'currency', 'imageUrl', 'url', 'brand'],
    },
    handler: async (args) => {
      const params = {
        retailer_id: args.retailerId,
        name: args.name,
        price: args.priceCents,
        currency: args.currency,
        image_url: args.imageUrl,
        url: args.url,
        brand: args.brand,
        availability: args.availability || 'in stock',
        condition: args.condition || 'new',
      };
      if (args.description) params.description = args.description;
      if (args.salePriceCents) params.sale_price = args.salePriceCents;
      if (args.category) params.category = args.category;
      if (args.gtin) params.gtin = args.gtin;
      return fbPost(`/${args.catalogId}/products`, params);
    },
  },
  {
    name: 'meta_catalog_update_product',
    description: 'Update fields on an existing product. Pass productId + any fields to change.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        priceCents: { type: 'integer' },
        salePriceCents: { type: 'integer' },
        availability: { type: 'string' },
        condition: { type: 'string' },
        imageUrl: { type: 'string' },
        url: { type: 'string' },
        brand: { type: 'string' },
        category: { type: 'string' },
        gtin: { type: 'string' },
      },
      required: ['productId'],
    },
    handler: async (args) => {
      const params = {};
      if (args.name) params.name = args.name;
      if (args.description) params.description = args.description;
      if (args.priceCents !== undefined) params.price = args.priceCents;
      if (args.salePriceCents !== undefined) params.sale_price = args.salePriceCents;
      if (args.availability) params.availability = args.availability;
      if (args.condition) params.condition = args.condition;
      if (args.imageUrl) params.image_url = args.imageUrl;
      if (args.url) params.url = args.url;
      if (args.brand) params.brand = args.brand;
      if (args.category) params.category = args.category;
      if (args.gtin) params.gtin = args.gtin;
      return fbPost(`/${args.productId}`, params);
    },
  },
  {
    name: 'meta_catalog_delete_product',
    description: 'Delete a product by ID.',
    inputSchema: { type: 'object', properties: { productId: { type: 'string' } }, required: ['productId'] },
    handler: async ({ productId }) => fbDelete(`/${productId}`),
  },
  {
    name: 'meta_catalog_get_diagnostics',
    description: 'Catalog health: issues with products (missing fields, disapprovals, etc).',
    inputSchema: { type: 'object', properties: { catalogId: { type: 'string' } }, required: ['catalogId'] },
    handler: async ({ catalogId }) => fbGet(`/${catalogId}/diagnostics`, {
      fields: 'diagnostic_group,severity,type,description,affected_channels,affected_features,number_of_affected_entities,error_subcode',
    }),
  },
];
