# Yahavi Godrail

A full-featured social media management platform — schedule, publish, and analyze content across Twitter/X, Instagram, LinkedIn, Facebook, Pinterest, TikTok, and YouTube. Built as a professional alternative to Publer.io.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/yahavi-godrail run dev` — run the frontend (PORT + BASE_PATH required)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Routing: wouter

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (workspaces, social_accounts, posts, media_assets, labels)
- `artifacts/api-server/src/routes/` — Express route handlers (workspaces, accounts, posts, media, labels, analytics, dashboard)
- `artifacts/yahavi-godrail/src/pages/` — React pages (Dashboard, Posts, Calendar, Accounts, Analytics, Media, Labels)
- `artifacts/yahavi-godrail/src/components/layout/AppLayout.tsx` — App shell with sidebar navigation
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Auto-generated Zod validation schemas (do not edit)

## Architecture decisions

- Contract-first API design: OpenAPI spec → codegen → typed hooks + Zod schemas on both frontend and backend
- Social account platform stored as a text enum in the DB (twitter, facebook, instagram, linkedin, pinterest, tiktok, youtube)
- Post account/media/label associations stored as comma-separated IDs (simple, no junction tables)
- All analytics computed server-side from posts data (no separate analytics table needed at this scale)
- Workspace 1 ("Yahavi Brand") is the default workspace used across all pages

## Product

- **Dashboard** — live overview with KPI cards (total/scheduled/published/draft posts), upcoming post queue, top connected accounts
- **Posts** — filterable list by status/account/label, full post CRUD, publish-now and duplicate actions
- **Calendar** — monthly grid calendar showing posts per day by schedule date
- **Accounts** — connected social media profiles with follower counts and post activity
- **Analytics** — engagement summary (likes, comments, shares, reach), time-series chart, top-performing posts
- **Media Library** — image/video/GIF asset gallery with type filtering
- **Labels** — color-coded content tags for organizing posts

## User preferences

- Platform name: Yahavi Godrail
- GitHub repo: https://github.com/gaganchauhan1997/yahavi-godrail

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change before touching frontend code
- Do NOT rename the OpenAPI `info.title` — it controls generated filenames
- Body schemas in OpenAPI must use entity-shaped names (e.g., `PostInput`, not `CreatePostBody`) to avoid TS2308 collisions
- The frontend workflow requires both PORT and BASE_PATH env vars (provided by artifact.toml)
- Seeded data: workspace IDs 1 (Yahavi Brand) and 2 (Client: TechNova), 6 social accounts, 9 posts, 6 labels

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API base path is `/api` — all routes are mounted under this prefix
