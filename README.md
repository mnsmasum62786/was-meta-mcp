# WAS Meta MCP

Manage Facebook Ads, Conversions API, Catalogues, Business Manager, and Pixel admin from Claude Desktop, Cursor, or any MCP-compatible client using natural language. 67 tools.

100 percent local. Your credentials stay on your machine. Built by [Abdullah Al Masum](https://webanalyticssolution.com) — Web Analytics Solution (WAS). MIT licensed.

> **Looking for Facebook Pages or Instagram management?** As of v2.0.0, Page + IG tools moved to a companion package: [`was-meta-page-mcp`](https://github.com/mnsmasum62786/was-meta-page-mcp). Same OAuth token works for both — install both side-by-side.

## Prerequisites

| | Required for | How to install |
|---|---|---|
| **Node.js 18+** | running `npx` | Mac: `brew install node` · Windows: https://nodejs.org · Linux: `apt install nodejs npm` |
| **Git** | letting `npx` clone from GitHub | Mac: `brew install git` · Windows: https://git-scm.com · Linux: `apt install git` |
| **A Meta Developer App** | Meta API access — you create your own | Walk-through in Step 1 below |

Verify in your terminal:

```bash
node --version   # should print v18.x or newer
git --version    # should print git version 2.x or newer
```

## Quick start — 3 steps

### Step 1 — Create a Meta Developer App (5–10 min, one-time)

1. Go to https://developers.facebook.com/apps → **Create App** → use case **Other** → Next
2. App type **Business** → name it (e.g. "My Meta MCP") → Create App
3. **App settings → Basic** — copy **App ID** and click **Show** next to **App Secret** (copy it too)
4. **Add Product** → add **Marketing API** (no review needed for basic setup)
5. Open **App Roles** → make sure you're listed as Admin

You now have:
- `META_APP_ID` — the App ID
- `META_APP_SECRET` — the App Secret

### Step 2 — Generate a long-lived user access token (3 min)

1. Open https://developers.facebook.com/tools/explorer/
2. Top-right: select your new app from **Meta App** dropdown
3. Click **Get User Access Token** → check ALL of these permissions:

   ```
   ads_management, ads_read, business_management,
   catalog_management, read_insights
   ```

4. Click **Generate Access Token** → sign in popup → approve all
5. Copy the short-lived token (top field)
6. Open https://developers.facebook.com/tools/debug/accesstoken/ → paste token → **Debug**
7. Click **Extend Access Token** at the bottom → copy the long-lived token

**Important:** If you're the admin of your own app, this long-lived token **never expires**. Save it once and you're done.

> If you ALSO want Page + IG management, add these scopes too when generating the token: `pages_show_list, pages_read_engagement, pages_read_user_content, pages_manage_metadata, pages_manage_posts, pages_messaging, instagram_basic, instagram_manage_comments, instagram_manage_insights, instagram_manage_messages, instagram_content_publish`. Then `npx ... auth` on the companion package `was-meta-page-mcp`.

### Step 3 — Connect with one terminal command

```bash
npx -y github:mnsmasum62786/was-meta-mcp auth
```

The tool asks you to paste:
1. `META_APP_ID` (from Step 1)
2. `META_APP_SECRET` (from Step 1)
3. `META_ACCESS_TOKEN` (the long-lived token from Step 2)

It then validates the token against Graph API, lists your granted permissions, and saves everything to `~/.was-meta-mcp/config.json`.

### Step 4 — Add 4 lines to Claude Desktop config

Open your Claude Desktop config:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "WAS Meta MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-mcp"]
    }
  }
}
```

Quit and reopen Claude. Test:

> "Run meta_quick_stats."

Returns a snapshot of all businesses, ad accounts, etc. you can access.

## Useful commands

```bash
npx -y github:mnsmasum62786/was-meta-mcp           # Start MCP
npx -y github:mnsmasum62786/was-meta-mcp auth      # Connect
npx -y github:mnsmasum62786/was-meta-mcp logout    # Forget
npx -y github:mnsmasum62786/was-meta-mcp status    # Show config
```

## What you can ask Claude

**Ads & insights:**
- "List my Facebook ad accounts"
- "Show last 30 days performance for ad account act_XXX"
- "Pause campaign 123456789"
- "Create a Leads campaign in act_XXX named 'Test Leads' with $20 daily budget, paused status"
- "Get ad set breakdowns by age and gender for campaign 123 in last 7 days"
- "Find 50 keyword interest IDs for 'web analytics'"

**Conversions API:**
- "Send a test Purchase event to pixel 1234567890 with value 99.99 USD, test code TEST123"
- "Send a Lead CAPI event for email john@example.com with content name 'Newsletter signup'"

**Business Manager:**
- "List all my Business Managers"
- "Show ad accounts owned by business 1011638132906044"
- "Who are the users in business 1011638132906044?"

**Catalogs:**
- "List catalogs in business 1011638132906044"
- "Show products in catalog 999999"
- "What are the diagnostic issues with catalog 999999?"

**Pixel admin:**
- "List pixels shared with ad account act_XXX"
- "Create a new pixel called 'WAS Q1 Site' under business 12345"
- "Assign pixel 999 to ad account act_XXX with TASK_ANALYZE"
- "Get event match quality for pixel 999"
- "Create a custom conversion 'High-Value Purchases' filtered to value >= 5000"

**Universal escape hatches:**
- "Use meta_graph_get on path /me/businesses?fields=id,name"
- "Use meta_graph_post on path /act_XXX/campaigns with body {name:'X', objective:'OUTCOME_LEADS', ...}"

## All 67 tools

| Category | Count | Examples |
|---|---|---|
| **Ads** (read + write) | 20 | list_ad_accounts, list_campaigns, create_campaign, update_campaign, get_insights, list_custom_audiences, create_ad, create_creative, upload_image, upload_video, search_targeting |
| **Conversions API** | 5 | send_event, send_purchase, send_lead, batch_send, test_event |
| **Business Manager** | 8 | list_businesses, get_info, list_owned_pages, list_client_ad_accounts, list_users, list_system_users |
| **Catalogues** (read + write) | 15 | list_catalogs, list_products, create_product, batch_upload_products, create_product_set, create_feed, get_diagnostics |
| **Pixel admin** | 9 | create_pixel, update_pixel, list_shared_accounts, assign_to_ad_account, create_custom_conversion, get_event_match_quality, list_custom_conversions |
| **Helpers** | 6 | graph_get, graph_post, graph_delete, whoami, token_info, search |

## How it works

The MCP server runs as a local Node.js process on your machine, spawned by Claude Desktop via stdio. It talks directly from your computer to `graph.facebook.com` using your access token. Nothing routes through any third-party server.

```
Claude Desktop  →  local Node process (your machine)  →  graph.facebook.com
```

Each user uses their own Meta App + own user token. Your API quota is your own.

## Multi-Business-Manager — automatic

The user token is tied to your Facebook account, NOT a single Business Manager. So **any BM you have access to is automatically reachable through one MCP instance.** Just specify the business ID, ad account, or page ID per tool call.

## Security notes

- Credentials live only in `~/.was-meta-mcp/config.json` on your machine with `0600` permissions
- stdio transport — no inbound HTTP port, no network exposure
- Token never expires (as long as you're admin of your own app)
- Revoke at https://facebook.com/settings/?tab=business_tools
- Remove local copy: `npx -y github:mnsmasum62786/was-meta-mcp logout`

## Advanced — env-var override

For multi-account setups, put credentials in Claude Desktop config:

```json
{
  "mcpServers": {
    "Meta — Agency": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-mcp"],
      "env": {
        "META_APP_ID": "your-app-id",
        "META_APP_SECRET": "your-app-secret",
        "META_ACCESS_TOKEN": "token-A"
      }
    },
    "Meta — Personal": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-mcp"],
      "env": {
        "META_APP_ID": "your-app-id",
        "META_APP_SECRET": "your-app-secret",
        "META_ACCESS_TOKEN": "token-B"
      }
    }
  }
}
```

Env vars override the matching field in `~/.was-meta-mcp/config.json`.

## Companion: was-meta-page-mcp

For Facebook Pages + Instagram Business management (posts, scheduled posts, comments with bulk reply/hide, messaging, mentions, reviews, events, IG media, stories, comments, DMs, hashtag search, cross-platform publishing — 48 tools), install:

```bash
npx -y github:mnsmasum62786/was-meta-page-mcp auth
```

Same Meta App, same OAuth token — re-authenticate with the additional `pages_*` and `instagram_*` scopes (see was-meta-page-mcp README) and both packages share credentials transparently.

## Troubleshooting

**"App isn't verified" warning during OAuth** — expected for personal apps. Click **Advanced → Go to <your app> (unsafe)**. Safe because it's your own app.

**"Permission denied" on a specific tool** — your token doesn't have the required scope. Re-extend the token with the missing permission in Graph API Explorer.

**"Insufficient permission to access asset"** — your Facebook account doesn't have access to the requested asset. Check at https://business.facebook.com.

**"Token invalid" error** — your token was revoked. Re-run `auth`.

## License

MIT — see `LICENSE`.

## Credits

By [Abdullah Al Masum](https://webanalyticssolution.com), founder of WAS (Web Analytics Solution). Built for the WAS training community and the wider MCP ecosystem.
