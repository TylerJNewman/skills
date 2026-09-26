#!/usr/bin/env bash
# Live smoke test for jev-browser on Tyler's Dex Work Chrome. Read-only: nothing here can change data.
# Opens its own tabs and closes every one of them, including the tab Quantum's search opens. Run: ./smoke.sh
set -uo pipefail
cd "$(dirname "$0")"
fails=0
tabs=()
pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n      %s\n' "$1" "$(head -c 600 <<<"$2")"; fails=$((fails + 1)); }
expect() { if grep -qE "$2" <<<"$3"; then pass "$1"; else fail "$1" "$3"; fi; }
approved() { sed 's/#.*//; s/[[:space:]]*$//' ~/.config/jev-browser/origins 2>/dev/null | grep -qx "$1"; }
new_tabs() { sed -n 's/^opened new tab \([0-9A-F]\{8\}\);.*/\1/p' <<<"$1"; }
# Full target ids of this run's tabs, resolved from jb's ownership records while they still exist.
full_ids() { for t in "${tabs[@]}"; do ls ~/.cache/jev-browser/tabs 2>/dev/null | grep "^$t" | sed 's/\.json$//'; done; }
cleanup() { for t in "${tabs[@]}"; do jb "$t" close >/dev/null 2>&1; done; }
trap cleanup EXIT

out=$(node check.mjs 2>&1); expect "offline release gate" '^ok:' "$out"

out=$(jb open https://quantum.loan/loans/next/18223 2>&1); q=$(sed -n 's/^tab //p' <<<"$out"); [ -n "$q" ] && tabs+=("$q")
expect "open quantum.loan loan 18223 in Dex Work" '^tab [0-9A-F]{8}$' "$out"
expect "live session is tnewman@quantafinance.com with the app shell" '^signed in as tnewman@quantafinance\.com$' "$out"
[ -z "$q" ] && { echo "cannot continue without a tab"; exit 1; }

out=$(jb "$q" click "Loan Fees" "Status" "Loan Details" 2>&1)
expect "chained clicks across three tabs" 'tab \([^)]*selected[^)]*\) Loan Details$' "$out"

out=$(jb "$q" go "https://quantum.loan/loans/next/18223?tab=valuation" 2>&1)
expect "deep link opens the Valuation section" '^[0-9]+ heading VALUATION$' "$out"

# Chrome blocks new tabs from a hidden tab, and search results open in one, so this step brings the Dex
# window forward (shot does that). Afterwards Oracle's local runs need one click on a Dex Personal window.
out=$(jb "$q" shot 2>&1); expect "shot brings the tab forward and saves a screenshot" '^saved .*\.png$' "$out"
search=$(jb "$q" snap '⌘' 2>/dev/null | sed -n 's/^[0-9]* button \(Search.*⌘ K\)$/\1/p' | head -1)
jb "$q" click "$search" >/dev/null 2>&1
out=$(jb "$q" type "" "18223" 2>&1)
if grep -qE 'option \([^)]*selected[^)]*\) [0-9]+-[0-9]+-18223-[0-9]+ ' <<<"$out"; then
  pass "search palette selects loan 18223"
  out=$(jb "$q" press Enter 2>&1); for t in $(new_tabs "$out"); do tabs+=("$t"); done
  expect "Enter opens the result in an adopted tab" 'tab [0-9A-F]{8} is at https://quantum\.loan/loans/next/18223' "$out"
  expect "adopted tab is signed in inside the app shell" '^signed in as tnewman@quantafinance\.com$' "$out"
else
  fail "search palette selects loan 18223 (Enter not pressed)" "$out"
  jb "$q" press Escape >/dev/null 2>&1
fi

jb "$q" go https://quantum.loan/loans/next/18223 >/dev/null 2>&1
out=$(jb "$q" jev "Open the Status tab. Stop when the Status tab is selected." 2>&1); for t in $(new_tabs "$out"); do tabs+=("$t"); done
if approved https://quantum.loan; then
  # Autopilot either claims arrival, which must then be true, or hands back below its confidence threshold.
  expect "autopilot on approved quantum.loan runs" '^jev (needs_verification|low_confidence|blocked)' "$out"
  if grep -q '^jev needs_verification' <<<"$out"; then
    out=$(jb "$q" snap 'selected' 2>&1)
    expect "its claimed arrival is real: Status is selected" 'tab \([^)]*selected[^)]*\) Status$' "$out"
  fi
else
  expect "autopilot refused on unapproved quantum.loan" 'autopilot is off for https://quantum\.loan' "$out"
fi

out=$(jb open https://docs.typesafe.ai 2>&1); d=$(sed -n 's/^tab //p' <<<"$out"); [ -n "$d" ] && tabs+=("$d")
if [ -n "$d" ] && approved https://docs.typesafe.ai; then
  out=$(jb "$d" jev "Open the Quick start page. Stop when the Quick start page is showing." 2>&1); for t in $(new_tabs "$out"); do tabs+=("$t"); done
  expect "autopilot reaches Jev through AI Gateway" '^jev (needs_verification|low_confidence|blocked|no_progress|step_limit)' "$out"
else
  echo "SKIP  autopilot on docs.typesafe.ai (origin not approved)"
fi

ids=$(full_ids)
cleanup
tabs=()
alive=$(node -e 'import("./tab.mjs").then(async ({ targetInfo }) => { let n = 0; for (const id of process.argv.slice(1)) if (await targetInfo(id)) n++; console.log(n); })' $ids)
expect "every tab this run opened is closed in Chrome" '^0$' "$alive"
records=$(for id in $ids; do [ -f ~/.cache/jev-browser/tabs/$id.json ] && echo "$id"; done | wc -l | tr -d ' ')
expect "no ownership record outlives its tab" '^0$' "$records"

echo; [ "$fails" -eq 0 ] && echo "smoke: all passed" || echo "smoke: $fails failed"
exit "$fails"
