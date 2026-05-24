# Changelog

## 1.0.0 — 2026-05-24

Initial public release.

- 58 tools covering all 7 Meta surfaces:
  - **Marketing API / Ads** (13): list_ad_accounts, get_account_summary, list_campaigns, get_campaign, create_campaign, update_campaign, list_adsets, list_ads, get_insights, list_custom_audiences, create_custom_audience, list_pixels, get_pixel_events
  - **Conversions API** (5): send_event, send_purchase, send_lead, batch_send, test_event — auto SHA-256 hashing of user PII
  - **Pages** (9): list_pages, get_info, get_insights, list_posts, create_post, delete_post, list_comments, reply_comment, list_conversations
  - **Business Manager** (8): list_businesses, get_info, list_owned_pages, list_owned_ad_accounts, list_client_pages, list_client_ad_accounts, list_users, list_system_users
  - **Catalogs** (8): list_catalogs, get_info, list_products, get_product, create_product, update_product, delete_product, get_diagnostics
  - **Instagram** (8): list_accounts, get_info, get_insights, list_media, get_media_insights, list_comments, reply_comment, create_post
  - **Helpers / Universal** (7): graph_get, graph_post, graph_delete (escape hatches for any endpoint), whoami, token_info, search, quick_stats
- Bring-your-own Meta App + long-lived user access token (never expires for app admins)
- Auth flow validates token + permissions against Graph API before saving
- Credentials saved to `~/.was-meta-mcp/config.json` (mode 0600)
- Claude Desktop config requires only command + args — no credentials in the config file
- stdio transport — 100% local, no network exposure
- CLI: `was-meta-mcp auth | logout | status | help`
- Cross-platform: Mac, Linux, Windows
