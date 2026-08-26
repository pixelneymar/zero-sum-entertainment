# Zero Sum Entertainment

Web project for Zero Sum Entertainment. The stack is Supabase for data and
Symbols (symbo.ls) for the component framework.

---

## Toolchain: read this first

This machine has no Homebrew. `sudo` needs a password. Every tool is
user-local in `~/.local/bin`.

Export the PATH before you run any tool:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Available: `node` v24, `npm`, `npx`, `supabase` 2.115, `gh` 2.98, `uv`, `git`.
Do not try to install with Homebrew. Do not try to use `sudo`.

---

## Supabase

| Item | Value |
| --- | --- |
| Project ref | `xgvuavikubqwsdhoadyw` |
| Project name | `zero-sum-entertainment` |
| Organization | `bmazviizirkutfniaqpg` |
| Region | `ap-southeast-1` (Singapore) |
| Postgres | 17.6.1 |
| API URL | `https://xgvuavikubqwsdhoadyw.supabase.co` |

The directory is already linked. `supabase/.temp/` holds that link state and
is gitignored.

### Use the CLI, not the MCP

A `supabase` MCP server is registered. It does not work. It needs a personal
access token (`SUPABASE_ACCESS_TOKEN`), and the owner decided not to create
one. The server exits at startup without it.

The CLI is authenticated instead. Its credential lives in the macOS Keychain.

**CLI auth and MCP auth are separate paths.** You cannot read the Keychain
credential and feed it to the MCP server. Do not try. Use the CLI.

### Never change the remote database without asking

`supabase db push` applies local migrations to the live database. Ask the
owner first, every time. Write migration files and report the command.

```bash
supabase migration new <name>   # create a migration
supabase migration list         # compare local and remote
supabase db push                # ASK FIRST
```

### Row Level Security is mandatory

A Supabase table without RLS is readable and writable by anyone holding the
public anon key. Every new table needs `ENABLE ROW LEVEL SECURITY` and
explicit policies in the same migration. Never add a table without them.

---

## Symbols (symbo.ls)

### The CLI

`smbls` v3.14.786 is installed at `~/.local/bin/smbls`. Install it with:

```bash
npm install -g --allow-scripts=esbuild @symbo.ls/cli
```

Use `--allow-scripts=esbuild` so esbuild fetches its platform binary. Without
it `smbls build` and `smbls brender` may fail.

History: this package and 13 first-party dependencies were unpublished on npm
for part of 2026-08-26. They are published now. If an install fails on a
404 for an `@symbo.ls/*` package, that is the cause — check npm before
looking for a local fault.

Auth: `smbls login` stores a JWT in `~/.smblsrc` and the OS keychain. Wipe it
with `smbls logout`. That token also satisfies the MCP `token` parameter.

### Use the Symbols MCP server

The `symbols` MCP server works. It supplies 18 tools:

```
login  list_projects  create_project  get_project  save_to_project  publish  push
generate_component  generate_page  convert_react  convert_html  convert_to_json
audit_component  detect_environment  get_project_rules  search_symbols_docs
get_cli_reference  get_sdk_reference
```

### The MCP holds no credential state

This is the important part. The server stores nothing between calls. It reads
only `SYMBOLS_API_URL`, `FRANK_AUDIT_*`, `NODE_ENV`, `PORT`, and `HOME`.

Pass a credential as a parameter on **every** call that reaches the API:

- `token` — a JWT from the `login` tool, or from `SYMBOLS_TOKEN`
- `api_key` — a key in `sk_live_...` form from project integration settings

Prefer `api_key`. Do not ask the owner for a password.

Tools that need a credential: `list_projects`, `get_project`, `create_project`,
`save_to_project`, `publish`, `push`.

Tools that work without one (verified empirically, each called once):
`detect_environment`, `get_sdk_reference`, `get_cli_reference`,
`search_symbols_docs`, `audit_component`, `convert_to_json`,
`generate_component`, `generate_page`, `convert_html`, `convert_react`.

`get_project_rules` is BROKEN on the server. It returns
`Skill 'CLAUDE.md' not found`. This is a server bug, not an auth wall. Use
`get_sdk_reference` and `detect_environment` instead. They carry the real
conventions. Do not invent conventions.

Note: the `generate_*` and `convert_*` tools return the rules bundle as
context, not a finished component. Read the rules, then write the code.

Use `audit_component` to check what you wrote. It performs real linting and
catches raw px values, hex colours, and `props:{}` wrappers.

### Workspace

`https://my.symbols.app/w/zero-sum-entertainment/default`

Unauthenticated requests to that URL return 404, not a redirect to login. A
404 does not prove the workspace is missing.

### File layout

| Path | Tracked |
| --- | --- |
| `symbols.json` | yes — project identity |
| `symbols/` | yes — all source lives here (NOT `src/`) |
| `.symbols_local/config.json` | yes — tooling config |
| `.symbols_local/lock.json` | no |
| `.symbols_local/project.json` | no |
| `.symbols_local/libs/`, `snapshots/` | no |

---

## Git

Remote is `https://github.com/pixelneymar/zero-sum-entertainment.git`.
Branch is `main`.

Identity is set **locally**, not globally:

```
user.name   pixelneymar
user.email  levantavadze23@gmail.com
```

Push needs `gh auth login`. That command needs a real terminal. Ask the owner
to run it. Do not try to run it from a tool call.

---

## Rules

1. Export `PATH` before every tool call.
2. Never run `supabase db push` without permission.
3. Never create a table without RLS and policies.
4. Never commit `.env`. Only `.env.example` is tracked.
5. Never put a real key in a file, a commit, or a report.
6. Read `get_project_rules` before writing Symbols components.
7. Do not try to install the Symbols CLI.
