# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server at http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests (Vitest)
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:reset       # Drop and re-migrate the SQLite database
```

All `next` commands require the `NODE_OPTIONS='--require ./node-compat.cjs'` prefix (already embedded in package.json scripts) — this is a Node.js compatibility shim for the project.

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in a chat, the AI generates code, and a live preview renders it immediately — with no files ever written to disk.

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` is a central in-memory tree of `FileNode` objects (files and directories). It is the source of truth for all generated code. It serializes to `Record<string, FileNode>` for JSON transport (sent with every chat request) and database storage.

`src/lib/contexts/file-system-context.tsx` — React context that holds the `VirtualFileSystem` instance and exposes `handleToolCall`, which applies AI tool results directly to the in-memory FS and triggers a preview refresh via `refreshTrigger`.

### AI Chat Pipeline

`src/app/api/chat/route.ts` — The `/api/chat` POST endpoint. Receives the full message history plus the serialized file system, reconstructs a `VirtualFileSystem`, then calls Vercel AI SDK's `streamText` with two tools:

- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`) — Claude's text-editor-style tool for creating/viewing/editing files.
- **`file_manager`** (`src/lib/tools/file-manager.ts`) — Handles file deletion and renaming.

On each tool call, the client-side `handleToolCall` in `FileSystemContext` applies the change locally in real time. When streaming finishes, if the user is authenticated and has a `projectId`, the full conversation and file system are persisted to SQLite.

`src/lib/provider.ts` — Returns `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel` that returns static canned responses so the app runs without an API key.

`src/lib/contexts/chat-context.tsx` — Wraps Vercel AI SDK's `useChat`, serializes the file system into the request body on every send, and routes tool calls to `handleToolCall`.

### Live Preview

`src/components/preview/PreviewFrame.tsx` — Watches `refreshTrigger` from the file system context. On every change it calls `createImportMap` + `createPreviewHTML` and writes the result to a sandboxed `<iframe>` via `srcdoc`.

`src/lib/transform/jsx-transformer.ts` — Transforms each `.jsx/.tsx/.ts/.js` file using **Babel standalone** (in-browser compilation), creates blob URLs for each, builds a browser import map, and resolves third-party packages via `esm.sh`. The final `<iframe>` loads Tailwind CSS from CDN and uses React 19 from `esm.sh`.

### Auth

`src/lib/auth.ts` — JWT sessions via `jose`, stored in an `httpOnly` cookie (`auth-token`). `getSession()` is for server components/actions; `verifySession()` is for middleware. Secret defaults to `"development-secret-key"` unless `JWT_SECRET` env var is set.

`src/middleware.ts` — Protects `/api/projects` and `/api/filesystem` routes; all other routes are public (anonymous users can generate components freely).

### Data Layer

Prisma with SQLite at `prisma/dev.db`. Two models: `User` (email/password) and `Project` (stores serialized messages and file system as JSON strings). Prisma client is generated to `src/generated/prisma` (non-standard location — configured in `prisma/schema.prisma`).

`src/actions/` — Server actions for project CRUD (`create-project`, `get-project`, `get-projects`).

### Anonymous Work Tracking

`src/lib/anon-work-tracker.ts` — Saves in-progress work to `localStorage` for unauthenticated users so they can recover it after signing up or logging in.

## Testing

Tests use Vitest with jsdom + `@testing-library/react`. Test files live in `__tests__/` subdirectories next to the code they test. Path aliases (`@/`) are resolved via `vite-tsconfig-paths`.
