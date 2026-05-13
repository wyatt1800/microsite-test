# Stack

The opinionated stack for every micro site bootstrapped from this repo. Don't deviate without a written reason.

## Choices

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro** | Static by default (`output: 'static'`); opt individual pages into SSR with `export const prerender = false`. The Amplify adapter is installed so server-rendered pages, API endpoints, and Actions all work on demand. Not an SPA. Islands for interactivity. |
| Bundler | **Vite** | Comes with Astro; use Vite plugins, not webpack ones. |
| Styling | **Tailwind CSS v4** | Utility-first. Install via `npx astro add tailwind`, which wires up the `@tailwindcss/vite` plugin. **Do not use the legacy `@astrojs/tailwind` integration** — it's deprecated. |
| UI components | **shadcn/ui** | Install via `npx shadcn@latest init -t astro` (adds the `@astrojs/react` integration, the `@/*` alias, and `src/components/ui/`). Components are owned in-repo, not a runtime dep — copy-paste, edit freely. Use inside `.astro` files for static render; add `client:*` only when interactivity is required. Don't pair with another component library (Radix-direct, Headless UI, MUI, Chakra, etc.). |
| Content | **MDX** | All long-form / marketing content lives in MDX, loaded via Astro content collections. |
| Hosting | **AWS Amplify Hosting** | Use the community [`astro-aws-amplify`](https://github.com/alexnguyennz/astro-aws-amplify) adapter. Per-branch envs via the Amplify console. Set `_CUSTOM_IMAGE=amplify:al2023` in Amplify build env so it uses Node 22 (default is Node 16). |
| Email | **SendGrid** | Send transactional email server-side only via `@sendgrid/mail`. API key is a non-`PUBLIC_` env var. All sends go through an Astro Action — never client-side. |
| Analytics | **GA4 + GTM** | Each site has its **own** GA4 property and GTM container — never shared across micro sites. Inject GTM via the official snippet in `BaseLayout.astro`. Measurement / container IDs live in `PUBLIC_GA4_MEASUREMENT_ID` and `PUBLIC_GTM_CONTAINER_ID`. Don't use a second analytics vendor (Segment, Mixpanel, Plausible) without an explicit reason. |
| Linter | **oxlint** | Oxc's Rust-based linter. Replaces ESLint. Fast enough to run on save / pre-commit. |
| Formatter | **oxfmt** | Oxc's formatter. Replaces Prettier. |
| Language | **TypeScript (strict)** | Required everywhere — `.ts` / `.tsx` / `.astro` with `<script>` blocks typed. Never `.js`. `tsconfig.json` extends `astro/tsconfigs/strict` (or `strictest`). |
| Validation | **Zod** | Single validation library across the whole site — Actions inputs, form submissions, API endpoint bodies, content collection schemas, env vars, third-party API responses. No alternatives (Yup, Valibot, Joi, hand-rolled). |
| Package manager | **npm** | Use `npm` consistently; don't mix in pnpm/yarn lockfiles. |

## Non-negotiables

- **No external API calls from the client.** Client code (browser-side JS, island components, `<script>` blocks) must never `fetch()` a third-party API directly — not the checkout provider, not the LLM provider, not SendGrid, not anything. All outbound calls go through one of our own **Astro Actions** (preferred) or **API endpoints** (for webhooks / non-client callers), which then call upstream from the server.
  - **Why:** keeps third-party URLs, vendor identities, request shapes, and (critically) API keys out of the browser. Lets us swap providers, add caching, rate limiting, auth, or logging in one place. Without this rule, secrets leak and consumers couple to vendor schemas.
  - **How to apply:** if you find yourself writing `fetch('https://api.<vendor>...`)` in a `.tsx`, `.astro` `<script>`, or any code that ships to the browser, stop and add an Action instead. Client code should only call `actions.<name>(...)` or hit our own `/api/*` routes. Even the URL of the upstream API should not appear in any file under `src/components/`, `src/pages/` (client portions), or anything imported into a `client:*` island.
  - Environment variables holding upstream credentials must be **non-`PUBLIC_`** (Astro only exposes `PUBLIC_`-prefixed vars to the client). The Zod env schema in `src/lib/env.ts` should reject any secret-looking key that's accidentally prefixed `PUBLIC_`.
  - **Narrow exception: GA4 + GTM tags.** Loading `googletagmanager.com/gtm.js` from the client is fine — that's the supported install path for the vendor, and the container ID (`PUBLIC_GTM_CONTAINER_ID`) is public by design. This exception covers *only* the official analytics tag snippets. Server-to-server calls to Google APIs (e.g. Measurement Protocol) still go through an Action.
- **Zod for all validation.** Every place untrusted or external data enters the system gets a Zod schema:
  - Action inputs (`defineAction({ input: z.object({...}), ... })`)
  - Form submissions (parse `FormData` through Zod before use)
  - API endpoint request bodies and query params
  - Content collection schemas (`defineCollection({ schema: z.object({...}) })`)
  - Environment variables (parse `import.meta.env` through a Zod schema once at startup; export the typed result)
  - Responses from third-party HTTP APIs we don't control
  Derive TypeScript types with `z.infer<typeof Schema>` — never hand-write a type that duplicates a schema. Astro re-exports Zod as `import { z } from 'astro:content'` and `from 'astro:schema'`; use those re-exports where available so versions stay aligned.
- **TypeScript, always.** No `.js` source files. Exception: `astro.config.mjs` may stay `.mjs` — Astro's init generates it that way and `npx astro add` edits it in place; renaming breaks those flows. Type it via JSDoc (`/** @type {import('astro').AstroUserConfig} */`). No `any` except at boundaries with untyped third-party code, and even then prefer `unknown` + a narrowing function. No `@ts-ignore` — use `@ts-expect-error` with a reason.

## Why these (and not the alternatives)

- **oxlint + oxfmt over ESLint + Prettier** — orders of magnitude faster, single toolchain from Oxc, no plugin sprawl. We accept that rule coverage is narrower than ESLint's ecosystem in exchange for speed and simplicity. If a rule we care about is missing, document it as a manual review item rather than dragging ESLint back in.
- **Astro over Next.js** — Astro ships zero JS by default, treats MDX as first-class content, and lets us drop interactive islands in where actually needed.
- **Static-by-default, SSR-per-page** — most micro site pages are marketing content that's perfectly cacheable. Request-time logic (checkout, LLM calls, personalization) lives in **Actions** and **API endpoints**, both of which run server-side regardless of page render mode. So `output: 'static'` with selective `prerender = false` on the rare dynamic page gives us speed without losing dynamic capability. This matches Astro's own recommendation.
- **Not an SPA** — we want fast first paint, minimal JS, and crawlable HTML. Don't enable Astro's client-side routing / View Transitions SPA mode by default.
- **MDX over plain Markdown** — we need to embed components (CTAs, forms, demos) inside content without leaving the editor flow.
- **Tailwind over CSS Modules / vanilla-extract** — fastest iteration, easiest for Claude to generate consistently, design tokens live in one config file.
- **shadcn/ui over a packaged component library** — components are copied into the repo, so we can edit them freely and there's no runtime dependency to upgrade. Tailwind-native styling means design tokens flow through cleanly. Accept that we pull in React (via `@astrojs/react`) as the trade for the catalog; keep React out of pages that don't need it by avoiding `client:*` directives where static HTML is enough.
- **AWS Amplify Hosting over Vercel / SST / containers** — for *many* small Git-connected micro sites, Amplify scales linearly without per-site infra ownership: connect a repo, get managed CI/CD, per-branch preview environments, per-branch env vars. SST is great for a handful of apps where you want infra control, but at N micro sites it becomes N CloudFormation stacks, N OIDC roles, N upgrade PRs. Containerized hosting loses the static/CDN benefit. The trade-off vs Vercel is honest: SSR support is a community adapter (`astro-aws-amplify`), AWS lags on framework features, and CloudWatch logs are clunkier than Vercel's. We accept those because the per-site overhead matters more across many sites.
- **SendGrid for email** — existing org account and templates. Always sent server-side from an Action; API key never reaches the browser.
- **GA4 + GTM per site (not shared)** — each micro site is independently measurable, can be handed off without untangling shared containers, and tag changes on one site never affect another. The trade-off (no cross-site rollups out of the box) is acceptable for marketing-shaped micro sites.

## Version policy

Pin to the latest stable major of each at scaffold time. Don't mix majors across sites without updating this file.

## Server-side work: Actions and endpoints

Two ways to run code on the server. Pick the right one:

- **[Astro Actions](https://docs.astro.build/en/guides/actions/)** (`src/actions/index.ts`) — **default for anything called from our own client code**: checkout submissions, LLM proxies, form handlers, auth flows. Type-safe end-to-end, Zod input validation, `ActionError` for standardized error handling, no manual `fetch()` boilerplate. Stable since Astro 4.15.
- **[API endpoints](https://docs.astro.build/en/guides/endpoints/)** (`src/pages/api/*.ts`) — only when you need a raw HTTP endpoint: webhooks, third-party callbacks, public REST surface, anything consumed by something other than our own frontend.

Both work with `output: 'static'` because the Amplify adapter is installed. You don't need to flip the global render mode just to add an Action or endpoint.

## Living docs via MCP

Every micro site ships a `.mcp.json` registering three MCP servers:

- **[Astro Docs MCP](https://mcp.docs.astro.build/mcp)** — live Astro API/integration docs.
- **[shadcn/ui MCP](https://ui.shadcn.com/docs/mcp)** — browse the shadcn registry, look up component APIs, and install components by name.
- **[Zod MCP](https://zod.dev/)** — search Zod docs. No auth.

Claude should consult these instead of relying on training data. When unsure about anything in a recent Astro / shadcn / Zod release, ask the MCP.

AWS Amplify, Tailwind, SendGrid, GTM/GA4, and MDX don't publish official MCPs or `llms.txt` files. For those, fetch the official docs rather than guessing. Zod publishes [`zod.dev/llms.txt`](https://zod.dev/llms.txt) as a fallback for non-MCP contexts.

## When to break the rules

If a micro site genuinely needs something outside this stack (heavy app-like interactivity, SSR-only auth flows, etc.), it's probably not a micro site — push back on the scope before swapping the stack.
