# AGENTS.md

This document provides instructions for agentic coding agents working in this repository.

## Project Overview

Fluxta OBS is a [Fluxta](https://fluxta.app) plugin that drives OBS Studio over obs-websocket (through `obs-websocket-js`). Its Actions switch Scenes, start and stop the Stream and the Recording, show and hide Sources, mute Inputs and set their volume, enable and disable Filters, control Media Inputs and take screenshots; its Events and Value Sources report what happens in OBS back to Fluxta. One plugin drives any number of OBS instances, one per configured **Connection** (see `CONTEXT.md`).

It is a pnpm workspace (turbo) of three TypeScript packages. The Plugin API it builds against — `@fluxta/sdk` and the `fluxta` CLI from `@fluxta/cli` — is owned by Fluxta, not by this repo (see [Working against Fluxta](#working-against-fluxta)).

## Commands

### Setup

```bash
pnpm install     # Node ≥ 22, the pnpm version pinned in package.json
```

### Development & Build

```bash
pnpm build       # wipe dist/ and build the editors and the sidecar into dist/obs/
pnpm dev         # build the editors once, then watch both apps
pnpm typecheck   # tsc --noEmit in every package
pnpm test        # vitest in apps/plugin and packages/protocol
```

### Target a specific package

```bash
pnpm --filter fluxta-obs-plugin test
pnpm --filter obs-protocol test
pnpm --filter fluxta-obs-editor build
```

### Run it in Fluxta

`dist/obs/` is the build folder Fluxta loads (see Fluxta's [Development](https://fluxta.app/docs/plugins/getting-started/development) guide). With Fluxta running:

```bash
pnpm exec fluxta link dist/obs   # once: a development link to this build
pnpm dev                         # every successful sidecar build runs `fluxta restart`
pnpm exec fluxta link --status   # what is linked
pnpm exec fluxta unlink          # back to the installed package
```

Editor-only rebuilds restart nothing — reopen the editor in Fluxta to see them. The sidecar logs to `dist/obs/logs/obs.log`; `pnpm build` wipes `dist/` and the log with it. A crashed sidecar is not restarted until the next build or `fluxta restart`.

## Architecture

### Packages

- `apps/plugin` (`fluxta-obs-plugin`) — the Plugin sidecar: the Node.js process Fluxta starts. tsdown bundles it into `dist/obs/index.mjs` and copies `manifest.json` and `icons/` beside it.
- `apps/editor` (`fluxta-obs-editor`) — the editors, React + Vite + Tailwind, built into `dist/obs/editor/`: the Plugin Editor (`plugin.html`, the Connections list in Fluxta's settings) and one Action Editor per Action.
- `packages/protocol` (`obs-protocol`) — what the sidecar and the editors share: the editor ↔ sidecar messages (`messages.ts`, each an object with an `event` discriminant, checked with zod), the Connection draft and its validation (`connection.ts`), every Action's settings type (`actions.ts`) and the picker modes (`picker.ts`). Consumed as TypeScript source; it has no build.

### Plugin sidecar (`apps/plugin/src`)

```
index.ts          composition root: store + service, every registration, editor messages, connect()
plugin.ts         the single `Plugin` instance from @fluxta/sdk/api
connections/      the Connection lifecycle
  store.ts          the persisted Connection list — the only writer of Plugin Settings
  service.ts        one ObsSession per Connection, reconciled from settings
  session.ts        one obs-websocket link: reconnects forever (backoff.ts), turns OBS events into callbacks
  resolve.ts        which Connection an Action or Value Source acts on
obs/              thin functions over obs-websocket requests, one file per OBS area — the only code that calls obs.call()
actions/          one StandaloneAction per manifest Action, file named after its `type`
events/           one file per manifest Event: its `type`, its payload type, a to…Payload mapping
sources/          Value Sources (query sources) — `key`, resolve against the live OBS
options/          Options Sources behind pickers and operands (connections, scenes, inputs, filters …)
```

An OBS event travels `session.ts` (`obs.on(...)`) → `service.ts` (adds the Connection id) → `index.ts` (`plugin.emitEvent`).

### Editors (`apps/editor`)

- One HTML entry per editor at the package root, each mounting `src/<editor>/main.tsx`. Fluxta never tells an editor which Action it edits — it only serves the path the manifest names — so every Action Editor is its own page. `vite.config.ts` picks up every `*.html` on its own.
- Editors are built from Fluxta's [UI Kit](https://fluxta.app/docs/plugins/reference/ui-kit) (`@fluxta/sdk/ui`: `ActionEditorProvider`, fields, rows, dialogs) and fetch live lists (Scenes, Sources, Inputs, Filters) from the sidecar through `obs-protocol` messages.
- `src/shared/` holds what several editors use: the Connection select, live pickers (`useLiveLists.ts`), mode selects.

## Key Conventions

- **Manifest and code change together.** `manifest.json` declares every Action, Event (with its Event Fields), Value Source and Options Source, and the code registers exactly those, by the same `type` / `key`. Adding an Action means: its manifest entry, `apps/plugin/src/actions/<type>.ts`, its registration in `index.ts`, its settings type in `obs-protocol`, `apps/editor/<type>.html` and `apps/editor/src/<type>/`. Adding an Event means: its manifest entry, `events/<type>.ts` (whose payload type lists every Event Field the manifest declares), the OBS subscription in `session.ts`, a callback through `service.ts`, and the `emitEvent` in `index.ts`.
- **Naming in the manifest** ([manifest reference](https://fluxta.app/docs/plugins/reference/manifest)): every kind — an Action or Event `type` — is kebab-case (`set-scene`, `scene-changed`); every key — a Value Source `key`, a param, an Event Field, a produced value, an Options Source reference, a settings field — is camelCase (`isStreaming`, `sceneName`). The Options Sources `scene-sources`, `scene-filters` and `connection-status` do not follow it yet (#4); new ones must.
- **Every Action, Value Source and Event names its Connection** (`connection`). An unset `connection` resolves to the sole configured Connection (`connections/resolve.ts`), so settings saved before a second Connection existed keep working.
- **OBS being unreachable is normal.** A Connection sits in `connecting` while OBS is closed and retries forever. Nothing throws over it: an Action logs a `console.warn` and returns, a Value Source resolves `null`, an Options Source resolves `[]`.
- **Run Variables** ([guide](https://fluxta.app/docs/plugins/guides/run-variables)): a setting edited through a `TemplateField` arrives with its Run Variable references substituted and may hold a number or a boolean. Read it through `templatedText` / `templatedNumber` (`actions/templated.ts`), never as a bare string.
- **Passwords never reach an editor.** The editor sees `hasPassword`; on update an absent password means "unchanged". Keep it that way in any new message.
- **The sidecar bundle is self-contained.** Fluxta runs it with a bundled Node and no `node_modules`, so tsdown inlines every non-builtin dependency (`noExternal`). Do not externalize one.
- **File naming**: the sidecar and `obs-protocol` use kebab-case (`set-scene.ts`, `scene-items.ts`). In the editors, React components are PascalCase (`SetSceneEditor.tsx`), hooks are `useThing.ts`, other helpers camelCase (`effectiveConnectionId.ts`).
- **Tests**: vitest, colocated `*.test.ts`. Test an `obs/` function against a stubbed `OBSWebSocket` whose `call` answers only the requests under test and throws on any other (`obs/scenes.test.ts`); test pure logic directly (`backoff`, `color`, `mode`, `templated`).
- **Comments say why** — the OBS or Fluxta behaviour that forces the code — and use the capitalized terms of `CONTEXT.md` and Fluxta's [Terminology](https://fluxta.app/docs/plugins/getting-started/terminology).

## Working against Fluxta

- **Fluxta owns the Plugin API contract**: `@fluxta/sdk`, the manifest schema and the `fluxta` CLI, documented at [fluxta.app/docs/plugins](https://fluxta.app/docs/plugins). When this plugin needs something they do not offer, do not work around the contract or patch `node_modules`: record the need in an issue here, label it `ready-for-human`, and stop — a person takes it to Fluxta (see `docs/agents/issue-tracker.md`). Once a release of the SDK or CLI provides it, it is adopted here.
- **The SDK and the CLI come from npm**, pinned once in the `catalog:` of `pnpm-workspace.yaml`; every package says `"catalog:"`. The installed typings — `apps/plugin/node_modules/@fluxta/sdk/dist/api.d.mts` (sidecar) and `ui.d.mts` (editors) — are the contract at the version in use; Fluxta's own working tree may be ahead of it.
- **Adopting a new SDK or CLI version**: bump its `catalog:` entry, add the exact version to `minimumReleaseAgeExclude` (pnpm refuses a release younger than its minimum age otherwise), `pnpm install`, and commit `pnpm-workspace.yaml` and `pnpm-lock.yaml` together.
- **Versions and publication**: the plugin's version is `version` in `manifest.json`. `pnpm exec fluxta publish` validates the package and opens a pull request to Fluxta's trusted catalog (`fluxta/plugins`). The catalog can hold a newer version than this repo — Fluxta may bump a published package there itself, for instance to update a shared dependency — and `fluxta publish` merges against it rather than overwriting it. See Fluxta's [Publishing](https://fluxta.app/docs/plugins/getting-started/publishing) guide.
- **Publishing is the user's call.** Run `fluxta publish` only when the user asks for it in the conversation.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/) without a scope, lowercase and imperative: `feat: accept Run Variables in text, URL, path and volume settings`, `fix: …`, `chore: bump version`.

## Agent skills

- Issues: GitHub Issues at `inferst/fluxta-obs`. See `docs/agents/issue-tracker.md`.
- Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.
- Domain: `CONTEXT.md`, plus Fluxta's plugin docs. See `docs/agents/domain.md`.
