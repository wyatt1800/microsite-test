# Bootstrap a new micro site

## Before you start

Every micro site lives in a GitHub repo named **`microsite-{name}`** under the `1-800Accountant` org (e.g. `microsite-pricing`, `microsite-launch-q3`). Those repos are pre-created with your access already wired in — you don't create them yourself.

Clone the repo and enter it:

```bash
gh repo clone 1-800Accountant/microsite-{name}
cd microsite-{name}
claude
```

Then paste the prompt below. Claude handles **all** the rest — scaffolding, file creation, the initial commit, and the push to `origin/master`. You don't run any `git init`, `git add`, `git commit`, or `git push` yourself.

> Prerequisites: `node` (LTS), `npm`, `git`, `gh` (authenticated via `gh auth login`), and Claude Code installed.

> Optional: if you want these MCPs available to Claude globally (outside any micro site repo), run on your machine:
> ```
> claude mcp add --transport http astro-docs https://mcp.docs.astro.build/mcp
> claude mcp add --transport http zod https://mcp.inkeep.com/zod/mcp
> npx shadcn@latest mcp init --client claude
> ```
> You don't need any of these if you only work inside micro site repos — the project-scoped `.mcp.json` we create below already covers all three.

---

## The prompt

```
Scaffold a new micro site in this already-cloned repo following fe-llm-starter conventions. The repo is named microsite-{name} and already has its remote and access configured — do NOT run `git init` or change the remote.

Use the official docs as the source of truth for install commands and current API:
- Astro: https://docs.astro.build/en/install-and-setup/
- Tailwind on Astro: https://docs.astro.build/en/guides/styling/#tailwind
- MDX on Astro: https://docs.astro.build/en/guides/integrations-guide/mdx/
- AWS Amplify deploy (official Astro guide): https://docs.astro.build/en/guides/deploy/aws/#aws-amplify
- astro-aws-amplify adapter (community): https://github.com/alexnguyennz/astro-aws-amplify
- Astro content collections (for MDX): https://docs.astro.build/en/guides/content-collections/
- shadcn/ui on Astro: https://ui.shadcn.com/docs/installation/astro

Our choices (use these when the docs offer options):
- Package manager: npm (not pnpm/yarn)
- Linting: **oxlint** (https://oxc.rs/docs/guide/usage/linter.html) — install as dev dep, add `lint` script
- Formatting: **oxfmt** (https://oxc.rs/docs/guide/usage/formatter.html) — install as dev dep, add `format` and `format:check` scripts
- Do NOT install ESLint or Prettier. If editor integration matters, document the oxc VS Code extension in the new repo's README.
- Language: **TypeScript only**, strict mode. `tsconfig.json` extends `astro/tsconfigs/strict`. No `.js` files; use `.ts` / `.tsx` / `.astro`.
- Astro template: minimal
- Rendering: **`output: 'static'`** (Astro's default). Install the `astro-aws-amplify` adapter so Actions, API endpoints, and per-page SSR (`export const prerender = false`) work on demand. **Not an SPA** — do not enable Astro's client-side routing / View Transitions SPA mode unless explicitly asked.
- Hosting: **AWS Amplify Hosting**. Install the adapter with `npm install astro-aws-amplify`, then register it in `astro.config.mjs`:
  ```js
  import awsAmplify from 'astro-aws-amplify';
  export default defineConfig({ adapter: awsAmplify() });
  ```
  Create an `amplify.yml` at the repo root following the format in the official Astro AWS deploy guide. The Amplify build environment must set `_CUSTOM_IMAGE=amplify:al2023` so it uses Node 22 (Amplify defaults to Node 16, which is too old for current Astro).
- Server-side work: prefer **Astro Actions** (https://docs.astro.build/en/guides/actions/) for anything called from our own client code (checkout, LLM proxies, form handlers). Use **API endpoints** (`src/pages/api/*.ts`) only for webhooks or public/third-party HTTP surfaces. Scaffold an empty `src/actions/index.ts` exporting `export const server = {};` so the structure is in place from day one.
- **No external API calls from the client.** Every outbound call to a third-party service (checkout, LLM, analytics, anything) must go through one of our own Astro Actions or `src/pages/api/*` endpoints. Client code only calls `actions.<name>(...)` or our own `/api/*` routes — never a vendor URL directly. This keeps API keys, vendor identity, and request shapes off the wire to the browser.
- Validation: **Zod everywhere** — Action inputs, form data, API endpoint bodies, content collection schemas, env vars, third-party API responses. Use the Astro-re-exported `z` (`import { z } from 'astro:schema'` for Actions, `from 'astro:content'` for collections) so versions stay aligned. Scaffold `src/lib/env.ts` that parses `import.meta.env` through a Zod schema once and exports the typed object — import from there instead of touching `import.meta.env` directly.
- Tailwind: install with `npx astro add tailwind` (uses `@tailwindcss/vite` for Tailwind v4). Do NOT install the legacy `@astrojs/tailwind` integration.
- UI components: install **shadcn/ui** with `npx shadcn@latest init -t astro`. This also pulls in the `@astrojs/react` integration (needed by shadcn) and sets up the `@/*` path alias. Components land in `src/components/ui/` — they're owned in-repo, edit freely. Don't install a second component library.
- Do not enable Astro's client-side routing / View Transitions SPA mode unless explicitly asked — pages should be server-rendered per request.
- Folder structure:
  - src/components/  Astro + island components
  - src/layouts/     page shells
  - src/pages/       routes
  - src/content/     MDX collections, with a config.ts defining schemas
  - src/actions/     Astro Actions (index.ts exporting `server`)
  - src/lib/         shared helpers (env.ts with Zod-validated env, etc.)
  - src/styles/      global.css with Tailwind + design-token CSS vars
  - public/          static assets

After scaffolding:
1. Add a minimal BaseLayout.astro that imports global styles and renders <slot />.
2. Add a starter src/pages/index.astro using BaseLayout with a Tailwind hero section.
3. Add `.env.example` listing every env var the site uses with placeholder (not real) values. Add `.env`, `.env.local`, and `.env.*.local` to `.gitignore` (and explicitly allow `.env.example`). Add a project README that documents (a) running locally with `.env` and (b) setting Amplify environment variables per branch (in the Amplify console: App settings → Environment variables, or per-branch under Branch settings). `_CUSTOM_IMAGE=amplify:al2023` must be set as an Amplify build env var. Never put a real secret in any committed file.
   Then install the starter-sync kit from fe-llm-starter (this gives the new site a self-contained CLAUDE.md + a SessionStart hook that flags when fe-llm-starter has new commits + a `/refresh-starter` slash command to pull them in):
   - Get the current starter SHA: `gh api repos/1-800Accountant/fe-llm-starter/commits/master --jq .sha`. Write it (no trailing newline) to `./.starter-version`.
   - Copy `templates/CLAUDE.md` from fe-llm-starter into `./CLAUDE.md`. Fetch with: `gh api repos/1-800Accountant/fe-llm-starter/contents/templates/CLAUDE.md --jq .content | base64 -d > CLAUDE.md`
   - Copy `templates/.claude/` from fe-llm-starter into `./.claude/`. That includes `settings.json` (registers the SessionStart hook), `hooks/check-starter-version.sh`, and `commands/refresh-starter.md`. Fetch each file the same way.
   - `chmod +x .claude/hooks/check-starter-version.sh`.
4. Add a `.mcp.json` at the repo root registering the three MCPs for our stack so Claude (and teammates' Claude) can query live docs without guessing:
   ```json
   {
     "mcpServers": {
       "astro-docs": {
         "type": "http",
         "url": "https://mcp.docs.astro.build/mcp"
       },
       "shadcn": {
         "command": "npx",
         "args": ["shadcn@latest", "mcp"]
       },
       "zod": {
         "type": "http",
         "url": "https://mcp.inkeep.com/zod/mcp"
       }
     }
   }
   ```
   AWS Amplify doesn't publish an MCP server — Claude should fetch the official Astro AWS deploy guide or Amplify console docs when it needs current behavior.
5. Run the dev server and a build to confirm the scaffold works.

Wire in the cross-site defaults:
- **Email**: install `@sendgrid/mail`. Add `SENDGRID_API_KEY` to `.env.example` (non-`PUBLIC_`) and the Zod env schema. Stub `src/actions/sendEmail.ts` (or an entry in `src/actions/index.ts`) showing the server-side send pattern — do NOT add any client-side email logic.
- **Analytics**: add `PUBLIC_GA4_MEASUREMENT_ID` and `PUBLIC_GTM_CONTAINER_ID` to `.env.example` and the Zod env schema. Inject the official GTM snippet (head + noscript body) into `BaseLayout.astro`, reading the container ID from the env module. Each site gets its own GA4 property and GTM container — never reuse another site's.

Do NOT add: a second UI library, state management, a second analytics vendor, auth, or anything else beyond the scaffold. Those come later via recipes/.

After everything is scaffolded:
- Run `npm run build` to confirm the full build works before committing.
- Stage everything, create a single initial commit (`chore: scaffold microsite-{name} from fe-llm-starter`), and push to `origin/master`. Use the user's git identity — do NOT add a Claude co-author trailer.
- Print a short checklist of what was created and the user's next steps:
  1. Fill in `.env` for local dev.
  2. Open the Amplify console → New app → Host web app, connect this repo, pick the `master` branch.
  3. Set `_CUSTOM_IMAGE=amplify:al2023` and the rest of the env vars from `.env.example` (with real values) in App settings → Environment variables, per branch as needed.
  4. `npm run dev` to verify locally.
```

---

## Gotchas

*(Add to this list as we hit them. Keep entries short: symptom → cause → fix.)*

- **`.env` files are gitignored from day one.** If you forget and commit one with real keys, rotating those keys is the only fix — scrubbing git history doesn't help, the keys are already public. Always check `git status` before the first commit of a new site.
- **Tailwind v3 vs v4.** The current Astro integration is the Vite plugin (`@tailwindcss/vite`) for Tailwind v4. Older tutorials still show `@astrojs/tailwind` (v3-era) — that path is deprecated. Always run `npx astro add tailwind` and let it pick the current one.
- **`astro.config.mjs` stays `.mjs`.** Astro's init generates `.mjs` and `npx astro add` edits whatever file exists. Don't rename to `.ts` just to satisfy our "TS only" rule — type it with a JSDoc `@type` comment instead.
- **Static default + Amplify adapter.** Pages are static unless they `export const prerender = false`. Actions and `src/pages/api/*` endpoints run on demand regardless — you don't need to switch global render mode to add one.
- **Amplify defaults to Node 16.** The build will fail with cryptic errors on current Astro unless `_CUSTOM_IMAGE=amplify:al2023` is set in the Amplify env vars (it gives you Node 22). Set this *before* the first deploy.
- **Prerendered (static) pages on Amplify need manual rewrite rules.** The `astro-aws-amplify` adapter generates rules for SSR routes; static routes may need entries added in the Amplify console (Rewrites and redirects) so SPA-style fallback doesn't intercept them. Check this if a static page returns the wrong content after deploy.
- **Custom 404 must be server-rendered.** On Amplify, a prerendered `404.astro` won't be picked up — leave 404 as SSR (`export const prerender = false`).
- **Public static files without an extension** (e.g. `public/healthcheck`) need to live under `public/assets/` per the adapter's notes, or they'll be misrouted.

---

## After bootstrapping

- Add features by pointing Claude at the relevant file in `recipes/`.
- Keep the new repo's `CLAUDE.md` short — it should defer to fe-llm-starter for anything generic.
