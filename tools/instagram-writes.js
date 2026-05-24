/**
 * Instagram — moderation + messaging additions.
 * Requires: instagram_manage_comments, instagram_manage_messages.
 */

import { fbGet, fbPost, fbDelete } from '../graph-client.js';

export const instagramWriteTools = [
  {
    name: 'meta_ig_delete_comment',
    description: 'Delete a comment on an IG post. Requires instagram_manage_comments.',
    inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] },
    handler: async ({ commentId }) => fbDelete(`/${commentId}`),
  },
  {
    name: 'meta_ig_hide_comment',
    description: 'Hide (or unhide) a comment on an IG post. hide=true hides, hide=false unhides.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        hide: { type: 'boolean', default: true },
      },
      required: ['commentId'],
    },
    handler: async ({ commentId, hide = true }) => fbPost(`/${commentId}`, { hide: hide ? 'true' : 'false' }),
  },
  {
    name: 'meta_ig_list_conversations',
    description: 'List IG Direct Messages conversations for an IG Business account. Uses the linked Facebook Page access token + Messenger Platform API with the platform=instagram parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Facebook Page ID linked to the IG account' },
        pageAccessToken: { type: 'string' },
        limit: { type: 'integer', default: 25 },
      },
      required: ['pageId', 'pageAccessToken'],
    },
    handler: async ({ pageId, pageAccessToken, limit = 25 }) => {
      const url = `https://graph.facebook.com/v22.0/${pageId}/conversations?platform=instagram&fields=id,snippet,updated_time,unread_count,message_count,participants&limit=${limit}&access_token=${pageAccessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(`IG conversations: ${data.error.message}`);
      return data;
    },
  },
  {
    name: 'meta_ig_send_message',
    description: 'Send an Instagram Direct Message via the Messenger Platform. recipientId is the IG-scoped user ID (IGSID) from list_conversations. Within the 24-hour standard messaging window OR using human_agent tag.',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Facebook Page ID linked to the IG account' },
        pageAccessToken: { type: 'string' },
        recipientId: { type: 'string', description: 'Instagram-scoped user ID (IGSID)' },
        message: { type: 'string' },
        messagingType: { type: 'string', enum: ['RESPONSE', 'UPDATE', 'MESSAGE_TAG'], default: 'RESPONSE' },
        tag: { type: 'string', description: 'Required if messagingType=MESSAGE_TAG. e.g. HUMAN_AGENT' },
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
      const url = `https://graph.facebook.com/v22.0/${pageId}/messages?access_token=${pageAccessToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(`IG send_message: ${data.error.message}`);
      return data;
    },
  },
];
