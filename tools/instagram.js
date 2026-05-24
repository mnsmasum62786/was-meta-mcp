/**
 * Instagram Graph API — IG Business accounts linked to Pages.
 * Required perms: instagram_basic, instagram_manage_comments, instagram_manage_insights, instagram_content_publish.
 */

import { fbGet, fbPost } from '../graph-client.js';

export const instagramTools = [
  {
    name: 'meta_ig_list_accounts',
    description: 'List Instagram Business accounts linked to Pages the user manages. Returns ig_account_id linked to each page.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', default: 50 } } },
    handler: async ({ limit = 50 }) => {
      const result = await fbGet('/me/accounts', { fields: 'id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}', limit });
      // Reshape to surface IG accounts cleanly
      const igAccounts = (result.data || []).filter(p => p.instagram_business_account).map(p => ({
        page_id: p.id,
        page_name: p.name,
        ig_account_id: p.instagram_business_account.id,
        ig_username: p.instagram_business_account.username,
        ig_name: p.instagram_business_account.name,
        followers: p.instagram_business_account.followers_count,
        media_count: p.instagram_business_account.media_count,
      }));
      return { count: igAccounts.length, accounts: igAccounts };
    },
  },
  {
    name: 'meta_ig_get_info',
    description: 'Get an IG Business account profile.',
    inputSchema: { type: 'object', properties: { igAccountId: { type: 'string' } }, required: ['igAccountId'] },
    handler: async ({ igAccountId }) => fbGet(`/${igAccountId}`, {
      fields: 'id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,ig_id',
    }),
  },
  {
    name: 'meta_ig_get_insights',
    description: 'IG account-level insights. metrics: reach, impressions, profile_views, follower_count, accounts_engaged, total_interactions.',
    inputSchema: {
      type: 'object',
      properties: {
        igAccountId: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Default: reach, impressions, profile_views, follower_count' },
        period: { type: 'string', enum: ['day', 'week', 'days_28', 'lifetime'], default: 'day' },
        since: { type: 'string', description: 'YYYY-MM-DD or unix' },
        until: { type: 'string' },
      },
      required: ['igAccountId'],
    },
    handler: async ({ igAccountId, metrics, period = 'day', since, until }) => {
      const params = {
        metric: (metrics && metrics.length ? metrics : ['reach','impressions','profile_views','follower_count']).join(','),
        period,
      };
      if (since) params.since = since;
      if (until) params.until = until;
      return fbGet(`/${igAccountId}/insights`, params);
    },
  },
  {
    name: 'meta_ig_list_media',
    description: 'List IG posts/reels/stories from a business account.',
    inputSchema: {
      type: 'object',
      properties: {
        igAccountId: { type: 'string' },
        limit: { type: 'integer', default: 25 },
      },
      required: ['igAccountId'],
    },
    handler: async ({ igAccountId, limit = 25 }) => fbGet(`/${igAccountId}/media`, {
      fields: 'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,is_shared_to_feed,is_comment_enabled,username',
      limit,
    }),
  },
  {
    name: 'meta_ig_get_media_insights',
    description: 'Get insights for a specific IG post/reel/story. metrics vary by media_type.',
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Default for posts: reach, impressions, engagement, saved. For reels: reach, plays, total_interactions, comments, likes, shares, saved.' },
      },
      required: ['mediaId'],
    },
    handler: async ({ mediaId, metrics }) => fbGet(`/${mediaId}/insights`, {
      metric: (metrics && metrics.length ? metrics : ['reach','impressions','engagement','saved']).join(','),
    }),
  },
  {
    name: 'meta_ig_list_comments',
    description: 'List comments on an IG post.',
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        limit: { type: 'integer', default: 50 },
      },
      required: ['mediaId'],
    },
    handler: async ({ mediaId, limit = 50 }) => fbGet(`/${mediaId}/comments`, {
      fields: 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp}',
      limit,
    }),
  },
  {
    name: 'meta_ig_reply_comment',
    description: 'Reply to an IG comment.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['commentId', 'message'],
    },
    handler: async ({ commentId, message }) => fbPost(`/${commentId}/replies`, { message }),
  },
  {
    name: 'meta_ig_create_post',
    description: 'Create an Instagram post (two-step: create media container, then publish). Requires instagram_content_publish permission (which is currently NOT in the token — re-extend with that scope to enable posting).',
    inputSchema: {
      type: 'object',
      properties: {
        igAccountId: { type: 'string' },
        imageUrl: { type: 'string', description: 'Public URL to image (for photo posts)' },
        videoUrl: { type: 'string', description: 'Public URL to video (for reels/video posts)' },
        caption: { type: 'string' },
        mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO', 'REELS'], default: 'IMAGE' },
      },
      required: ['igAccountId'],
    },
    handler: async ({ igAccountId, imageUrl, videoUrl, caption, mediaType }) => {
      // Step 1: create container
      const containerParams = { caption: caption || '' };
      if (imageUrl) containerParams.image_url = imageUrl;
      if (videoUrl) containerParams.video_url = videoUrl;
      if (mediaType === 'REELS') containerParams.media_type = 'REELS';
      else if (mediaType === 'VIDEO') containerParams.media_type = 'VIDEO';
      const container = await fbPost(`/${igAccountId}/media`, containerParams);
      // Step 2: publish (synchronously)
      const publishResult = await fbPost(`/${igAccountId}/media_publish`, { creation_id: container.id });
      return { container_id: container.id, publish_result: publishResult };
    },
  },
];
