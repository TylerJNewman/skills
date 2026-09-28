---
name: jev-computer-use
description: Hybrid Jev navigation across browser and native apps. Use for Jev computer use or tasks crossing both surfaces; browser-only tasks use jev-browser.
---

# Jev computer use

You own the task; Jev proposes the next navigation action. **Browser `jb` has been exercised on Tyler's Dex setup. Native Jev is experimental: offline checks only, no end-to-end test or measured speedup.**

## Route

- Prefer an existing CLI, connector, deep link, or known sequence.
- For browser UI, read the installed `jev-browser` skill and use its configured `jb`. Plex Web is browser UI.
- For native UI, use the supported CUA tool. Keep screenshots, typing, settings changes, and recovery with you. Use the native experiment below only for named navigation controls.

## Native experiment

1. Name one app/window, one observable destination, and the permitted navigation. Read fresh accessibility state through CUA. If the target or relevant controls are ambiguous, operate with CUA yourself.
2. Assemble a task for [choose.mjs](choose.mjs): goal, app, window, task-relevant state, and observed click/scroll candidates. The helper's [usage](usage.md) gives the command and input. It sends this content to TypeSafe through Vercel AI Gateway; sensitive content needs approval for that destination. Exclude unrelated windows and values.
3. Ask Jev once. The helper returns a proposal and **executes nothing**. Re-read CUA state and match the intended app/window and control semantics before using its index. Discard a stale proposal. Execute one permitted action through CUA, then inspect its effect.
4. Return to direct CUA on uncertainty, unchanged results, an unexpected window, or a helper error. Bound an attempt to six decisions or 45 seconds; recheck the budget before dispatch. `needs_verification` requires fresh evidence of the destination and loaded content.

Report the observed result and any handoff. This supervised route includes main-model round trips; describe acceleration only after measuring completed tasks, including retries and verification.
