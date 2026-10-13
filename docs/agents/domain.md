# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — this plugin's own glossary.
- **Fluxta's glossary and ADRs.** Fluxta owns every term this plugin shares with it (Plugin, Action, Event, Event Field, Value Source, Options Source, Run Variable, External Connection, Plugin Editor, Action Editor, Built Plugin Folder, Development Link …) and every decision about the Plugin API. They live in the private repository `fluxta/fluxta`: [`CONTEXT.md`](https://github.com/fluxta/fluxta/blob/main/CONTEXT.md) and [`docs/adr/`](https://github.com/fluxta/fluxta/tree/main/docs/adr). Read one with `gh api repos/fluxta/fluxta/contents/<path> -H "Accept: application/vnd.github.raw"`; list the ADRs with `gh api repos/fluxta/fluxta/contents/docs/adr --jq '.[].name'`.
- **The installed SDK** — `apps/plugin/node_modules/@fluxta/sdk/dist/api.d.mts` (sidecar) and `ui.d.mts` (editors) document the Plugin API at the version this repo pins. The public guide is [fluxta.app/docs/plugins](https://fluxta.app/docs/plugins).

If any of these files don't exist, or you have no access to `fluxta/fluxta`, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates this repo's own docs lazily when terms or decisions actually get resolved.

### Fluxta ADRs that shape this plugin

- ADR-0017 — plugin operand options resolve at edit time (Options Sources)
- ADR-0018 — plugin Actions are awaited and can produce Run Variables
- ADR-0023 — Actions declare an execution context (`standalone`)
- ADR-0025 — the Plugin API v1 isolation contract
- ADR-0026 — the plugin CLI uses host-owned Development Links
- ADR-0030 — Action settings are interpolated with Run Variables
- ADR-0031 — plugin UI ships as the `@fluxta/sdk/ui` subpath
- ADR-0038 — manifest kinds are kebab-case, value keys camelCase
- ADR-0039 — `fluxta publish` merges against the trusted repository
- ADR-0041 — External Connections are a runtime-reported plugin snapshot
- ADR-0051 — plugins declare their platforms and categories

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/        ← created with this plugin's first decision
└── ...
```

## Where new docs go

- A term this plugin owns → `CONTEXT.md` here.
- A decision about this plugin's own design → `docs/adr/` here.
- A term or decision about the Plugin API — even one this plugin forces — belongs to Fluxta: open an issue in `fluxta/fluxta` (see `docs/agents/issue-tracker.md`).

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`, or in Fluxta's glossary for the host's terms. Don't drift to synonyms the glossaries explicitly avoid.

Key terms from `CONTEXT.md`: **Connection**, **Connection Status**, **Scene**, **Current Scene**, **Source**, **Input**, **Scene Item**, **Group**, **Filter**, **Media Input**, **Stream**, **Recording**, **Mode**.

Watch the collision: in Fluxta's glossary a **Connection** is a process's transport link to the host, and what this plugin calls a Connection is Fluxta's **External Connection**. In this repo, "Connection" always means the OBS one.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR — this repo's or Fluxta's — surface it explicitly rather than silently overriding:

> _Contradicts Fluxta ADR-0038 (manifest-kinds-are-kebab-case-and-value-keys-are-camelcase) — but worth reopening because…_
