/**
 * Meta Business Manager — businesses, users, asset inventory.
 */

import { fbGet } from '../graph-client.js';

export const businessTools = [
  {
    name: 'meta_business_list_businesses',
    description: 'List all Business Managers the authenticated user has access to.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', default: 50 } } },
    handler: async ({ limit = 50 }) => fbGet('/me/businesses', {
      fields: 'id,name,primary_page,created_time,verification_status,timezone_id,vertical,profile_picture_uri',
      limit,
    }),
  },
  {
    name: 'meta_business_get_info',
    description: 'Get details about a specific Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' } }, required: ['businessId'] },
    handler: async ({ businessId }) => fbGet(`/${businessId}`, {
      fields: 'id,name,primary_page,created_time,updated_time,verification_status,timezone_id,vertical,collaborative_ads_managed_partner_business_info,profile_picture_uri,two_factor_type',
    }),
  },
  {
    name: 'meta_business_list_owned_pages',
    description: 'List Pages owned by a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/owned_pages`, {
      fields: 'id,name,category,fan_count,verification_status,access_status',
      limit,
    }),
  },
  {
    name: 'meta_business_list_owned_ad_accounts',
    description: 'List ad accounts owned by a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/owned_ad_accounts`, {
      fields: 'id,name,account_id,account_status,currency,timezone_name,balance,amount_spent,disable_reason',
      limit,
    }),
  },
  {
    name: 'meta_business_list_client_pages',
    description: 'List client (partner-shared) Pages of a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/client_pages`, {
      fields: 'id,name,category,fan_count,access_status',
      limit,
    }),
  },
  {
    name: 'meta_business_list_client_ad_accounts',
    description: 'List client (partner-shared) ad accounts of a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/client_ad_accounts`, {
      fields: 'id,name,account_id,account_status,currency,balance,amount_spent',
      limit,
    }),
  },
  {
    name: 'meta_business_list_users',
    description: 'List business users (admins, employees) in a Business Manager.',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' }, limit: { type: 'integer', default: 50 } }, required: ['businessId'] },
    handler: async ({ businessId, limit = 50 }) => fbGet(`/${businessId}/business_users`, {
      fields: 'id,name,email,role,title,status,pending_email,created_time',
      limit,
    }),
  },
  {
    name: 'meta_business_list_system_users',
    description: 'List system users in a Business Manager (for service-to-service auth).',
    inputSchema: { type: 'object', properties: { businessId: { type: 'string' } }, required: ['businessId'] },
    handler: async ({ businessId }) => fbGet(`/${businessId}/system_users`, {
      fields: 'id,name,role,created_by',
    }),
  },
];
