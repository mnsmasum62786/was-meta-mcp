/**
 * Meta Marketing API — write operations: ad sets, ads, creatives, media uploads, targeting search.
 */

import { fbGet, fbPost, adAcct } from '../graph-client.js';

export const adsWriteTools = [
  {
    name: 'meta_ads_create_adset',
    description: 'Create an ad set inside a campaign. Required: campaignId, name, optimizationGoal, billingEvent, bidAmount, targeting, dailyBudgetCents OR lifetimeBudgetCents, startTime. optimizationGoal examples: OFFSITE_CONVERSIONS, LINK_CLICKS, IMPRESSIONS, REACH, LEAD_GENERATION, VALUE, THRUPLAY. billingEvent: IMPRESSIONS | LINK_CLICKS | THRUPLAY. targeting is a JSON object with geo_locations, age_min, age_max, genders, interests, custom_audiences, placements, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string' },
        campaignId: { type: 'string' },
        optimizationGoal: { type: 'string', description: 'OFFSITE_CONVERSIONS | LINK_CLICKS | IMPRESSIONS | REACH | LEAD_GENERATION | VALUE | THRUPLAY | LANDING_PAGE_VIEWS' },
        billingEvent: { type: 'string', enum: ['IMPRESSIONS', 'LINK_CLICKS', 'THRUPLAY'] },
        bidAmount: { type: 'integer', description: 'Bid in account currency cents' },
        dailyBudgetCents: { type: 'integer' },
        lifetimeBudgetCents: { type: 'integer' },
        startTime: { type: 'string', description: 'ISO 8601 datetime' },
        endTime: { type: 'string', description: 'ISO 8601 datetime (required for lifetime budget)' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], default: 'PAUSED' },
        targeting: {
          type: 'object',
          description: 'Targeting spec — geo_locations:{countries:["US"]}, age_min:18, age_max:65, genders:[1=male,2=female], interests:[{id,name}], custom_audiences:[{id}], publisher_platforms:["facebook","instagram"], facebook_positions:["feed","story"], instagram_positions:["stream","story","reels"], device_platforms:["mobile","desktop"]',
        },
        promotedObject: { type: 'object', description: 'For conversion campaigns: {pixel_id, custom_event_type:"PURCHASE"} or {page_id} for engagement' },
        attributionSpec: { type: 'array', items: { type: 'object' } },
      },
      required: ['adAccountId', 'name', 'campaignId', 'optimizationGoal', 'billingEvent', 'targeting'],
    },
    handler: async (args) => {
      const params = {
        name: args.name,
        campaign_id: args.campaignId,
        optimization_goal: args.optimizationGoal,
        billing_event: args.billingEvent,
        targeting: JSON.stringify(args.targeting),
        status: args.status || 'PAUSED',
      };
      if (args.bidAmount !== undefined) params.bid_amount = args.bidAmount;
      if (args.dailyBudgetCents !== undefined) params.daily_budget = args.dailyBudgetCents;
      if (args.lifetimeBudgetCents !== undefined) params.lifetime_budget = args.lifetimeBudgetCents;
      if (args.startTime) params.start_time = args.startTime;
      if (args.endTime) params.end_time = args.endTime;
      if (args.promotedObject) params.promoted_object = JSON.stringify(args.promotedObject);
      if (args.attributionSpec) params.attribution_spec = JSON.stringify(args.attributionSpec);
      return fbPost(`/${adAcct(args.adAccountId)}/adsets`, params);
    },
  },
  {
    name: 'meta_ads_update_adset',
    description: 'Update an ad set — change status, name, budget, targeting, bid. Pass adsetId + only the fields you want to change.',
    inputSchema: {
      type: 'object',
      properties: {
        adsetId: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'] },
        dailyBudgetCents: { type: 'integer' },
        lifetimeBudgetCents: { type: 'integer' },
        bidAmount: { type: 'integer' },
        targeting: { type: 'object' },
        endTime: { type: 'string' },
      },
      required: ['adsetId'],
    },
    handler: async (args) => {
      const params = {};
      if (args.name) params.name = args.name;
      if (args.status) params.status = args.status;
      if (args.dailyBudgetCents !== undefined) params.daily_budget = args.dailyBudgetCents;
      if (args.lifetimeBudgetCents !== undefined) params.lifetime_budget = args.lifetimeBudgetCents;
      if (args.bidAmount !== undefined) params.bid_amount = args.bidAmount;
      if (args.targeting) params.targeting = JSON.stringify(args.targeting);
      if (args.endTime) params.end_time = args.endTime;
      return fbPost(`/${args.adsetId}`, params);
    },
  },
  {
    name: 'meta_ads_create_ad_creative',
    description: 'Create an ad creative for use in ads. Three modes: (1) Link creative with object_story_spec.link_data, (2) Photo creative with object_story_spec.photo_data, (3) Video creative with object_story_spec.video_data. pageId is required for the page identity behind the ad. Use meta_ads_upload_ad_image first to get image hashes.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string' },
        pageId: { type: 'string', description: 'Facebook Page ID — required as the ad identity' },
        instagramActorId: { type: 'string', description: 'Optional IG account ID for IG ads' },
        // Link/CTA-style ad
        message: { type: 'string', description: 'Primary text shown above the ad' },
        link: { type: 'string', description: 'Landing page URL' },
        linkTitle: { type: 'string', description: 'Headline shown on the ad' },
        linkDescription: { type: 'string', description: 'Description text' },
        callToAction: { type: 'string', description: 'LEARN_MORE | SHOP_NOW | SIGN_UP | DOWNLOAD | CONTACT_US | etc.' },
        // Image
        imageHash: { type: 'string', description: 'Hash from meta_ads_upload_ad_image (for single-image link ads)' },
        // Video
        videoId: { type: 'string', description: 'Video ID from meta_ads_upload_ad_video (for video ads)' },
        videoThumbnailUrl: { type: 'string', description: 'Thumbnail URL for video ad' },
        // Raw spec override
        objectStorySpec: { type: 'object', description: 'Full object_story_spec JSON — overrides the simplified fields above. Use when you need a creative type the simplified params can not express (carousel, dynamic product, etc.)' },
      },
      required: ['adAccountId', 'name', 'pageId'],
    },
    handler: async (args) => {
      const params = { name: args.name };
      let storySpec;
      if (args.objectStorySpec) {
        storySpec = args.objectStorySpec;
      } else if (args.videoId) {
        storySpec = {
          page_id: args.pageId,
          ...(args.instagramActorId ? { instagram_actor_id: args.instagramActorId } : {}),
          video_data: {
            video_id: args.videoId,
            message: args.message,
            ...(args.videoThumbnailUrl ? { image_url: args.videoThumbnailUrl } : {}),
            ...(args.linkTitle ? { title: args.linkTitle } : {}),
            ...(args.callToAction ? { call_to_action: { type: args.callToAction, value: { link: args.link } } } : {}),
          },
        };
      } else if (args.imageHash && args.link) {
        storySpec = {
          page_id: args.pageId,
          ...(args.instagramActorId ? { instagram_actor_id: args.instagramActorId } : {}),
          link_data: {
            image_hash: args.imageHash,
            link: args.link,
            message: args.message,
            name: args.linkTitle,
            description: args.linkDescription,
            ...(args.callToAction ? { call_to_action: { type: args.callToAction, value: { link: args.link } } } : {}),
          },
        };
      } else if (args.link) {
        storySpec = {
          page_id: args.pageId,
          ...(args.instagramActorId ? { instagram_actor_id: args.instagramActorId } : {}),
          link_data: {
            link: args.link,
            message: args.message,
            name: args.linkTitle,
            description: args.linkDescription,
            ...(args.callToAction ? { call_to_action: { type: args.callToAction, value: { link: args.link } } } : {}),
          },
        };
      } else {
        throw new Error('Provide either imageHash+link, videoId+link, link alone, or full objectStorySpec.');
      }
      params.object_story_spec = JSON.stringify(storySpec);
      return fbPost(`/${adAcct(args.adAccountId)}/adcreatives`, params);
    },
  },
  {
    name: 'meta_ads_upload_ad_image',
    description: 'Upload an image into an ad account. Returns the image hash that you then pass to meta_ads_create_ad_creative.imageHash. Image source can be either a public URL or a base64 data string.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        imageUrl: { type: 'string', description: 'Public URL to the image (Meta downloads and stores it)' },
        imageBase64: { type: 'string', description: 'Alternative: base64-encoded image bytes' },
      },
      required: ['adAccountId'],
    },
    handler: async (args) => {
      if (!args.imageUrl && !args.imageBase64) {
        throw new Error('Provide either imageUrl or imageBase64.');
      }
      const params = {};
      if (args.imageUrl) params.url = args.imageUrl;
      if (args.imageBase64) params.bytes = args.imageBase64;
      return fbPost(`/${adAcct(args.adAccountId)}/adimages`, params);
    },
  },
  {
    name: 'meta_ads_upload_ad_video',
    description: 'Upload a video into an ad account. Returns videoId for use in meta_ads_create_ad_creative.videoId. Source: a public URL (Meta downloads it) or a remote video file URL.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        videoUrl: { type: 'string', description: 'Public URL to the video file (mp4/mov)' },
        name: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['adAccountId', 'videoUrl'],
    },
    handler: async (args) => {
      const params = { file_url: args.videoUrl };
      if (args.name) params.name = args.name;
      if (args.title) params.title = args.title;
      if (args.description) params.description = args.description;
      return fbPost(`/${adAcct(args.adAccountId)}/advideos`, params);
    },
  },
  {
    name: 'meta_ads_create_ad',
    description: 'Create an ad inside an ad set. Required: adsetId, name, creativeId (from meta_ads_create_ad_creative). status defaults to PAUSED for safety.',
    inputSchema: {
      type: 'object',
      properties: {
        adAccountId: { type: 'string' },
        name: { type: 'string' },
        adsetId: { type: 'string' },
        creativeId: { type: 'string', description: 'Ad creative ID from meta_ads_create_ad_creative' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], default: 'PAUSED' },
        trackingSpecs: { type: 'array', items: { type: 'object' } },
      },
      required: ['adAccountId', 'name', 'adsetId', 'creativeId'],
    },
    handler: async (args) => {
      const params = {
        name: args.name,
        adset_id: args.adsetId,
        creative: JSON.stringify({ creative_id: args.creativeId }),
        status: args.status || 'PAUSED',
      };
      if (args.trackingSpecs) params.tracking_specs = JSON.stringify(args.trackingSpecs);
      return fbPost(`/${adAcct(args.adAccountId)}/ads`, params);
    },
  },
  {
    name: 'meta_ads_update_ad',
    description: 'Update an ad — change status, name, or creative.',
    inputSchema: {
      type: 'object',
      properties: {
        adId: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'] },
        creativeId: { type: 'string' },
      },
      required: ['adId'],
    },
    handler: async (args) => {
      const params = {};
      if (args.name) params.name = args.name;
      if (args.status) params.status = args.status;
      if (args.creativeId) params.creative = JSON.stringify({ creative_id: args.creativeId });
      return fbPost(`/${args.adId}`, params);
    },
  },
  {
    name: 'meta_ads_search_targeting',
    description: 'Search Meta targeting options: interests, behaviors, demographics, locations, languages. type=adinterest|adgeolocation|adlocale|behavior|education_school|life_event|family_statuses|industries|relationship_statuses|work_employers|work_positions.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query (e.g. "fitness", "digital marketing", "dhaka")' },
        type: { type: 'string', default: 'adinterest' },
        limit: { type: 'integer', default: 25 },
        countryCode: { type: 'string', description: 'For geo searches: ISO 2-letter (e.g. BD, US)' },
        locationTypes: { type: 'array', items: { type: 'string' }, description: 'For adgeolocation: ["country","region","city","zip"]' },
      },
      required: ['q'],
    },
    handler: async (args) => {
      const params = { q: args.q, type: args.type || 'adinterest', limit: args.limit || 25 };
      if (args.countryCode) params.country_code = args.countryCode;
      if (args.locationTypes) params.location_types = JSON.stringify(args.locationTypes);
      return fbGet('/search', params);
    },
  },
];
