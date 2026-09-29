# jb-run origin=http://jb-fixture.localhost:4173 entry=/ account=acme-test 
"""Frozen runner: create records on the jb fixture form, one batch of {request_id, name, amount} items.
Usage: run.py <inputs.json> --yes [--state <journal.json>]   (--yes: Tyler approved this batch's Create clicks)
Exit 0 success, 2 applicability stop before any edit, 3 write outcome unknown, 4 cap reached, 1 runner error."""
import json, os, re, subprocess, sys, time

ORIGIN = "http://jb-fixture.localhost:4173"
CONTRACT = {"origin": ORIGIN, "entry": "/", "account": "acme-test",
            "controls": ["text field Name", "text field Amount", "button (disabled) Create"]}
LIMITS = {"invocations": 7, "actions": 5, "snaps": 2, "screenshots": 0}
ACTIONS = {"open": 1, "go": 1, "type": 1, "press": 1}  # click counts one per name

args = [a for a in sys.argv[1:] if not a.startswith("--")]
flags = sys.argv[1:]
inputs_path = args[0]
state_path = flags[flags.index("--state") + 1] if "--state" in flags else inputs_path + ".state.json"
approved = "--yes" in flags
items = json.load(open(inputs_path))
for it in items:
    assert set(it) == {"request_id", "name", "amount"} and all(isinstance(v, str) for v in it.values()), "inputs are data only"
state = json.load(open(state_path)) if os.path.exists(state_path) else {"tab": None, "requests": {}, "batch": {"invocations": 0}}
def save(): json.dump(state, open(state_path, "w"), indent=1)

completed, remaining = [], [it["request_id"] for it in items]
class Stop(Exception):
    def __init__(self, code, **fields): self.code, self.fields = code, fields

def jb(rid, *argv):
    """One jb invocation, counted against the request's caps before dispatch."""
    c = state["requests"].setdefault(rid, {"invocations": 0, "actions": 0, "snaps": 0, "write_state": "not_attempted"}) if rid else state["batch"]
    verb = argv[0] if argv[0] not in ("open",) and len(argv) > 1 else argv[0]
    verb = argv[1] if argv[0] == state.get("tab") else argv[0]
    add_actions = len([a for a in argv[2:] if a != "--yes"]) if verb == "click" else ACTIONS.get(verb, 0)
    if rid:
        over = c["invocations"] + 1 > LIMITS["invocations"] or c["actions"] + add_actions > LIMITS["actions"] or (verb == "snap" and c["snaps"] + 1 > LIMITS["snaps"])
        if over:
            raise Stop(3 if c["write_state"] == "may_have_committed" else 4, reason="limit_exceeded", phase=verb, request_id=rid)
        c["invocations"] += 1; c["actions"] += add_actions; c["snaps"] += 1 if verb == "snap" else 0
    else:
        c["invocations"] += 1
    save()
    p = subprocess.run(["jb", *argv], capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr

def landed(rid, out):
    """The page jb landed on must be on this runner's origin; a redirect elsewhere is an applicability stop."""
    m = re.search(r'URL: "([^"]+)"', out)
    if m and not m.group(1).startswith(ORIGIN + "/"):
        raise Stop(2, reason=f"mismatch:origin expected={ORIGIN} observed={m.group(1)}", phase="entry", request_id=rid, check_id="origin", expected=ORIGIN, observed=m.group(1), write_state=state["requests"].get(rid, {}).get("write_state", "not_attempted"))
    return out

def nav(rid, url):
    if state["tab"]:
        code, out = jb(rid, state["tab"], "go", url)
        if code == 0 or "still changing" in out: return landed(rid, out)
    code, out = jb(rid, "open", url)
    m = re.match(r"tab (\S+)", out)
    if not m: raise Stop(1, reason="open failed: " + out.strip()[:200], request_id=rid)
    state["tab"] = m.group(1); save()
    return landed(rid, out)

def snap(rid):
    code, out = jb(rid, state["tab"], "snap", "--text")
    return out

def check(rid, s):
    """Applicability contract at the entry page; returns the first failing check or None."""
    m = re.search(r'URL: "([^"]+)"', s)
    url = m.group(1) if m else ""
    if not url.startswith(ORIGIN + CONTRACT["entry"]): return ("origin", ORIGIN + CONTRACT["entry"], url)
    acct = re.search(r"^\d+ text Account: (.*)$", s, re.M)
    if not acct or acct.group(1) != CONTRACT["account"]: return ("account", CONTRACT["account"], acct.group(1) if acct else "absent")
    for ctl in CONTRACT["controls"]:
        n = len(re.findall(r"^\d+ " + re.escape(ctl) + r"$", s, re.M))
        if n != 1: return ("control:" + ctl, "1", str(n))
    if re.search(r"^\d+ text field (Name|Amount), Value:", s, re.M): return ("form_empty", "empty", "prefilled")
    req = re.search(r"^\d+ text Request: (.*)$", s, re.M)
    if not req or req.group(1) != rid: return ("request_marker", rid, req.group(1) if req else "absent")
    return None

def readback(rid, it):
    r = state["requests"][rid]
    nav(rid, r["readback_url"])
    s = snap(rid)
    rows = re.findall(r"^\d+ text (" + re.escape(rid) + r" \| .*)$", s, re.M)
    if len(rows) != 1 or "…" in rows[0]:
        raise Stop(3, reason="readback unavailable or ambiguous", phase="readback", request_id=rid, observed=f"{len(rows)} rows", write_state="may_have_committed")
    parts = [p.strip() for p in rows[0].split("|")]
    if parts[1:4] != [it["name"], it["amount"], CONTRACT["account"]]:
        raise Stop(3, reason="readback mismatch", phase="readback", request_id=rid, expected=json.dumps(it), observed=rows[0], write_state="may_have_committed")
    r["write_state"] = "verified"; save()
    return {"request_id": rid, "record_id": parts[4], "account": parts[3], "name": parts[1], "amount": parts[2], "readback_ref": rows[0]}

def run_item(it):
    rid = it["request_id"]
    r = state["requests"].get(rid, {})
    if r.get("write_state") == "verified": return {"request_id": rid, "record_id": r.get("record_id"), "readback_ref": r.get("readback_ref")}
    if r.get("write_state") == "may_have_committed":
        if r.get("request") != it: raise Stop(1, reason="changed request data on resume", request_id=rid)
        return readback(rid, it)
    if not approved: raise Stop(2, reason="mismatch:approval expected=--yes observed=absent", phase="entry", request_id=rid)
    nav(rid, f"{ORIGIN}/?request_id={rid}")
    s = snap(rid)
    fail = check(rid, s)
    if fail:
        cid, exp, obs = fail
        raise Stop(2, reason=f"mismatch:{cid} expected={exp} observed={obs}", phase="entry", request_id=rid, check_id=cid, expected=exp, observed=obs, write_state="not_attempted")
    jb(rid, state["tab"], "type", "Name", it["name"])
    jb(rid, state["tab"], "type", "Amount", it["amount"])
    req = state["requests"][rid]
    req.update(write_state="may_have_committed", request=it, readback_url=f"{ORIGIN}/records?request_id={rid}"); save()
    jb(rid, state["tab"], "click", "Create", "--yes")  # any outcome goes to readback; never click twice
    return readback(rid, it)

status, stopped = "success", None
try:
    for it in items:
        completed.append(run_item(it)); remaining.remove(it["request_id"])
except Stop as e:
    status = {2: "applicability_stop", 3: "uncertain_write", 4: "limit_exceeded", 1: "runner_error"}[e.code]
    stopped = e.fields; code = e.code
else:
    code = 0
if state["tab"] and code in (0, 2, 4):
    jb(None, state["tab"], "close"); state["tab"] = None; save()
print(json.dumps({"status": status, "completed": completed, "stopped": stopped, "remaining": remaining,
                  "counts": {k: {x: v[x] for x in ("invocations", "actions", "snaps")} for k, v in state["requests"].items()} | {"batch": state["batch"]},
                  "state_path": state_path, "evidence_log": os.environ.get("JB_SHIM_LOG")}))
sys.exit(code)
