# Changelog

## 2.0.0 — 2026-05-27

**Breaking: scope reduced.** Facebook Pages + Instagram tools have moved to a separate package: [`was-meta-page-mcp`](https://github.com/mnsmasum62786/was-meta-page-mcp). This package now focuses on Ads, Conversions API, Catalogues, Business Manager, and Pixel admin.

**Removed (27 tools — install `was-meta-page-mcp` instead):**
- `meta_page_*` — all Facebook Page tools (posts, insights, comments, messaging, conversations)
- `meta_ig_*` — all Instagram Business tools (media, insights, comments, DMs)

**Fixed:**
- `meta_graph_get` / `meta_graph_post` / `meta_graph_delete` now respect a caller-supplied `access_token` inside `params` (previously was always overwritten with the user token, blocking page-token escape-hatch use)

**Tool count: 95 → 67**

**Migration:** if you used any `meta_page_*` or `meta_ig_*` tool, install the new companion package:

```bash
npx -y github:mnsmasum62786/was-meta-page-mcp auth
```

Both packages share the same Meta App credentials and OAuth token, so the auth flow re-uses what you already have.

## 1.2.0 — 2026-05-24

- Added 9 Pixel admin tools

## 1.1.0 — 2026-05-24

- Added ad-set / ad / creative / upload / targeting + page write tools

## 1.0.0 — 2026-05-24

Initial public release. 58 tools across all 7 Meta surfaces.

- **Marketing API / Ads** (13)
- **Conversions API** (5) — auto SHA-256 hashing of user PII
- **Pages** (9)
- **Business Manager** (8)
- **Catalogs** (8)
- **Instagram** (8)
- **Helpers / Universal** (7) — graph_get/post/delete, whoami, token_info, search, quick_stats
