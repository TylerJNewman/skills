---
name: jev-browser
description: Browser work in Dex Work Chrome tabs the agent opens with `jb`: deep links, named clicks, typing, and Jev autopilot for unfamiliar navigation on approved sites. Use for quantum.loan QA or smoke tests, clicking through a website, or when Tyler says jev browser.
---

# Jev browser

`jb` (on PATH; otherwise `node <this skill's folder>/jb.mjs`) drives Chrome tabs it opened in the Dex Work profile. You fly every task and own its permissions, typing, and verification. Jev, TypeSafe's choice model at about 0.3 s a decision, is an optional **autopilot** for routine navigation: given one goal, it clicks and scrolls until it claims arrival or **disengages**. You **hand-fly** every other step, and you **land** every task yourself: autopilot's arrival is a claim until your own evidence shows the goal.

## Fly a task

1. **Choose the route.** Dex Work tasks go through `jb`. Localhost dev servers use the in-app browser preview tools with a minted session (`apps/quantum/CLAUDE.md`), and Oracle keeps its own route. Dex Personal stays closed to agents, including for recovery.
2. **Open** with `jb open <url>` and note the tab id. On quantum.loan, `jb` prints `signed in as tnewman@quantafinance.com`, and re-checks that account, the app shell, and the address before every action and before every page goes to Jev. When it prints `NOT VERIFIED` or refuses for identity, stop and ask Tyler to sign in in that same tab, then rerun; never recover through another profile, tab, or launcher.
3. **Name the landing** before acting: the record, the destination, the selected control, the loaded content, relevant errors, and any checkpoint the path itself must pass. Verify each checkpoint when you reach it; never chain across checkpoints that need their own evidence.
4. **Route each step** by the first row of the routing table that fits it.
5. **After autopilot**, do what its `next:` line says, starting from the state it printed; a menu or dialog it opened may still be open. Once you have hand-flown past a disengage, a fresh `jev` run can take over from the current page; after two disengages on one goal, hand-fly the rest.
6. **Land** with fresh evidence for every condition from step 3: `jb <tab> snap` (`snap <regex>` keeps matching lines; `snap --text <regex>` also searches page text such as prices, which can be clipped). A line in the snapshot does not prove it is on screen, so a visual claim needs `jb <tab> shot`, which prints the image's path, and your own look at the image. Missing evidence is Not covered, never Pass.
7. **Close** every tab you opened or were given with `jb <tab> close`. Use only tab ids from your own task, one agent per tab.

## Routing

| The step | Fly it |
|---|---|
| The profile, account, destination, or permission is uncertain | Stop and ask Tyler |
| Typing or keys | Hand-fly: `type "<field name>" "<text>"` (`""` names the focused field), `press` (arrows, Enter, Escape) |
| A known URL, when the clicks on the way are not under test | `jb <tab> go <url>` |
| Controls you have already seen, each with a unique name | Hand-fly: `jb <tab> click "A" "B"` with each name exactly as `snap` prints it; each waits up to 10 s to appear, so one call crosses page changes |
| An unfamiliar path on an approved origin | Autopilot: `jb <tab> jev "<one observable goal>"` |
| A native dropdown, a frame, an upload, a drag | Not supported by `jb`: stop and tell Tyler |
| None of these, clearly | Snap and plan it yourself |

When the page opens a new tab, or asks to, `jb` stops before its next action or Jev request on the original tab, which ends a click chain or an autopilot run, and prints `opened new tab <id>` for each tab that appeared, even between commands. Each is yours to verify, drive, and close.

Autopilot runs only on origins Tyler approved in `~/.config/jev-browser/origins`, and only on the origin a run starts from. Each decision sends Jev the whole snapshot, the goal, and the run's history through Vercel AI Gateway; `--allow "<regex>"` narrows what it may click but redacts nothing. Keep mail, sign-in pages, and borrower lists hand-flown. Autopilot clicks only enabled, named, unique controls, never types, and skips toggles and consequential names such as save, send, delete, approve, fund, and sign; on quantum.loan it clicks only tabs and links.

## quantum.loan map

- A loan is `https://quantum.loan/loans/next/<id>` and opens on Funding Overview. Its other overview tabs are `?tab=<slug>`, for example `status`, `loan-fees`, `escrow-title`, `valuation`, `liens`; clicking a tab shows its slug in the URL.
- Loan sections are paths under the loan: `/loan-documents` (sub-tab `/loan-documents/templates`), `/asset`, `/insurance`.
- To find a loan without its id: click the search button (named like `Search... ⌘ K`; take its exact name from `snap`), `jb <tab> type "" "<LID, address, or borrower>"`, then check in the output that the `(selected)` option is the loan you mean before `jb <tab> press Enter`. The result opens in a new tab, which Chrome blocks while the Dex window is covered: if no new tab appears, `jb <tab> shot` brings the window forward, then press Enter again. Verify the new tab's record, then close both tabs when done.

## Boundaries

- quantum.loan is read-only. There `jb` clicks only tabs, links, a reviewed list of sidebar and section openers, and the search palette's own results; types only into the search palette's input; and presses Enter there only with one of its results selected. `--yes` cannot widen that.
- Elsewhere, a consequential click, a toggle, Enter in a form field, or a key that changes a value waits for Tyler's explicit go-ahead in chat, then `--yes`.
- With the Dex window covered, `jb` dispatches pointer input from the page and turns animations off, and says so. That is navigation evidence only: verify an interaction path by rerunning it with the window visible, since a later screenshot does not validate earlier page-dispatched input. `open` and `shot` can make Dex Work Chrome's last-used profile, which stalls Oracle's local runs until Tyler clicks a Dex Personal window.
- `jb` touches only the tabs it opened and the tabs those opened.

`jb --help` lists every verb and flag.
