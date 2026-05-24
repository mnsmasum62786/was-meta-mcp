/**
 * Meta Pixel admin — create / update pixels, manage Custom Conversions, EMQ.
 *
 * All operations require ads_management + business_management permissions
 * (both already granted in the standard token).
 */

import { fbGet, fbPost, fbDelete, adAcct } from '../graph-client.js';

export const pixelAdminTools = [
  {
    name: 'meta_pixel_create_pixel',
    description: 'Create a new Meta Pixel in an ad account. Pixel name is required. Returns the new pixel ID. Note: ad accounts have a limit of pixels — Meta typically allows up to 100 pixels per ad account, but only 1 owned pixel for most accounts.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string', description: 'Pixel name (shown in Events Manager)' },
      },
      required: ['adAccountId', 'name'],
    },
    handler: async ({ adAccountId, name }) => fbPost(`/${adAcct(adAccountId)}/adspixels`, { name }),
  },
  {
    name: 'meta_pixel_update_pixel',
    description: 'Rename a pixel.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['pixelId', 'name'],
    },
    handler: async ({ pixelId, name }) => fbPost(`/${pixelId}`, { name }),
  },
  {
    name: 'meta_pixel_assign_to_ad_account',
    description: 'Share a pixel with another ad account (give them access to use it for tracking + ads). Owner business must control the pixel.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        adAccountId: { type: 'string', description: 'Target ad account to share the pixel with' },
        businessId: { type: 'string', description: 'Business ID that owns the target ad account' },
      },
      required: ['pixelId', 'adAccountId', 'businessId'],
    },
    handler: async ({ pixelId, adAccountId, businessId }) => fbPost(`/${pixelId}/shared_accounts`, {
      account_id: String(adAccountId).replace(/^act_/, ''),
      business: businessId,
    }),
  },
  {
    name: 'meta_pixel_list_shared_accounts',
    description: 'List ad accounts that currently have access to a pixel.',
    inputSchema: { type: 'object', properties: { pixelId: { type: 'string' } }, required: ['pixelId'] },
    handler: async ({ pixelId }) => fbGet(`/${pixelId}/shared_accounts`, {
      fields: 'id,name,account_id,account_status,business',
    }),
  },
  {
    name: 'meta_pixel_unshare_from_ad_account',
    description: 'Revoke a pixel from an ad account.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        adAccountId: { type: 'string' },
        businessId: { type: 'string' },
      },
      required: ['pixelId', 'adAccountId', 'businessId'],
    },
    handler: async ({ pixelId, adAccountId, businessId }) => fbDelete(`/${pixelId}/shared_accounts`, {
      account_id: String(adAccountId).replace(/^act_/, ''),
      business: businessId,
    }),
  },
  {
    name: 'meta_pixel_list_custom_conversions',
    description: 'List Custom Conversions defined on pixels owned by a Business Manager. Custom Conversions are rule-based events derived from base pixel events (e.g. "Purchase where URL contains /premium" → Custom Conversion "Premium Purchase").',
    inputSchema: {
      type: 'object',
      properties: {
        businessId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
      },
      required: ['businessId'],
    },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/custom_conversions`, {
      fields: 'id,name,description,pixel,custom_event_type,event_source_type,rule,default_conversion_value,offline_conversion_data_set,creation_time,first_fired_time,last_fired_time,is_archived',
      limit,
    }),
  },
  {
    name: 'meta_pixel_create_custom_conversion',
    description: 'Create a Custom Conversion. customEventType: PURCHASE | LEAD | COMPLETE_REGISTRATION | ADD_TO_CART | ADD_PAYMENT_INFO | INITIATE_CHECKOUT | VIEW_CONTENT | SEARCH | ADD_TO_WISHLIST | CONTACT | CUSTOMIZE_PRODUCT | DONATE | FIND_LOCATION | SCHEDULE | START_TRIAL | SUBMIT_APPLICATION | SUBSCRIBE | OTHER. rule is a JSON object describing the trigger condition.',
    inputSchema: {
      type: 'object',
      properties: {
        businessId: { type: 'string', description: 'Business that owns the pixel' },
        name: { type: 'string' },
        description: { type: 'string' },
        pixelId: { type: 'string', description: 'The pixel whose events this CC derives from' },
        customEventType: { type: 'string', description: 'Standard event type to categorize this CC' },
        rule: {
          type: 'object',
          description: 'Rule spec — e.g. { "and":[{ "url":{ "i_contains":"/thank-you" } }] } OR { "event":{ "eq":"Purchase" } }',
        },
        defaultConversionValue: { type: 'number' },
        defaultConversionCurrency: { type: 'string', description: 'ISO 4217 (e.g. USD)' },
      },
      required: ['businessId', 'name', 'pixelId', 'customEventType', 'rule'],
    },
    handler: async ({ businessId, name, description, pixelId, customEventType, rule, defaultConversionValue, defaultConversionCurrency }) => {
      const params = {
        name,
        pixel_id: pixelId,
        custom_event_type: customEventType,
        rule: JSON.stringify(rule),
      };
      if (description) params.description = description;
      if (defaultConversionValue !== undefined) params.default_conversion_value = defaultConversionValue;
      if (defaultConversionCurrency) params.default_conversion_currency = defaultConversionCurrency;
      return fbPost(`/${businessId}/custom_conversions`, params);
    },
  },
  {
    name: 'meta_pixel_update_custom_conversion',
    description: 'Update an existing Custom Conversion — change name, rule, value, or archive it.',
    inputSchema: {
      type: 'object',
      properties: {
        customConversionId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        rule: { type: 'object' },
        defaultConversionValue: { type: 'number' },
        defaultConversionCurrency: { type: 'string' },
        isArchived: { type: 'boolean' },
      },
      required: ['customConversionId'],
    },
    handler: async (args) => {
      const params = {};
      if (args.name) params.name = args.name;
      if (args.description) params.description = args.description;
      if (args.rule) params.rule = JSON.stringify(args.rule);
      if (args.defaultConversionValue !== undefined) params.default_conversion_value = args.defaultConversionValue;
      if (args.defaultConversionCurrency) params.default_conversion_currency = args.defaultConversionCurrency;
      if (args.isArchived !== undefined) params.is_archived = args.isArchived;
      return fbPost(`/${args.customConversionId}`, params);
    },
  },
  {
    name: 'meta_pixel_delete_custom_conversion',
    description: 'Permanently delete a Custom Conversion. (You can also archive instead via update.)',
    inputSchema: { type: 'object', properties: { customConversionId: { type: 'string' } }, required: ['customConversionId'] },
    handler: async ({ customConversionId }) => fbDelete(`/${customConversionId}`),
  },
  {
    name: 'meta_pixel_get_event_match_quality',
    description: 'Get Event Match Quality (EMQ) summary for a pixel — measures how well your events identify users for matching (higher = better attribution). EMQ scores: GREAT (8-10), GOOD (6-7.99), OK (4-5.99), POOR (0-3.99). Returns last-7-day rolling scores per event name.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        startTime: { type: 'integer', description: 'Unix timestamp — default: 7 days ago' },
        endTime: { type: 'integer', description: 'Unix timestamp — default: now' },
      },
      required: ['pixelId'],
    },
    handler: async ({ pixelId, startTime, endTime }) => {
      const params = { aggregation: 'event_match_quality' };
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;
      return fbGet(`/${pixelId}/stats`, params);
    },
  },
];
