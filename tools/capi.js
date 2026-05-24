/**
 * Meta Conversions API (CAPI) — server-side event sending.
 */

import { fbPost } from '../graph-client.js';
import { createHash } from 'node:crypto';

const sha256 = (s) => createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');

function buildUserData(userData = {}) {
  const ud = {};
  if (userData.email) ud.em = [sha256(userData.email)];
  if (userData.phone) ud.ph = [sha256(userData.phone.replace(/\D/g, ''))];
  if (userData.firstName) ud.fn = [sha256(userData.firstName)];
  if (userData.lastName) ud.ln = [sha256(userData.lastName)];
  if (userData.city) ud.ct = [sha256(userData.city)];
  if (userData.state) ud.st = [sha256(userData.state)];
  if (userData.zip) ud.zp = [sha256(userData.zip)];
  if (userData.country) ud.country = [sha256(userData.country)];
  if (userData.dateOfBirth) ud.db = [sha256(userData.dateOfBirth.replace(/-/g, ''))];
  if (userData.gender) ud.ge = [sha256(userData.gender.charAt(0).toLowerCase())];
  if (userData.externalId) ud.external_id = [sha256(userData.externalId)];
  // Non-hashed identifiers
  if (userData.clientIpAddress) ud.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) ud.client_user_agent = userData.clientUserAgent;
  if (userData.fbc) ud.fbc = userData.fbc;
  if (userData.fbp) ud.fbp = userData.fbp;
  return ud;
}

export const capiTools = [
  {
    name: 'meta_capi_send_event',
    description: 'Send a single server-side conversion event to a Meta Pixel via Conversions API. User PII (email, phone, name, etc.) is auto-hashed with SHA-256 before sending.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string', description: 'Destination pixel ID' },
        eventName: { type: 'string', description: 'Standard event name (Purchase, Lead, ViewContent, AddToCart, InitiateCheckout, CompleteRegistration, Search, AddPaymentInfo, AddToWishlist, Contact, etc.) OR custom event name' },
        eventTime: { type: 'integer', description: 'Unix timestamp (seconds). Defaults to now.' },
        eventId: { type: 'string', description: 'Unique ID for dedup with browser pixel events' },
        eventSourceUrl: { type: 'string', description: 'URL where event occurred (for web)' },
        actionSource: { type: 'string', enum: ['website', 'app', 'phone_call', 'chat', 'email', 'physical_store', 'system_generated', 'other'], default: 'website' },
        userData: {
          type: 'object',
          description: 'User identifiers (will be SHA-256 hashed automatically)',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string', description: 'ISO 2-letter' },
            dateOfBirth: { type: 'string', description: 'YYYY-MM-DD or YYYYMMDD' },
            gender: { type: 'string', description: 'm or f' },
            externalId: { type: 'string', description: 'Your internal user ID' },
            clientIpAddress: { type: 'string' },
            clientUserAgent: { type: 'string' },
            fbc: { type: 'string', description: 'Facebook click ID cookie value' },
            fbp: { type: 'string', description: 'Facebook browser ID cookie value' },
          },
        },
        customData: {
          type: 'object',
          description: 'Event-specific data',
          properties: {
            currency: { type: 'string', description: 'ISO 4217, e.g. USD' },
            value: { type: 'number', description: 'Monetary value' },
            contentIds: { type: 'array', items: { type: 'string' } },
            contentName: { type: 'string' },
            contentCategory: { type: 'string' },
            contentType: { type: 'string', description: 'product | product_group' },
            contents: { type: 'array', items: { type: 'object' }, description: '[{ id, quantity, item_price }]' },
            numItems: { type: 'integer' },
            orderId: { type: 'string' },
            predictedLtv: { type: 'number' },
            status: { type: 'string' },
            searchString: { type: 'string' },
          },
        },
        testEventCode: { type: 'string', description: 'If set, event is sent as a test event (visible in Events Manager > Test Events)' },
      },
      required: ['pixelId', 'eventName', 'userData'],
    },
    handler: async ({ pixelId, eventName, eventTime, eventId, eventSourceUrl, actionSource, userData, customData, testEventCode }) => {
      const event = {
        event_name: eventName,
        event_time: eventTime || Math.floor(Date.now() / 1000),
        action_source: actionSource || 'website',
        user_data: buildUserData(userData),
      };
      if (eventId) event.event_id = eventId;
      if (eventSourceUrl) event.event_source_url = eventSourceUrl;
      if (customData) {
        event.custom_data = {};
        if (customData.currency) event.custom_data.currency = customData.currency;
        if (customData.value !== undefined) event.custom_data.value = customData.value;
        if (customData.contentIds) event.custom_data.content_ids = customData.contentIds;
        if (customData.contentName) event.custom_data.content_name = customData.contentName;
        if (customData.contentCategory) event.custom_data.content_category = customData.contentCategory;
        if (customData.contentType) event.custom_data.content_type = customData.contentType;
        if (customData.contents) event.custom_data.contents = customData.contents;
        if (customData.numItems !== undefined) event.custom_data.num_items = customData.numItems;
        if (customData.orderId) event.custom_data.order_id = customData.orderId;
        if (customData.predictedLtv !== undefined) event.custom_data.predicted_ltv = customData.predictedLtv;
        if (customData.status) event.custom_data.status = customData.status;
        if (customData.searchString) event.custom_data.search_string = customData.searchString;
      }
      const params = { data: JSON.stringify([event]) };
      if (testEventCode) params.test_event_code = testEventCode;
      return fbPost(`/${pixelId}/events`, params);
    },
  },
  {
    name: 'meta_capi_send_purchase',
    description: 'Convenience: send a Purchase event with the proper schema. currency + value are required by Meta.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        value: { type: 'number', description: 'Purchase amount' },
        currency: { type: 'string', description: 'ISO 4217, e.g. USD, BDT' },
        orderId: { type: 'string' },
        contentIds: { type: 'array', items: { type: 'string' } },
        contents: { type: 'array', items: { type: 'object' } },
        userData: { type: 'object', description: 'See meta_capi_send_event' },
        eventId: { type: 'string', description: 'Dedup ID for browser/pixel match' },
        eventSourceUrl: { type: 'string' },
        testEventCode: { type: 'string' },
      },
      required: ['pixelId', 'value', 'currency', 'userData'],
    },
    handler: async (args) => {
      const event = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: buildUserData(args.userData),
        custom_data: { currency: args.currency, value: args.value },
      };
      if (args.orderId) event.custom_data.order_id = args.orderId;
      if (args.contentIds) event.custom_data.content_ids = args.contentIds;
      if (args.contents) event.custom_data.contents = args.contents;
      if (args.eventId) event.event_id = args.eventId;
      if (args.eventSourceUrl) event.event_source_url = args.eventSourceUrl;
      const params = { data: JSON.stringify([event]) };
      if (args.testEventCode) params.test_event_code = args.testEventCode;
      return fbPost(`/${args.pixelId}/events`, params);
    },
  },
  {
    name: 'meta_capi_send_lead',
    description: 'Convenience: send a Lead event. Useful for form submissions / quote requests.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        value: { type: 'number', description: 'Optional lead value (e.g. estimated LTV)' },
        currency: { type: 'string' },
        contentName: { type: 'string', description: 'e.g. "Newsletter signup", "Free consultation request"' },
        contentCategory: { type: 'string' },
        userData: { type: 'object', description: 'See meta_capi_send_event' },
        eventId: { type: 'string' },
        eventSourceUrl: { type: 'string' },
        testEventCode: { type: 'string' },
      },
      required: ['pixelId', 'userData'],
    },
    handler: async (args) => {
      const event = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: buildUserData(args.userData),
        custom_data: {},
      };
      if (args.value !== undefined) event.custom_data.value = args.value;
      if (args.currency) event.custom_data.currency = args.currency;
      if (args.contentName) event.custom_data.content_name = args.contentName;
      if (args.contentCategory) event.custom_data.content_category = args.contentCategory;
      if (args.eventId) event.event_id = args.eventId;
      if (args.eventSourceUrl) event.event_source_url = args.eventSourceUrl;
      const params = { data: JSON.stringify([event]) };
      if (args.testEventCode) params.test_event_code = args.testEventCode;
      return fbPost(`/${args.pixelId}/events`, params);
    },
  },
  {
    name: 'meta_capi_batch_send',
    description: 'Send up to 1000 events in a single call. Efficient for backfills and high-volume tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        events: { type: 'array', items: { type: 'object' }, minItems: 1, maxItems: 1000, description: 'Array of event objects matching meta_capi_send_event input (eventName, eventTime, userData, customData, etc.)' },
        testEventCode: { type: 'string' },
      },
      required: ['pixelId', 'events'],
    },
    handler: async ({ pixelId, events, testEventCode }) => {
      const formatted = events.map(e => {
        const out = {
          event_name: e.eventName,
          event_time: e.eventTime || Math.floor(Date.now() / 1000),
          action_source: e.actionSource || 'website',
          user_data: buildUserData(e.userData || {}),
        };
        if (e.eventId) out.event_id = e.eventId;
        if (e.eventSourceUrl) out.event_source_url = e.eventSourceUrl;
        if (e.customData) {
          out.custom_data = {};
          for (const [k, v] of Object.entries(e.customData)) {
            const snake = k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
            out.custom_data[snake] = v;
          }
        }
        return out;
      });
      const params = { data: JSON.stringify(formatted) };
      if (testEventCode) params.test_event_code = testEventCode;
      return fbPost(`/${pixelId}/events`, params);
    },
  },
  {
    name: 'meta_capi_test_event',
    description: 'Send a test event with a test_event_code. Test events appear in Events Manager > Test Events tab (but do not count as real conversions). Use this to verify your CAPI setup before going live.',
    inputSchema: {
      type: 'object',
      properties: {
        pixelId: { type: 'string' },
        eventName: { type: 'string', default: 'ViewContent' },
        testEventCode: { type: 'string', description: 'Find this code in Events Manager > Test Events tab' },
        userData: { type: 'object', description: 'See meta_capi_send_event' },
      },
      required: ['pixelId', 'testEventCode', 'userData'],
    },
    handler: async ({ pixelId, eventName, testEventCode, userData }) => {
      const event = {
        event_name: eventName || 'ViewContent',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: buildUserData(userData),
        event_source_url: 'https://example.com/test',
      };
      return fbPost(`/${pixelId}/events`, {
        data: JSON.stringify([event]),
        test_event_code: testEventCode,
      });
    },
  },
];
