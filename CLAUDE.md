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

### Writing migrations: two traps

**Order by dependency.** PostgreSQL validates the body of a `LANGUAGE sql`
function when you create it. The tables it reads must already exist. The
first push of the initial migration failed this way (`42P01` at statement 6)
because `is_staff()` was defined before `public.staff`. Do not hide this with
`LANGUAGE plpgsql` or `check_function_bodies = off`. Fix the order.

**`set search_path = ''` and extensions.** All existing functions pin
`search_path` to the empty string. This is deliberate and is stronger than
`public, pg_temp`, because nothing resolves unqualified. Keep it. Schema-
qualify every reference (`public.staff`, `auth.uid()`).

`pg_catalog` is always searched, so `now()` and `gen_random_uuid()` still
work. Postgres 13 moved `gen_random_uuid()` into core and this project is on
17.6.1.

Extension functions do NOT work under an empty search path. Supabase puts
them in the `extensions` schema. `uuid_generate_v4()`, `crypt()`,
`gen_salt()`, and pgcrypto or pg_trgm functions will fail to resolve.

Operators are the worst case, because normal syntax cannot qualify them.
`a % b` must be written `a OPERATOR(extensions.%) b`.

If a new function needs an extension, set `search_path = 'extensions'` for
that one function. Do not revert to `public`.

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

## The product

A betting layer over short physical-challenge videos. Users bet on **how far
off** an attempt lands. Closest 10% split the pot, 5% rake.

Read `docs/README.md` first. Read `docs/integrity.md` before changing anything
that touches bets, rounds, results, or chips.

**The product's only claim: once betting closes, nothing changes.** Everything
else is entertainment. This one has to be true.

## Running the project

Always use portless plus the smbls runner. Do not use raw port numbers.

```bash
export PATH="$HOME/.local/bin:$PATH"
cd ~/Desktop/zero-sum-entertainment

# once per machine — the proxy needs an unprivileged port because sudo needs a password here
portless proxy start --port 1355 --https

# then, to run the app
portless zero-sum sh -c 'smbls runner serve --no-audit -p $PORT'
```

App URL: **https://zero-sum.localhost:1355**

The `sh -c` wrapper is required and is not optional. portless picks a random
port and exports it as `$PORT`, but `smbls runner serve` takes its port from
`symbols.json` (`port: 1234`) and ignores the environment. Without `-p $PORT`
the proxy points at a port nothing is listening on and every request 502s. The
single quotes matter — `$PORT` must expand inside the child, not in your shell.

The TLS certificate is self-signed and could not be added to the system trust
store (that needs sudo). Browsers show a warning. `curl` needs `-k`. Run
`portless trust` if you want to fix it interactively.

The runner works without a Symbols login. `smbls push` and `smbls fetch` do not.

## Testing — MANDATORY for every implementation task

**Every implementation task must end with a browser test in Chrome. No
exception. Code that has not been seen running in a browser is not done.**

"It compiles", "the syntax is valid", and "the SQL parses" are not evidence.
This project has already shipped a migration that parsed cleanly and then
failed on the first real push. Only observed behaviour counts.

### Which Chrome tool to use

Two Chrome MCP servers are installed. They are not interchangeable.

- **`chrome-devtools`** (`mcp__chrome-devtools__*`) — use this for anything
  with video. It drives a Chrome instance over CDP, and media plays normally
  (verified: `readyState 4`, real frames, 1280×720).
- **`claude-in-chrome`** (`mcp__claude-in-chrome__*`) — fine for DOM, console,
  network and screenshots of static UI. **It cannot play media.** A `<video>`
  in its tab group stays at `readyState 0 / networkState 2` forever, with no
  error, for Storage URLs, local files and even blob URLs, while `fetch` of the
  same URL succeeds. Do not spend time debugging playback there.

The engine survives a dead media element (it re-derives from the wall clock),
so a game can still be driven to completion in `claude-in-chrome` — but that
proves the engine, not the video.

### Required sequence

1. Start the server with portless plus the runner, as above.
2. Drive Chrome with the `claude-in-chrome` MCP tools. Invoke the
   `claude-in-chrome` skill first, then `tabs_context_mcp`, then navigate.
3. Take a screenshot. Look at it. A blank page that returns HTTP 200 is a
   failure.
4. Read the console with `read_console_messages`. Any uncaught error fails the
   task.
5. Exercise the actual behaviour — click, select a guess, place a bet. Do not
   only load the page.
6. Report what you SAW, not what you expect. If it did not render, say so.

### What every feature must prove

- The real output, not a placeholder or a mock.
- Correct numbers. Compare against `docs/game-rules.md` §5 worked examples.
- Errors surface visibly. A rejected late bet must be shown to the user, not
  swallowed.

### Integrity tests are not optional

These prove the product works. They must run against the LIVE api with curl,
bypassing the client entirely — a guarantee enforced only in JavaScript is not
a guarantee:

- a bet inserted after `betting_closes_at` is REJECTED by the database
- `round_results` returns zero rows before `reveal_at`
- another user's `guess` is unreadable before `reveal_at`
- `settle_round` run twice writes one set of ledger rows
- `sum(chip_ledger.amount)` equals `balances.balance` after every settlement

Tests live in `tests/`. Run them before declaring any task complete.

## Video assets

Source `.mov` files (HEVC, 146 MB) stay in `videos/` and are gitignored.
Transcoded H.264 MP4s live in `symbols/assets/videos/` (also gitignored) and
are **published to Supabase Storage**, public bucket `videos`:

- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/banana.mp4`
- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/water.mp4`

The app plays from Storage. The runner serves `symbols/assets/` at `/assets/`
as a local fallback. Transcode with `ffmpeg` (`~/.local/bin`, from
`ffmpeg-static`):

```bash
ffmpeg -y -i videos/banana.mov -c:v libx264 -preset veryfast -crf 23 \
  -pix_fmt yuv420p -movflags +faststart -an symbols/assets/videos/banana.mp4
supabase storage cp --experimental symbols/assets/videos/banana.mp4 ss:///videos/banana.mp4
```

Round timings and results are in `docs/rounds.md`. They were read from the
footage frame by frame. If a video is re-cut, re-verify every result.

## Project hygiene

- `videos/` is gitignored. The `.mov` files are 146 MB and must never enter git.
- Never commit a real key. The Supabase **anon** key is public by design and may
  appear in client code. The **service_role** key must never appear in
  `symbols/`, in a commit, or in a report.
- Delete code that a change makes obsolete. Do not leave dead components.
- One migration per logical change. Never edit an applied migration; add a new
  one.

## Division of authority — do not violate

The client renders. It never decides.

| Question | Answered by |
|---|---|
| Is betting open? | The database, at insert time |
| What is the result? | `round_results`, after `reveal_at` |
| Did I win, and how much? | `settle_round()` |
| What is my balance? | `chip_ledger` |

A guarantee that is not an RLS policy or a database constraint does not exist.
Client checks are courtesy. See `docs/integrity.md` §1.

---

## Rules

1. Export `PATH` before every tool call.
2. **Test every implementation in Chrome before calling it done.** Screenshot
   it, read the console, exercise the behaviour. See "Testing" above.
3. Run the project with `portless` plus `smbls runner serve`. Never a raw port.
4. Never run `supabase db push` without permission.
5. Never create a table without RLS and policies.
6. Never commit `.env`, `videos/`, or any real key. The anon key is public and
   is fine in client code; the service_role key is not.
7. Read `get_sdk_reference` before writing Symbols components. Verify with
   `audit_component`. (`get_project_rules` is broken server-side.)
8. Report what you observed, never what you expect. If it did not render, say
   so.
