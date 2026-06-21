# Installing — Codex and Claude Code

One source tree, two manifests, one shared `skills/`. The skill bodies are identical, portable Markdown; each tool reads its own manifest and discovers the same four skills.

```
autoresearch-targets/
├── .claude-plugin/plugin.json   ← Claude Code reads this
├── .codex-plugin/plugin.json    ← Codex reads this
├── skills/                      ← both read these (unchanged)
│   ├── scout-targets/   gates/   judge-panel/   frame-loop/
├── README.md  MANUAL.md  INSTALL.md
```

Nothing in `skills/` is platform-specific. The only platform-coupled behavior — persistent-goal completion — lives in `frame-loop/references/goal-control.md`, which already carries both a Codex adapter (`update_goal`, complete/blocked) and a Claude Code adapter (controller-enforced audit).

## Codex

Local install for development:

```bash
codex plugin install ./autoresearch-targets
```

Or register it through a personal marketplace so it shows in the plugin directory. Add an entry to `~/.agents/plugins/marketplace.json`:

```json
{
  "name": "tyler-local",
  "interface": { "displayName": "Tyler — Local" },
  "plugins": [
    {
      "name": "autoresearch-targets",
      "source": { "source": "local", "path": "./autoresearch-targets" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Development"
    }
  ]
}
```

`source.path` is relative to the marketplace root, so place the plugin folder beside the marketplace file (or adjust the path). Then restart Codex, open the plugin directory, and install from the `Tyler — Local` source.

Validate the manifest in CI before distributing:

```bash
ajv validate -s <(codex app-server generate-json-schema) -d .codex-plugin/plugin.json
```

## Claude Code

Claude Code reads `.claude-plugin/plugin.json` and registers the four skills from `skills/`. Add the folder through your plugin marketplace (Claude Code also reads a legacy `.claude-plugin/marketplace.json`) or your local plugins directory, then confirm with `/plugin`. All four skills are model-invoked, so they fire on the shared vocabulary and reach each other (scout → frame-loop, amber → judge-panel).

## Versioning

Bump `version` in **both** manifests on any change that affects the skills — they are meant to stay in lockstep. Current: `0.4.0`.
