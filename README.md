# Terra

Assignment + test tracker for students. Monochromatic monthly calendar with 5 preset themes and a custom color wheel. Auto-schedules study sessions leading up to each test.

Live: **https://study-orbit-zeta.vercel.app**

> App display name is **Terra** as of this rename; the repo folder, Vercel project, and live URL still say `study-orbit` — renaming those is a separate infra step, not done here.

## Quick start

```bash
pnpm install       # or npm install
pnpm dev           # http://localhost:5173
```

## Building for production

```bash
pnpm build         # outputs to ./dist
pnpm preview       # serve the build locally
```

## Handing off to Claude Code

1. `cd study-orbit`
2. Run `claude` (the Claude Code CLI). It reads `CLAUDE.md` in the project root automatically.
3. That's it — Claude has the full brief on the codebase, theming system, and roadmap.

If you don't have Claude Code installed: https://docs.claude.com/en/docs/claude-code

## Deploy

Currently on Vercel (project `study-orbit`, team `abiaj17s-projects`). To redeploy:

- **Fast path:** `pnpm build`, drag the `dist/` folder into Vercel dashboard.
- **Real path:** push to GitHub, connect the repo to Vercel — every push auto-deploys.

See `CLAUDE.md` for architectural notes.
