/**
 * Facebook Pages — info, posts, insights, comments, messaging.
 */

import { fbGet, fbPost, fbDelete } from '../graph-client.js';

export const pagesTools = [
  {
    name: 'meta_page_list_pages',
    description: 'List all Facebook Pages the authenticated user can manage. Returns id, name, category, access_token (page-specific), tasks (permissions).',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', default: 100 } } },
    handler: async ({ limit = 100 }) => fbGet('/me/accounts', {
      fields: 'id,name,category,category_list,access_token,tasks,fan_count,about,link',
      limit,
    }),
  },
  {
    name: 'meta_page_get_info',
    description: 'Get a Page profile: name, about, fan_count, link, location, hours, verification status.',
    inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] },
    handler: async ({ pageId }) => fbGet(`/${pageId}`, {
      fields: 'id,name,about,description,category,category_list,fan_count,followers_count,link,location,hours,website,phone,emails,is_published,is_verified,verification_status,access_token,picture.type(large),cover',
    }),
  },
  {
    name: 'meta_page_get_insights',
    description: 'Get Page-level insights (reach, impressions, engaged users, fan growth). period: day | week | days_28.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Default: page_impressions, page_post_engagements, page_fan_adds_unique, page_views_total' },
        period: { type: 'string', enum: ['day', 'week', 'days_28'], default: 'day' },
        datePreset: { type: 'string', default: 'last_30d' },
        since: { type: 'string', description: 'YYYY-MM-DD or unix timestamp' },
        until: { type: 'string' },
      },
      required: ['pageId'],
    },
    handler: async ({ pageId, metrics, period = 'day', datePreset, since, until }) => {
      const params = {
        metric: (metrics && metrics.length ? metrics : ['page_impressions','page_post_engagements','page_fan_adds_unique','page_views_total']).join(','),
        period,
      };
      if (since && until) {
        params.since = since;
        params.until = until;
      } else {
        params.date_preset = datePreset || 'last_30d';
      }
      return fbGet(`/${pageId}/insights`, params);
    },
  },
  {
    name: 'meta_page_list_posts',
    description: 'List posts published by a Page (or scheduled). includeScheduled=true returns scheduled + published posts.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string' },
        limit: { type: 'integer', default: 25 },
        includeScheduled: { type: 'boolean', default: false },
      },
      required: ['pageId'],
    },
    handler: async ({ pageId, limit = 25, includeScheduled }) => {
      const endpoint = includeScheduled ? 'feed' : 'published_posts';
      return fbGet(`/${pageId}/${endpoint}`, {
        fields: 'id,message,created_time,updated_time,permalink_url,full_picture,is_published,is_hidden,is_popular,scheduled_publish_time,attachments,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total){values}',
        limit,
      });
    },
  },
  {
    name: 'meta_page_create_post',
    description: 'Publish a post on a Page. type: text | link | photo | video. Use scheduled_publish_time (Unix timestamp) + published=false to schedule. Requires the Page Access Token (use meta_page_list_pages to get it).',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string' },
        pageAccessToken: { type: 'string', description: 'Page access token from meta_page_list_pages — required for publishing' },
        message: { type: 'string' },
        link: { type: 'string', description: 'For link share posts' },
        photoUrl: { type: 'string', description: 'Public URL to a photo (uploads via the Pages API)' },
        videoUrl: { type: 'string', description: 'Public URL to a video' },
        scheduledPublishTime: { type: 'integer', description: 'Unix timestamp for scheduling (must be 10+ min in future, max 75 days)' },
        published: { type: 'boolean', default: true },
      },
      required: ['pageId', 'pageAccessToken', 'message'],
    },
    handler: async ({ pageId, pageAccessToken, message, link, photoUrl, videoUrl, scheduledPublishTime, published }) => {
      const params = { message, access_token: pageAccessToken };
      let endpoint = `/${pageId}/feed`;
      if (link) params.link = link;
      if (photoUrl) {
        params.url = photoUrl;
        endpoint = `/${pageId}/photos`;
      }
      if (videoUrl) {
        params.file_url = videoUrl;
        endpoint = `/${pageId}/videos`;
      }
      if (scheduledPublishTime) {
        params.scheduled_publish_time = scheduledPublishTime;
        params.published = false;
      } else if (published === false) {
        params.published = false;
      }
      // Override access_token in URL to use page token
      const url = new URL(`https://graph.facebook.com/v22.0${endpoint}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
      const res = await fetch(url.toString(), { method: 'POST' });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      if (!res.ok) throw new Error(`Meta Graph API error: ${JSON.stringify(parsed)}`);
      return parsed;
    },
  },
  {
    name: 'meta_page_delete_post',
    description: 'Delete a Page post by ID. Works for both published AND scheduled posts (same endpoint). Pass pageAccessToken for client-page scenarios; if omitted, the user token is used (works when you are an admin of the page).',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        pageAccessToken: { type: 'string', description: 'Optional — get from meta_page_list_pages. Recommended for reliability.' },
      },
      required: ['postId'],
    },
    handler: async ({ postId, pageAccessToken }) => {
      if (pageAccessToken) {
        const url = `https://graph.facebook.com/v22.0/${postId}?access_token=${pageAccessToken}`;
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) throw new Error(`Page API error: ${data.error.message}`);
        return data;
      }
      return fbDelete(`/${postId}`);
    },
  },
  {
    name: 'meta_page_list_comments',
    description: 'List comments on a post or page object.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Post ID or other commentable object ID' },
        limit: { type: 'integer', default: 50 },
      },
      required: ['objectId'],
    },
    handler: async ({ objectId, limit = 50 }) => fbGet(`/${objectId}/comments`, {
      fields: 'id,message,from,created_time,like_count,comment_count,parent,attachment',
      limit,
    }),
  },
  {
    name: 'meta_page_reply_comment',
    description: 'Reply to a comment as the Page. Requires pageAccessToken.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        message: { type: 'string' },
        pageAccessToken: { type: 'string' },
      },
      required: ['commentId', 'message', 'pageAccessToken'],
    },
    handler: async ({ commentId, message, pageAccessToken }) => {
      const url = `https://graph.facebook.com/v22.0/${commentId}/comments?message=${encodeURIComponent(message)}&access_token=${pageAccessToken}`;
      const res = await fetch(url, { method: 'POST' });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      if (!res.ok) throw new Error(`Meta Graph API error: ${JSON.stringify(parsed)}`);
      return parsed;
    },
  },
  {
    name: 'meta_page_list_conversations',
    description: 'List Page DM conversations (Business Suite inbox). Requires pageAccessToken.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        limit: { type: 'integer', default: 25 },
      },
      required: ['pageId', 'pageAccessToken'],
    },
    handler: async ({ pageId, pageAccessToken, limit = 25 }) => {
      const url = `https://graph.facebook.com/v22.0/${pageId}/conversations?fields=id,snippet,updated_time,unread_count,message_count,participants&limit=${limit}&access_token=${pageAccessToken}`;
      const res = await fetch(url);
      return res.json();
    },
  },
];
