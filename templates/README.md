# templates/

Files in this directory are **copied into every new micro site** during the bootstrap step. They are not consumed by this repo at runtime.

| File | Purpose |
|---|---|
| `CLAUDE.md` | The self-contained project guidance the new site's Claude reads at session start. Inlines the stack non-negotiables, hard rules, MCP list, **and the 30 coding principles** so default behavior is correct without anyone re-pointing Claude at fe-llm-starter. |
| `.claude/settings.json` | Registers the SessionStart hook so each session checks for starter drift. |
| `.claude/hooks/check-starter-version.sh` | Compares the new site's pinned starter SHA (in `.starter-version`) against the latest fe-llm-starter HEAD; prints a one-line warning if they differ. |
| `.claude/commands/refresh-starter.md` | The `/refresh-starter` slash command that re-fetches these templates from the latest starter and updates CLAUDE.md (preserving the site's own "Site-specific" section). |

When you edit a file in here, every micro site that runs `/refresh-starter` afterward will pick it up. That's the point — this is how rule changes propagate.
