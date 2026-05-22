# W9Helper

Microsite for [w9helper.com](https://w9helper.com) — generate and understand your W-9 form in minutes.

Bootstrapped from [fe-llm-starter](https://github.com/1-800Accountant/fe-llm-starter). See [stack.md](https://github.com/1-800Accountant/fe-llm-starter/blob/master/stack.md) for architectural decisions.

## Local development

1. Copy `.env.example` to `.env` and fill in real values:
   ```sh
   cp .env.example .env
   ```
2. Install dependencies and start the dev server:
   ```sh
   npm install
   npm run dev
   ```

## Amplify environment variables

Set the following in the Amplify console under **App settings → Environment variables** (or per-branch under **Branch settings**):

| Variable | Description |
|---|---|
| `_CUSTOM_IMAGE` | **Required.** Set to `amplify:al2023` so Amplify uses Node 22. |
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement ID for this site. |
| `PUBLIC_GTM_CONTAINER_ID` | GTM container ID for this site. |
| `SENDGRID_API_KEY` | SendGrid API key — server-side only. |

> **Never** put a real secret in any committed file. If you accidentally commit a secret, rotate the key immediately.

## Editor integration

This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) instead of ESLint/Prettier. Install the [OXC VS Code extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) for in-editor linting and formatting.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint with oxlint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with oxfmt |
| `npm run format:check` | Check formatting without writing |
