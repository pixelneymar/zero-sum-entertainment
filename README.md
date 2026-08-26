# Zero Sum Entertainment

Web application for Zero Sum Entertainment. The user interface is built with
[Symbols](https://symbo.ls) (`symbo.ls`), a JSON-first design and component
framework. The backend is [Supabase](https://supabase.com) (Postgres, Auth,
Storage).

## Stack

| Layer | Technology |
| --- | --- |
| UI framework | Symbols (symbo.ls), driven by `symbols.json` |
| Application code | JavaScript (ES modules) in `src/` |
| Bundler | Vite |
| Backend | Supabase (Postgres, Auth, Storage) |
| Database migrations | Supabase CLI (`supabase/migrations/`) |

## Repository layout

```
src/                 Application source code
symbols.json         Symbols design system: tokens, components, pages
supabase/
  config.toml        Supabase CLI configuration
  migrations/        SQL migrations, applied in file-name order
.symbols_local/
  config.json        Symbols project link (tracked in git)
.env.example         Template for local environment variables
```

## Setup

### 1. Requirements

- Node.js 18 or later
- The Supabase CLI. Install it without Homebrew:
  ```sh
  npm install -g supabase
  # or, without a global install:
  npx supabase --version
  ```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure the environment

```sh
cp .env.example .env
```

Open `.env` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Get both values from
the Supabase dashboard: **Project Settings > API**. `.env` is gitignored. Do not
commit real keys.

### 4. Link the Supabase project

```sh
supabase login
supabase link --project-ref xgvuavikubqwsdhoadyw
```

The link writes local state into `supabase/.temp/`. That directory is gitignored
because it holds machine-specific project state.

### 5. Apply the database migrations

Push all local migrations to the linked remote project:

```sh
supabase db push
```

Useful related commands:

```sh
supabase migration new <name>   # Create an empty migration file
supabase db diff -f <name>      # Write the current schema drift into a migration
supabase migration list         # Compare local and remote migration history
supabase db reset               # Rebuild the local database from migrations
```

### 6. Start the development server

```sh
npm run dev
```

## Symbols: use the MCP server, not the CLI

The Symbols command line tool `@symbo.ls/cli` **cannot be installed from npm at
this time.** The package on the registry depends on five packages that are not
published; each one returns HTTP 404:

- `@symbo.ls/channels`
- `frank`
- `sync`
- `tunnel`
- `utils`

Any `npm install -g @symbo.ls/cli` therefore fails during dependency resolution.
Do not spend time on workarounds such as `--legacy-peer-deps` or `--force`; the
dependencies do not exist on the registry.

**The Symbols MCP server is the working interface.** Use it for all Symbols
operations: read and write the project, generate components and pages, convert
HTML or React into Symbols JSON, and publish. The MCP server covers the same
tasks as the CLI, including `login`, `get_project`, `save_to_project`, `push`,
and `publish`.

When the CLI dependencies are published again, the CLI becomes an option. Until
then, treat the MCP server as the only supported path.

## Working agreements

- Never commit `.env`, real API keys, or service role keys.
- `symbols.json` is the source of truth for design tokens and components. Change
  the design system there, not in ad-hoc CSS.
- Every schema change is a migration file in `supabase/migrations/`. Do not
  change the remote schema by hand in the dashboard.
