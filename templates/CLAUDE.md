# Claude project guidance

This site was bootstrapped from [fe-llm-starter](https://github.com/1-800Accountant/fe-llm-starter). The starter version this site is pinned to lives in `.starter-version`. If the SessionStart hook tells you the starter has new commits, run `/refresh-starter` to pull the latest rules into this file.

## Stack (non-negotiable)

- **Astro** with `output: 'static'` (default). Pages opt into SSR with `export const prerender = false`. Deployed to **AWS Amplify Hosting** via the community [`astro-aws-amplify`](https://github.com/alexnguyennz/astro-aws-amplify) adapter. Amplify defaults to Node 16; the env var `_CUSTOM_IMAGE=amplify:al2023` must be set in the Amplify console to get Node 22. Not an SPA — do not enable View Transitions client-side routing.
- **TypeScript strict** everywhere. No `.js` source files (exception: `astro.config.mjs` may stay `.mjs` with JSDoc typing — `npx astro add` workflows depend on it). No `any` (prefer `unknown` + narrowing). No `@ts-ignore` — use `@ts-expect-error` with a reason.
- **Tailwind v4** via `@tailwindcss/vite` (`npx astro add tailwind`). Never the legacy `@astrojs/tailwind` integration.
- **shadcn/ui** for components, installed with `npx shadcn@latest init -t astro`. Components live in `src/components/ui/` and are owned in-repo. Don't add a second component library.
- **MDX** via `@astrojs/mdx`, loaded through Astro content collections (`src/content/<collection>/`) with Zod schemas in `src/content/config.ts`.
- **Zod for ALL validation:** Action inputs, form submissions, API endpoint bodies, content collection schemas, env vars, third-party API responses. Derive TS types with `z.infer<typeof Schema>` — never hand-write a duplicate. Use Astro's re-exports (`import { z } from 'astro:schema'` for Actions, `from 'astro:content'` for collections).
- **oxlint + oxfmt** for lint and format. Never install ESLint or Prettier.
- **npm** as the package manager. Don't introduce pnpm or yarn lockfiles.

## Hard rules

- **Secrets and environment variables.**
  - **`.env` is local-only and never committed.** `.gitignore` must list `.env`, `.env.local`, `.env.*.local` and exclude `.env.example`. If you find a `.env` tracked by git, stop and remove it from history; rotate any keys that were exposed.
  - **`.env.example` is the only env file in the repo.** It lists every variable name the site uses with safe placeholder values (`SENDGRID_API_KEY=replace-me`, never a real key). Add a row whenever you add a new env var — don't make the next dev guess.
  - **Local dev** reads from `.env` (Astro/Vite load it automatically). **Staging and production** read from **AWS Amplify environment variables**, set per branch in the Amplify console (App settings → Environment variables, with per-branch overrides under Branch settings). Never put production secrets in `.env`, never put dev-only values in Amplify.
  - **`PUBLIC_*` vars are public.** Astro inlines them into client bundles. Anything sensitive (API keys, signing secrets, DB URLs, webhook secrets) must NOT be prefixed `PUBLIC_`. The Zod env schema in `src/lib/env.ts` should reject any secret-looking var that's accidentally prefixed.
  - **All env access goes through `src/lib/env.ts`.** That file parses `import.meta.env` once through a Zod schema at startup and exports the typed result. Other code imports from there — never reach for `import.meta.env` or `process.env` directly.
  - **Never paste real secrets** into commit messages, PR descriptions, Slack, chat with Claude, or screenshots. Treat the chat log as public. If Claude needs to see a value to debug, paste a redacted version or use a fake.
  - **If a secret leaks** (committed by accident, posted somewhere, exposed in a log): rotate the key first, then clean up the artifact. Order matters — the leak is already public; rotation is the only mitigation.
- **No external API calls from the client.** Client code (browser JS, island components, `<script>` blocks, anything imported into a `client:*` island) must never `fetch()` a third-party API directly — not the checkout provider, not the LLM provider, not SendGrid, not anything. All outbound vendor calls go through an **Astro Action** (preferred) or an **API endpoint** (`src/pages/api/*.ts`) which then calls upstream from the server. Client code calls only `actions.<name>(...)` or our own `/api/*` routes. Upstream URLs and keys must never appear in client-bound code.
  - **Narrow exception:** loading `googletagmanager.com/gtm.js` via the official GTM snippet is allowed. Server-to-server Google calls (e.g. Measurement Protocol) still go through an Action.
- **Server-side work uses Astro Actions first** (`src/actions/index.ts`, `defineAction()` with Zod inputs). Use API endpoints (`src/pages/api/*.ts`) only for webhooks and other non-client HTTP callers.
- **Secrets are non-`PUBLIC_` env vars.** Astro exposes `PUBLIC_*` to the browser; anything sensitive must not be prefixed. Env is parsed once in `src/lib/env.ts` via a Zod schema; import the typed env from there — never touch `import.meta.env` directly elsewhere.
- **Email** uses SendGrid (`@sendgrid/mail`), sent server-side from an Astro Action. `SENDGRID_API_KEY` is non-`PUBLIC_`.
- **Analytics** is GA4 + GTM. This site has its own GA4 property and GTM container — never shared with another micro site. IDs are `PUBLIC_GA4_MEASUREMENT_ID` and `PUBLIC_GTM_CONTAINER_ID`, injected via the official GTM snippet in `BaseLayout.astro`.

## Coding principles

Apply these to all code in this repo. They override personal style and any pattern lifted unmodified from docs.

1. **Composed Method.** Divide every function into sub-functions that each perform one identifiable task. Keep all operations in a method at the same level of abstraction. This naturally produces many small methods, each a few lines long.
2. **Intention-Revealing Names.** Name methods/functions after what they accomplish, never how they accomplish it. A reader should understand the purpose of a call without reading its body.
3. **Replace Comments with Clear Code.** If a comment restates what the code does, delete it. If you can't delete a comment, refactor the code (extract a well-named function, rename a variable) until the comment is redundant. Reserve comments for *why*, not *what*.
4. **Constructor Clarity.** Provide factory functions or constructors that create well-formed instances. Pass all required parameters upfront so callers never receive half-initialized objects.
5. **Single Responsibility for Methods.** Each method should have exactly one reason to change. If a method requires a paragraph to explain, it is doing too much.
6. **Say Things Once and Only Once.** Every piece of knowledge or logic should exist in exactly one place. Duplicate code is a multiple-update liability — extract it.
7. **Behavior Over State.** Get the behavior (public interface) right first. Internal representation can always change later if it's hidden behind a clean API. Optimizing data layout prematurely couples consumers to implementation details.
8. **Intention-Revealing Selectors / Function Names.** Name functions after the concept they represent, not the algorithm they use. `includes(item)` is better than `linearSearchFor(item)`. Imagine a second, very different implementation — would you give it the same name? If not, generalize.
9. **Guard Clauses Over Deep Nesting.** Handle edge cases and error conditions at the top of a function and return early. The main logic path should read without indentation.
10. **Query Methods Return; Commands Mutate.** Separate functions that answer questions (return a value, no side effects) from functions that change state. Name query methods with `is`, `has`, `can` prefixes for booleans.
11. **Explaining Variables.** When a complex expression is hard to read, assign its result to a well-named local variable. The variable name becomes the explanation.
12. **Role-Suggesting Names.** Name variables after the role they play, not their type. `employees` not `employeeList`; `query` not `queryString`. The type can be inferred from context.
13. **Use Polymorphism Instead of Conditionals.** When the same if/switch structure appears in multiple places, replace it with polymorphic objects that each implement one branch. Adding a new case becomes adding a new class, not editing existing code.
14. **Delegate, Don't Inherit (Prefer Composition).** Share implementation by passing work to a collaborator object rather than subclassing. Delegation keeps the two objects independently replaceable and avoids deep inheritance hierarchies.
15. **Method Object for Complex Logic.** When a method has grown huge and shares many temporaries, extract the entire computation into its own class. Turn parameters and temporaries into instance fields, put the logic in a `compute()` / `call()` method, then simplify with Composed Method.
16. **Execute Around (Resource Bracketing).** When two actions must always happen together (open/close, lock/unlock, setup/teardown), expose a single function that accepts a callback. The caller never forgets the second action.
17. **Explicit Initialization.** Initialize all state at construction time. Never rely on callers to set fields in the right order after creation. If defaults exist, set them in the constructor.
18. **Lazy Initialization.** When computing or fetching a value is expensive and may not be needed, defer it to first access. Cache the result in a field and return it on subsequent calls.
19. **Constant Methods / Named Constants.** Replace magic literals with named constants or zero-argument methods. `MAX_RETRIES` communicates more than `5`, and a method lets subclasses override the value.
20. **Indirect Variable Access (Encapsulate Fields).** Access instance fields through getter/setter methods rather than directly. This gives you a single place to add validation, logging, lazy init, or change notification later.
21. **Collection Accessor Safety.** Never return a raw mutable collection from a getter. Return a copy, an immutable view, or expose only domain-specific add/remove/enumerate methods.
22. **Equality and Hashing Contract.** If you override equality, override hashing to match. Objects that are equal must produce the same hash. Base both on the same set of fields.
23. **Mediating Protocol.** When two objects collaborate heavily, make the set of messages between them explicit and consistent. Name them coherently so a third party can implement the same interface.
24. **Double Dispatch for Cross-Type Operations.** When behavior depends on the types of two objects (not just the receiver), use double dispatch: the receiver calls back the argument with a more specific method, including its own type in the name.
25. **Pluggable Behavior Over Subclass Explosion.** When many subclasses differ in only one or two methods, replace the hierarchy with a single class that accepts a strategy (callback, lambda, or strategy object). Reserve subclassing for genuinely different families of behavior.
26. **Collecting Parameter.** When multiple sub-methods need to contribute to a single result collection, pass the collection as a parameter rather than concatenating return values or stashing state in a field.
27. **Interesting Return Values Only.** A method should return a value only when the caller needs it. Don't return `self` or internal state by default — return something meaningful or nothing at all. Make return values intentional.
28. **Reversing Method for Readable Flow.** If sending messages to multiple receivers in sequence breaks readability, add a convenience method on the parameter so all calls flow through one object. Readable left-to-right flow matters.
29. **Debug Printing for Developer Ergonomics.** Override `toString` / `__repr__` / `inspect` to show the structural information a developer needs when debugging. User-facing display strings are a separate concern.
30. **Adopt Patterns Incrementally.** Don't try to apply all rules at once. Write code, notice friction, then apply the pattern that resolves it. Patterns are refactoring targets, not upfront mandates. Clean up as you go.

## MCP servers

`.mcp.json` registers three MCP servers. Prefer querying these over training data:

- `astro-docs` — Astro APIs, integrations, config.
- `shadcn` — component registry, install commands, prop signatures.
- `zod` — Zod docs.

AWS Amplify, Tailwind, SendGrid, GTM/GA4, and MDX don't publish official MCPs. For those, fetch the official docs (Astro's AWS deploy guide for Amplify) rather than guessing.

## When in doubt

Read [`stack.md` in fe-llm-starter](https://github.com/1-800Accountant/fe-llm-starter/blob/master/stack.md) for the full rationale on any of the above, or run `/refresh-starter` to update this file from the latest version.

---

## Site-specific

<!--
This site's own deviations, decisions, and exceptions go below this line.
`/refresh-starter` preserves everything from this heading down. Everything above
is regenerated from the starter template — don't edit it; edit the starter
instead so all sites get the change.
-->
