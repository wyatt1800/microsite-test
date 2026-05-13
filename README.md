# fe-llm-starter

A Claude Code setup kit for spinning up new micro sites. **This repo contains no application code** — just the conventions, prompts, and config you point Claude at when starting (or working on) a micro site.

## What's in here

- [`stack.md`](stack.md) — the opinionated tech stack every micro site uses (Astro + Vite + Tailwind + MDX + AWS Amplify) and why.
- [`bootstrap.md`](bootstrap.md) — the prompt to paste into Claude in an empty directory to scaffold a new site.
- [`CLAUDE.md`](CLAUDE.md) — general coding principles Claude should follow when working **in this repo** (fe-llm-starter itself).
- [`templates/`](templates/) — files **copied into every new micro site** during bootstrap: the site's `CLAUDE.md`, a SessionStart hook that surfaces drift from this repo, and the `/refresh-starter` slash command that pulls updates back in.
- `recipes/` *(coming soon)* — task-by-task checklists Claude can be pointed at: adding a page, wiring an MDX collection, deploying to Vercel, calling the Claude API from a route, etc.

## How to use it

### Starting a new micro site

Every micro site lives in a GitHub repo named **`microsite-{name}`** under the `1-800Accountant` org. Those repos are pre-created with your access already wired in — don't create them yourself.

```bash
gh repo clone 1-800Accountant/microsite-{name}
cd microsite-{name}
claude
```

Then in Claude, paste the prompt from [`bootstrap.md`](bootstrap.md). Claude scaffolds the project end-to-end (Astro + Tailwind + MDX + Amplify adapter), wires up `.mcp.json` with the Astro/shadcn/Zod MCPs, drops in the self-syncing CLAUDE.md from `templates/`, and pushes the initial commit. You don't run any `git` commands manually.

### Working on an existing micro site

Every site bootstrapped from this repo has a self-contained CLAUDE.md that captures the current non-negotiables, so Claude follows them automatically without you having to point at fe-llm-starter every session.

You'll still find yourself referencing this repo when you want depth: *"check fe-llm-starter/stack.md for the rationale"* or *"follow fe-llm-starter/recipes/new-page.md"*.

### Keeping a micro site current with the starter

When you change `templates/CLAUDE.md` (or anything else under `templates/`) in this repo and push, every micro site automatically detects the drift:

1. The SessionStart hook in each micro site (`.claude/hooks/check-starter-version.sh`) runs at the start of every Claude session and compares the site's pinned SHA (in `.starter-version`) against the latest fe-llm-starter HEAD.
2. If they differ, Claude prints a one-line warning telling the user how many commits behind they are and to run `/refresh-starter`.
3. `/refresh-starter` re-fetches `templates/` from this repo, regenerates the site's CLAUDE.md (preserving its "Site-specific" section), updates the hook and slash command in place, and bumps `.starter-version`.

The hook is silent when there's no drift and never blocks a session — if `gh` isn't installed or the network is down, it just exits 0.

## Working with Claude

A few habits that make these micro sites go faster:

- **Opus for planning, Sonnet for coding.** Switch with `/model opus` when you're starting a new feature, scoping a refactor, or untangling a bug — Opus is better at thinking through the whole problem before code lands. Drop back to `/model sonnet` once the plan is clear and you're executing on it. Sonnet is faster and cheaper for the mechanical work of writing and editing files.
- **Lean on the MCPs.** Every micro site has Astro, shadcn, and Zod MCP servers wired up in `.mcp.json`, so Claude can answer "is this still the current Astro API?" or "what props does this shadcn component take?" without guessing from training data. AWS Amplify doesn't publish an MCP — point Claude at the official Astro AWS deploy guide when deployment questions come up.
- **Point Claude at this repo, not at memory.** When working on a micro site, say "check `fe-llm-starter/stack.md`" or "follow the recipe in `fe-llm-starter/recipes/new-page.md`" rather than re-explaining conventions. That's what this repo is for.

## Contributing

If you find yourself giving Claude the same instructions on multiple micro sites, that's a signal to add a recipe here. Patterns belong in this repo; one-off decisions stay in the individual site's `CLAUDE.md`.
