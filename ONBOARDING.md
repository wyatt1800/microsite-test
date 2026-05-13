Hey — try out our micro-site starter: **https://github.com/1-800Accountant/fe-llm-starter**

**What it is:** a Claude Code setup kit, not a code scaffold. The repo holds the opinionated stack decisions, rules, and templates Claude will use to build a new micro site. No app code lives in it.

**Prereqs:**
- Node LTS + npm
- `git` and the `gh` CLI (`gh auth login`)
- Claude Code (`npm install -g @anthropic-ai/claude-code`)
- Your GitHub account has access to the `microsite-{name}` repo you'll be working in, and to AWS Amplify Hosting for deploys

**To spin up a new micro site:** The repo (named `microsite-{name}`) is already created for you with access wired up. Just:

```bash
gh repo clone 1-800Accountant/microsite-{name}
cd microsite-{name}
claude
```

Then `/model opus`, paste the prompt from **[bootstrap.md](https://github.com/1-800Accountant/fe-llm-starter/blob/master/bootstrap.md)**, and let it run. Claude handles everything — scaffolding, files, the initial commit, and the push. You don't touch git. Once it's done, `/model sonnet` for the actual coding work.

**Read these to understand the rules Claude will follow:**
- **[stack.md](https://github.com/1-800Accountant/fe-llm-starter/blob/master/stack.md)** — the opinionated stack and *why* (Astro static-by-default + per-page SSR, Tailwind v4, shadcn, MDX, Zod everywhere, oxlint/oxfmt, npm, SendGrid for email, GA4+GTM per site, AWS Amplify for hosting)
- **[templates/CLAUDE.md](https://github.com/1-800Accountant/fe-llm-starter/blob/master/templates/CLAUDE.md)** — exactly what gets dropped into your new site's CLAUDE.md (Claude reads this every session in your site)

**A few things worth knowing:**
- Your new site auto-detects when this starter repo has new commits and tells you to run `/refresh-starter` to pull them in. No manual sync.
- Hard rules: no third-party `fetch()` from the client (all vendor calls go through Astro Actions), `.env` is gitignored, Amplify env vars hold real secrets per branch.
- Amplify needs `_CUSTOM_IMAGE=amplify:al2023` set in its build env so it uses Node 22 — otherwise builds fail mysteriously.

DM me with anything that's wrong, confusing, or missing — patterns we hit twice should land in the starter so the next person doesn't.
