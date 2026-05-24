/**
 * Pages — additional write operations: comment moderation, messaging, post editing, insights.
 */

import { fbGet, fbPost, fbDelete } from '../graph-client.js';

// Helper: page-scoped fetch using page access token (not the user token).
async function pageFetch(method, path, pageAccessToken, params = {}, body) {
  const url = new URL(`https://graph.facebook.com/v22.0${path}`);
  url.searchParams.set('access_token', pageAccessToken);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const init = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url.toString(), init);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  if (!res.ok) {
    const err = parsed?.error || { message: text };
    const e = new Error(`Page API error: ${err.message}`);
    e.status = res.status;
    e.code = err.code;
    e.body = parsed;
    throw e;
  }
  return parsed;
}

export const pagesWriteTools = [
  {
    name: 'meta_page_delete_comment',
    description: 'Permanently delete a comment on a Page post. Requires pageAccessToken.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        pageAccessToken: { type: 'string' },
      },
      required: ['commentId', 'pageAccessToken'],
    },
    handler: async ({ commentId, pageAccessToken }) => pageFetch('DELETE', `/${commentId}`, pageAccessToken),
  },
  {
    name: 'meta_page_hide_comment',
    description: 'Hide a comment (visible only to the commenter and their friends). Pass hide=false to unhide.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        hide: { type: 'boolean', default: true },
      },
      required: ['commentId', 'pageAccessToken'],
    },
    handler: async ({ commentId, pageAccessToken, hide = true }) => pageFetch('POST', `/${commentId}`, pageAccessToken, { is_hidden: hide ? 'true' : 'false' }),
  },
  {
    name: 'meta_page_like_comment',
    description: 'Like (or unlike) a comment as the Page. Pass like=false to unlike.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        like: { type: 'boolean', default: true },
      },
      required: ['commentId', 'pageAccessToken'],
    },
    handler: async ({ commentId, pageAccessToken, like = true }) => {
      const method = like ? 'POST' : 'DELETE';
      return pageFetch(method, `/${commentId}/likes`, pageAccessToken);
    },
  },
  {
    name: 'meta_page_send_message',
    description: 'Send a DM from a Page to a user. recipientId is the page-scoped user ID (PSID). Within the 24-hour standard messaging window. messagingType: RESPONSE for replies, UPDATE for confirmations, MESSAGE_TAG for tagged messages.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        recipientId: { type: 'string', description: 'Page-scoped user ID (PSID) — find via meta_page_list_conversations' },
        message: { type: 'string', description: 'Message text' },
        messagingType: { type: 'string', enum: ['RESPONSE', 'UPDATE', 'MESSAGE_TAG'], default: 'RESPONSE' },
        tag: { type: 'string', description: 'Required if messagingType=MESSAGE_TAG. Values: ACCOUNT_UPDATE, POST_PURCHASE_UPDATE, CONFIRMED_EVENT_UPDATE, HUMAN_AGENT' },
      },
      required: ['pageId', 'pageAccessToken', 'recipientId', 'message'],
    },
    handler: async ({ pageId, pageAccessToken, recipientId, message, messagingType, tag }) => {
      const body = {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: messagingType || 'RESPONSE',
      };
      if (tag) body.tag = tag;
      return pageFetch('POST', `/${pageId}/messages`, pageAccessToken, {}, body);
    },
  },
  {
    name: 'meta_page_list_messages',
    description: 'List messages in a specific conversation. conversationId comes from meta_page_list_conversations.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        limit: { type: 'integer', default: 25 },
      },
      required: ['conversationId', 'pageAccessToken'],
    },
    handler: async ({ conversationId, pageAccessToken, limit = 25 }) => pageFetch('GET', `/${conversationId}/messages`, pageAccessToken, {
      fields: 'id,message,from,to,created_time,attachments,shares',
      limit,
    }),
  },
  {
    name: 'meta_page_update_post',
    description: 'Edit an existing Page post — change the message text. Some post types (link previews, scheduled posts) have limitations.',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        pageAccessToken: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['postId', 'pageAccessToken', 'message'],
    },
    handler: async ({ postId, pageAccessToken, message }) => pageFetch('POST', `/${postId}`, pageAccessToken, { message }),
  },
  {
    name: 'meta_page_get_post_insights',
    description: 'Get insights for a specific Page post. Common metrics: post_impressions, post_impressions_unique, post_engaged_users, post_reactions_by_type_total, post_video_views, post_clicks_by_link_target.',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' }, description: 'Default: post_impressions, post_impressions_unique, post_engaged_users, post_reactions_by_type_total, post_clicks' },
      },
      required: ['postId'],
    },
    handler: async ({ postId, metrics }) => fbGet(`/${postId}/insights`, {
      metric: (metrics && metrics.length ? metrics : ['post_impressions','post_impressions_unique','post_engaged_users','post_reactions_by_type_total','post_clicks']).join(','),
    }),
  },
];
