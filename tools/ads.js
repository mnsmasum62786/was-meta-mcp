/**
 * Meta Marketing API (Ads) tools — campaigns, ad sets, ads, audiences, insights.
 */

import { fbGet, fbPost, fbDelete, adAcct, stripAct } from '../graph-client.js';

export const adsTools = [
  {
    name: 'meta_ads_list_ad_accounts',
    description: 'List Facebook ad accounts the authenticated user can access. Returns id, name, account_status, currency, timezone, business owner.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', default: 25 } } },
    handler: async ({ limit = 25 }) => fbGet('/me/adaccounts', {
      fields: 'id,name,account_id,account_status,currency,timezone_name,business,disable_reason,age',
      limit,
    }),
  },
  {
    name: 'meta_ads_get_account_summary',
    description: 'Get ad account info: name, currency, timezone, status, spend cap, balance, funding source. customerId can be the act_XXX or just the number.',
    inputSchema: { type: 'object', properties: { adAccountId: { type: 'string' } }, required: ['adAccountId'] },
    handler: async ({ adAccountId }) => fbGet(`/${adAcct(adAccountId)}`, {
      fields: 'id,name,account_id,account_status,currency,timezone_name,timezone_offset_hours_utc,business,balance,amount_spent,spend_cap,funding_source,age,disable_reason,owner',
    }),
  },
  {
    name: 'meta_ads_list_campaigns',
    description: 'List campaigns in an ad account with status, objective, daily/lifetime budgets, and 30-day basic insights.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        effectiveStatus: { type: 'array', items: { type: 'string' }, description: 'Filter by status: ACTIVE, PAUSED, ARCHIVED, etc.' },
        limit: { type: 'integer', default: 50 },
      },
      required: ['adAccountId'],
    },
    handler: async ({ adAccountId, effectiveStatus, limit = 50 }) => {
      const params = {
        fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,buying_type,bid_strategy,start_time,stop_time,created_time,updated_time,insights{impressions,clicks,spend,reach,frequency,ctr,cpc,actions,date_start,date_stop}',
        limit,
      };
      if (effectiveStatus) params.effective_status = JSON.stringify(effectiveStatus);
      return fbGet(`/${adAcct(adAccountId)}/campaigns`, params);
    },
  },
  {
    name: 'meta_ads_get_campaign',
    description: 'Get a single campaign by ID with all fields.',
    inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] },
    handler: async ({ campaignId }) => fbGet(`/${campaignId}`, {
      fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,buying_type,bid_strategy,start_time,stop_time,created_time,updated_time,special_ad_categories,promoted_object',
    }),
  },
  {
    name: 'meta_ads_create_campaign',
    description: 'Create a new campaign. objective examples: OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_AWARENESS, OUTCOME_APP_PROMOTION. status starts PAUSED for safety. dailyBudget is in account currency cents (e.g. 5000 = $50).',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string' },
        objective: { type: 'string', description: 'OUTCOME_LEADS | OUTCOME_SALES | OUTCOME_TRAFFIC | OUTCOME_ENGAGEMENT | OUTCOME_AWARENESS | OUTCOME_APP_PROMOTION' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], default: 'PAUSED' },
        dailyBudgetCents: { type: 'integer', description: 'Daily budget in account currency cents' },
        lifetimeBudgetCents: { type: 'integer' },
        specialAdCategories: { type: 'array', items: { type: 'string' }, description: '["NONE"] | ["HOUSING"] | ["EMPLOYMENT"] | ["CREDIT"] | ["ISSUES_ELECTIONS_POLITICS"]', default: ['NONE'] },
      },
      required: ['adAccountId', 'name', 'objective'],
    },
    handler: async ({ adAccountId, name, objective, status, dailyBudgetCents, lifetimeBudgetCents, specialAdCategories }) => {
      const params = {
        name, objective, status: status || 'PAUSED',
        special_ad_categories: JSON.stringify(specialAdCategories || ['NONE']),
      };
      if (dailyBudgetCents) params.daily_budget = dailyBudgetCents;
      if (lifetimeBudgetCents) params.lifetime_budget = lifetimeBudgetCents;
      return fbPost(`/${adAcct(adAccountId)}/campaigns`, params);
    },
  },
  {
    name: 'meta_ads_update_campaign',
    description: 'Update a campaign — change status, name, budget, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'] },
        dailyBudgetCents: { type: 'integer' },
        lifetimeBudgetCents: { type: 'integer' },
      },
      required: ['campaignId'],
    },
    handler: async ({ campaignId, name, status, dailyBudgetCents, lifetimeBudgetCents }) => {
      const params = {};
      if (name) params.name = name;
      if (status) params.status = status;
      if (dailyBudgetCents !== undefined) params.daily_budget = dailyBudgetCents;
      if (lifetimeBudgetCents !== undefined) params.lifetime_budget = lifetimeBudgetCents;
      return fbPost(`/${campaignId}`, params);
    },
  },
  {
    name: 'meta_ads_list_adsets',
    description: 'List ad sets in a campaign (or in an account if campaignId omitted).',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string' },
        adAccountId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
      },
    },
    handler: async ({ campaignId, adAccountId, limit = 50 }) => {
      const parent = campaignId ? `/${campaignId}` : `/${adAcct(adAccountId)}`;
      return fbGet(`${parent}/adsets`, {
        fields: 'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event,bid_amount,start_time,end_time,created_time',
        limit,
      });
    },
  },
  {
    name: 'meta_ads_list_ads',
    description: 'List ads in an ad set, campaign, or account.',
    inputSchema: {
      type: 'object',
      properties: {
        adsetId: { type: 'string' },
        campaignId: { type: 'string' },
        adAccountId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
      },
    },
    handler: async ({ adsetId, campaignId, adAccountId, limit = 50 }) => {
      const parent = adsetId ? `/${adsetId}` : campaignId ? `/${campaignId}` : `/${adAcct(adAccountId)}`;
      return fbGet(`${parent}/ads`, {
        fields: 'id,name,adset_id,campaign_id,status,effective_status,creative,tracking_specs,conversion_specs,created_time',
        limit,
      });
    },
  },
  {
    name: 'meta_ads_get_insights',
    description: 'Universal insights query. Returns metrics for ads/adsets/campaigns/accounts with date range + breakdowns. level=account|campaign|adset|ad. datePreset=last_7d|last_30d|last_90d|lifetime|today|yesterday|this_month etc.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Ad/Adset/Campaign ID OR act_XXX for account' },
        level: { type: 'string', enum: ['account', 'campaign', 'adset', 'ad'], default: 'campaign' },
        datePreset: { type: 'string', default: 'last_30d' },
        timeRange: { type: 'object', description: '{ since: "YYYY-MM-DD", until: "YYYY-MM-DD" } — overrides datePreset' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Default: impressions,clicks,spend,reach,frequency,ctr,cpc,actions,action_values,cost_per_action_type' },
        breakdowns: { type: 'array', items: { type: 'string' }, description: 'e.g. age, gender, country, placement, device_platform, publisher_platform' },
        limit: { type: 'integer', default: 100 },
      },
      required: ['objectId'],
    },
    handler: async ({ objectId, level = 'campaign', datePreset = 'last_30d', timeRange, fields, breakdowns, limit = 100 }) => {
      const params = {
        level,
        fields: (fields && fields.length ? fields : ['impressions','clicks','spend','reach','frequency','ctr','cpc','actions','action_values','cost_per_action_type','date_start','date_stop']).join(','),
        limit,
      };
      if (timeRange) params.time_range = JSON.stringify(timeRange);
      else params.date_preset = datePreset;
      if (breakdowns?.length) params.breakdowns = breakdowns.join(',');
      const id = objectId.startsWith('act_') || /^\d+$/.test(objectId) ? objectId : objectId;
      return fbGet(`/${id}/insights`, params);
    },
  },
  {
    name: 'meta_ads_list_custom_audiences',
    description: 'List custom audiences in an ad account.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
      },
      required: ['adAccountId'],
    },
    handler: async ({ adAccountId, limit = 50 }) => fbGet(`/${adAcct(adAccountId)}/customaudiences`, {
      fields: 'id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,data_source,description,permission_for_actions,time_created,time_updated',
      limit,
    }),
  },
  {
    name: 'meta_ads_create_custom_audience',
    description: 'Create a new custom audience. subtype: CUSTOM (user list) | WEBSITE (pixel) | APP | LOOKALIKE | etc.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string' },
        subtype: { type: 'string', default: 'CUSTOM' },
        description: { type: 'string' },
        customerFileSource: { type: 'string', enum: ['USER_PROVIDED_ONLY', 'PARTNER_PROVIDED_ONLY', 'BOTH_USER_AND_PARTNER_PROVIDED'], default: 'USER_PROVIDED_ONLY' },
      },
      required: ['adAccountId', 'name'],
    },
    handler: async ({ adAccountId, name, subtype, description, customerFileSource }) => fbPost(`/${adAcct(adAccountId)}/customaudiences`, {
      name,
      subtype: subtype || 'CUSTOM',
      description: description || '',
      customer_file_source: customerFileSource || 'USER_PROVIDED_ONLY',
    }),
  },
  {
    name: 'meta_ads_list_pixels',
    description: 'List Meta Pixels in an ad account.',
    inputSchema: { type: 'object', properties: { adAccountId: { type: 'string' } }, required: ['adAccountId'] },
    handler: async ({ adAccountId }) => fbGet(`/${adAcct(adAccountId)}/adspixels`, {
      fields: 'id,name,code,last_fired_time,is_unavailable,creation_time,creator',
    }),
  },
  {
    name: 'meta_ads_get_pixel_events',
    description: 'Get recent event activity from a Meta Pixel (last X days). Useful for verifying CAPI + pixel are firing.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        startTime: { type: 'string', description: 'YYYY-MM-DD or Unix timestamp' },
      },
      required: ['pixelId'],
    },
    handler: async ({ pixelId, startTime }) => {
      const params = { fields: 'id,name,last_fired_time' };
      if (startTime) params.start_time = startTime;
      return fbGet(`/${pixelId}/stats`, params);
    },
  },
];
