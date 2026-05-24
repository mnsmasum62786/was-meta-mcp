# WAS Meta MCP

Manage Facebook Ads, Conversions API, Pages, Business Manager, Catalogs, and Instagram from Claude Desktop, Cursor, or any MCP-compatible client using natural language. 58 tools cover all 7 Meta surfaces.

100 percent local. Your credentials stay on your machine. Built by [Abdullah Al Masum](https://webanalyticssolution.com) — Web Analytics Solution (WAS). MIT licensed.

## Prerequisites

| | Required for | How to install |
|---|---|---|
| **Node.js 18+** | running `npx` | Mac: `brew install node` · Windows: https://nodejs.org · Linux: `apt install nodejs npm` |
| **Git** | letting `npx` clone from GitHub | Mac: `brew install git` (or first `git --version` triggers Xcode tools) · Windows: https://git-scm.com · Linux: `apt install git` |
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
   pages_show_list, pages_read_engagement, pages_manage_metadata,
   pages_manage_posts, pages_read_user_content, pages_messaging,
   pages_manage_engagement, catalog_management,
   instagram_basic, instagram_content_publish,
   instagram_manage_comments, instagram_manage_insights,
   read_insights
   ```

4. Click **Generate Access Token** → sign in popup → approve all
5. Copy the short-lived token (top field)
6. Open https://developers.facebook.com/tools/debug/accesstoken/ → paste token → **Debug**
7. Click **Extend Access Token** at the bottom → copy the long-lived token

**Important:** If you're the admin of your own app (which you are, since you created it), this long-lived token **never expires**. Save it once and you're done.

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

Paste this block (merge with any existing `mcpServers`):

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

Fully quit Claude (Cmd+Q on Mac, fully exit on Windows) and reopen. In a new chat:

> "Run meta_quick_stats."

Returns a snapshot of all businesses, pages, ad accounts, and Instagram accounts you can access.

## Useful commands

```bash
npx -y github:mnsmasum62786/was-meta-mcp           # Start the MCP server
npx -y github:mnsmasum62786/was-meta-mcp auth      # Connect / re-connect
npx -y github:mnsmasum62786/was-meta-mcp logout    # Delete the saved credentials
npx -y github:mnsmasum62786/was-meta-mcp status    # Show config + permissions
npx -y github:mnsmasum62786/was-meta-mcp help      # Usage
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

**Pages:**
- "List all my Facebook Pages"
- "Show last 30 days insights for page 5555555555"
- "Get the 10 most recent posts on page 5555555555"
- "What comments are on post X?"

**Business Manager:**
- "List all my Business Managers"
- "Show ad accounts owned by business 1011638132906044"
- "Who are the users in business 1011638132906044?"

**Catalogs:**
- "List catalogs in business 1011638132906044"
- "Show products in catalog 999999"
- "What are the diagnostic issues with catalog 999999?"

**Instagram:**
- "List my Instagram Business accounts"
- "Show insights for IG account 17841440000000"
- "Get insights for the latest 10 IG posts on account 17841440000000"

**Universal escape hatches** (when no specialized tool exists):
- "Use meta_graph_get on path /me/businesses?fields=id,name"
- "Use meta_graph_post on path /act_XXX/campaigns with body {name:'X', objective:'OUTCOME_LEADS', ...}"

## All 58 tools

| Category | Count | Examples |
|---|---|---|
| **Ads** | 13 | list_ad_accounts, list_campaigns, create_campaign, get_insights, list_custom_audiences |
| **Conversions API** | 5 | send_event, send_purchase, send_lead, batch_send, test_event |
| **Pages** | 9 | list_pages, get_info, get_insights, create_post, list_comments, reply_comment |
| **Business Manager** | 8 | list_businesses, list_owned_pages, list_client_ad_accounts, list_users |
| **Catalogs** | 8 | list_catalogs, list_products, create_product, update_product, get_diagnostics |
| **Instagram** | 8 | list_accounts, get_insights, list_media, list_comments, create_post |
| **Helpers** | 7 | graph_get, graph_post, graph_delete, whoami, token_info, search, quick_stats |

## How it works

The MCP server runs as a local Node.js process on your machine, spawned by Claude Desktop via stdio. It talks directly from your computer to `graph.facebook.com` using your access token. Nothing routes through any third-party server.

```
Claude Desktop  →  local Node process (your machine)  →  graph.facebook.com
```

Each user uses their own Meta App + own user token. Your API quota is your own.

## Multi-Business-Manager — automatic

The user token is tied to your Facebook account, NOT a single Business Manager. So **any BM you have access to is automatically reachable through one MCP instance.** Just specify the business ID, ad account, or page ID per tool call.

If you want isolated connectors per BM (e.g. one labeled "Meta — Personal", another "Meta — Agency"), put each as a separate `mcpServers` entry with its own token in the `env` block. See `Advanced` below.

## Security notes

- Credentials live only in `~/.was-meta-mcp/config.json` on your machine with `0600` permissions
- stdio transport — no inbound HTTP port, no network exposure
- Token never expires (as long as you're admin of your own app)
- Revoke at https://facebook.com/settings/?tab=business_tools (revokes the app's access)
- Remove local copy: `npx -y github:mnsmasum62786/was-meta-mcp logout`

## Advanced — env-var override

For multi-account setups, put credentials in Claude Desktop config instead of (or in addition to) the config file:

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

## Troubleshooting

**"App isn't verified" warning during OAuth** — expected for personal apps. Click **Advanced → Go to <your app> (unsafe)**. Safe because it's your own app.

**"Permission denied" on a specific tool** — your token doesn't have the required scope. Re-extend the token with the missing permission in Graph API Explorer.

**"Insufficient permission to access asset"** — your Facebook account doesn't have access to the requested Page/ad account/business. Check at https://business.facebook.com.

**"Token invalid" error** — your token was revoked. Re-run `auth`.

**Need to publish to Instagram?** — re-extend your token with `instagram_content_publish` scope (it's not always granted by default).

## License

MIT — see `LICENSE`.

## Credits

By [Abdullah Al Masum](https://webanalyticssolution.com), founder of WAS (Web Analytics Solution). Built for the WAS training community and the wider MCP ecosystem.
