---
description: Pull the latest fe-llm-starter guidance into this site's CLAUDE.md and supporting files
---

Refresh this micro site against the latest [fe-llm-starter](https://github.com/1-800Accountant/fe-llm-starter).

Do these steps in order:

1. **Preserve site-specific content.** Read the current `./CLAUDE.md` and extract everything from the `## Site-specific` heading to the end of the file. That section must survive verbatim.

2. **Fetch the latest from fe-llm-starter** using `gh` (works for private repos):
   - Latest SHA: `gh api repos/1-800Accountant/fe-llm-starter/commits/master --jq .sha`
   - Template CLAUDE.md: `gh api repos/1-800Accountant/fe-llm-starter/contents/templates/CLAUDE.md --jq .content | base64 -d`
   - Hook script: `gh api repos/1-800Accountant/fe-llm-starter/contents/templates/.claude/hooks/check-starter-version.sh --jq .content | base64 -d`
   - Slash command (this file): `gh api repos/1-800Accountant/fe-llm-starter/contents/templates/.claude/commands/refresh-starter.md --jq .content | base64 -d`
   - Hook settings: `gh api repos/1-800Accountant/fe-llm-starter/contents/templates/.claude/settings.json --jq .content | base64 -d`

3. **Write the new CLAUDE.md**: the freshly fetched template, with the preserved Site-specific section appended (replacing the empty placeholder under that heading).

4. **Overwrite** `.claude/hooks/check-starter-version.sh`, `.claude/commands/refresh-starter.md`, and `.claude/settings.json` with the latest versions. Re-apply `chmod +x .claude/hooks/check-starter-version.sh`.

5. **Update `.starter-version`** to the new SHA (no trailing newline).

6. **Summarize for the user**:
   - SHA bumped from `<old-short>` to `<new-short>`.
   - List the commits in between: `gh api "repos/1-800Accountant/fe-llm-starter/compare/<old>...<new>" --jq '.commits[].commit.message' | head -20`
   - Call out any rule change in the new CLAUDE.md the user should know about (diff old vs new templates, focus on Hard rules / Non-negotiables).
   - Remind them their Site-specific section was preserved.

If `gh` is not authenticated or the network is unavailable, stop and tell the user — do not silently leave the site in an inconsistent state.
