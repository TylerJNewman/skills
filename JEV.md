# Jev browser and computer-use skills

`jev-browser` is the browser workflow exercised on Tyler's macOS Dex Work setup. `jev-computer-use` adds hybrid routing and an **experimental, supervised native proposal helper**. Its offline checks pass; native Jev has not been tested end to end and no native speedup is claimed.

## Install

Install both skills together so the native helper can reuse the browser skill's Jev transport:

```sh
npx skills@latest add TylerJNewman/skills --skill jev-browser jev-computer-use -g
```

Select your agent in the installer. Restart its session to discover the skills. Node.js 22+ is required. Native work needs the agent's supported CUA integration; installing a skill does not install or grant desktop access.

Ask: **“Use jev-computer-use to open the Library section in this native app.”** The agent handles CUA and uses the helper to propose navigation. Browser-only requests use `jev-browser`.

## Setup and current limits

- **Native:** supply your own Vercel AI Gateway key as `AI_GATEWAY_API_KEY`, either in the environment or a local env file. The [helper usage](skills/jev-computer-use/usage.md) documents the command. Each proposal sends the supplied goal, app/window labels, and selected accessibility content to Vercel/TypeSafe.
- **Browser:** `jb` is an existing custom Dex Work runner, not a generic Chrome installer. The checked-in runner currently assumes Tyler's Dex user-data directory and Quantum account. Installing the skill alone does not make that runner usable on another machine. Keep an already configured `jb`, or review and configure that browser setup before using it; do not launch a substitute signed-in browser. `JEV_ENV_FILE` selects the browser runner's key file. Autopilot origins require explicit approval in `~/.config/jev-browser/origins`.
- **Evidence:** prior browser use was on Tyler's setup. Current packaging checks are offline. The native helper chooses one action and executes nothing; Codex rechecks identity/freshness and uses CUA. Continuous native autopilot and its speed advantage remain unverified.

From the installed skills directory, run the offline checks:

```sh
node jev-browser/check.mjs
node jev-computer-use/check.mjs
```
