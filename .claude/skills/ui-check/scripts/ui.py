#!/usr/bin/env python3
"""Token-cheap iOS Simulator driver on top of the XcodeBuildMCP CLI.

Every command prints a few short lines instead of the raw rs/1 snapshot (~80 KB
of JSON per screen). Selectors replace elementRefs, so the model never needs a
snapshot to act. Screenshots are cropped and downscaled before the model reads
them. Python 3.9+, stdlib only.

React Native / Expo flavour: bundle id, deep-link scheme and the dev-client
scheme come from ./app.json; `launch` connects the dev build straight to Metro;
duplicate Fabric nodes are collapsed; Pressables (role `other`) count as targets.
"""
import argparse
import difflib
import glob
import json
import os
import re
import shlex
import subprocess
import sys
import time
import urllib.parse
import urllib.request


def _expo_config():
    try:
        with open("app.json", encoding="utf-8") as f:
            return json.load(f).get("expo", {})
    except (OSError, ValueError):
        return {}


EXPO = _expo_config()
_scheme = EXPO.get("scheme")
BUNDLE = os.environ.get("UI_BUNDLE") or EXPO.get("ios", {}).get("bundleIdentifier", "")
SCHEME = os.environ.get("UI_SCHEME") or (_scheme[0] if isinstance(_scheme, list) else _scheme) or ""
# expo-dev-client registers exp+<slug without punctuation>, e.g. exp+utilityledger.
DEV_SCHEME = os.environ.get("UI_DEV_SCHEME") or (
    "exp+" + re.sub(r"[^a-z0-9+.-]", "", EXPO.get("slug", "").lower()) if EXPO.get("slug") else "")
METRO = os.environ.get("UI_METRO", "http://localhost:8081")
OUT_DIR = os.environ.get("UI_OUT", "/private/tmp/ui-check")
XCB = os.environ.get("XCODEBUILDMCP", "xcodebuildmcp")
# src/components/pressable.tsx ignores presses for 500 ms after a handled one.
PRESS_GAP = float(os.environ.get("UI_PRESS_GAP", "0.6"))
# Labels the Expo dev launcher shows instead of the app when Metro is not connected.
LAUNCHER_LABELS = ("DEVELOPMENT SERVERS", "Searching for development servers...")
# Native containers that look like labelled `other` elements but are not targets.
CONTAINER_LABELS = ("Toolbar", "Tab Bar")


class Fail(Exception):
    """Expected check failure: exit 1, one line."""


class Blocked(Exception):
    """Tool or precondition problem: exit 2, one line."""


# ---------------------------------------------------------------- environment

def _xcode_version(path):
    m = re.search(r"Xcode-?([\d.]+)", path)
    return tuple(int(p) for p in m.group(1).split(".") if p) if m else (0,)


def ensure_developer_dir():
    current = os.environ.get("DEVELOPER_DIR", "")
    if current and os.path.isdir(current):
        return current
    apps = sorted(glob.glob("/Applications/Xcode*.app"), key=_xcode_version)
    apps = [a for a in apps if os.path.isdir(a + "/Contents/Developer")]
    if not apps:
        raise Blocked("no Xcode in /Applications")
    os.environ["DEVELOPER_DIR"] = apps[-1] + "/Contents/Developer"
    return os.environ["DEVELOPER_DIR"]


def run(argv, timeout=90):
    try:
        r = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise Blocked("timeout: " + " ".join(argv[:4]))
    return r


def simulator():
    sim = os.environ.get("UI_SIM")
    if sim:
        return sim
    r = run(["xcrun", "simctl", "list", "devices", "booted", "-j"])
    booted = [d for devs in json.loads(r.stdout or "{}").get("devices", {}).values()
              for d in devs if d.get("state") == "Booted"]
    if len(booted) != 1:
        names = ", ".join(d["name"] + " " + d["udid"][:8] for d in booted) or "none"
        raise Blocked("need exactly one booted simulator or UI_SIM (booted: %s)" % names)
    os.environ["UI_SIM"] = booted[0]["udid"]
    return booted[0]["udid"]


_daemon_restarted = False


def xcb(tool, args=None, timeout=90):
    """Call `xcodebuildmcp ui-automation <tool>` and return parsed JSON."""
    global _daemon_restarted
    payload = dict(args or {}, simulatorId=simulator())
    argv = [XCB, "ui-automation", tool, "--json", json.dumps(payload, ensure_ascii=False),
            "--output", "json", "--verbose"]
    r = run(argv, timeout)
    try:
        data = json.loads(r.stdout)
    except ValueError:
        raise Blocked("%s: non-JSON output (%s)" % (tool, (r.stderr or r.stdout).strip()[:160]))
    if data.get("didError"):
        message = json.dumps(data.get("error") or data, ensure_ascii=False)
        # The daemon keeps the DEVELOPER_DIR it was started with; a removed Xcode breaks AXe.
        if "Xcode installation" in message and not _daemon_restarted:
            _daemon_restarted = True
            run([XCB, "daemon", "restart"], 60)
            return xcb(tool, args, timeout)
        raise Blocked("%s failed: %s" % (tool, message[:240]))
    return data


# ------------------------------------------------------------------ snapshots

def metro_running():
    try:
        with urllib.request.urlopen(METRO + "/status", timeout=3) as r:
            return b"packager-status:running" in r.read()
    except OSError:
        return False


def on_launcher(elements):
    return any(e.get("label") in LAUNCHER_LABELS for e in elements)


def snapshot(allow_launcher=False):
    capture = xcb("snapshot-ui").get("data", {}).get("capture", {})
    if "elements" not in capture:
        raise Blocked("snapshot has no elements (is the app in foreground?)")
    # Fabric exposes every Text twice (same role/label/frame); keep one so
    # selectors do not come back ambiguous.
    seen, elements = set(), []
    for e in capture["elements"]:
        f = e.get("frame", {})
        key = (e.get("role"), e.get("identifier"), e.get("label"), str(e.get("value")),
               f.get("x"), f.get("y"), f.get("width"), f.get("height"))
        if key not in seen:
            seen.add(key)
            elements.append(e)
    if not allow_launcher and on_launcher(elements):
        raise Blocked("Expo dev launcher is open instead of the app: start Metro "
                      "(npx expo start) and run `launch`")
    return elements


def is_target(e):
    """Tappable for a human. RN Pressables without accessibilityRole come out as
    role `other` with the children's text as label and no `tap` action."""
    actions = e.get("actions", [])
    if "tap" in actions or "swipeWithin" in actions:
        return True
    role = e.get("role")
    if role in ("button", "link", "switch", "text-field", "search-field"):
        return True
    return role == "other" and bool(e.get("label")) and e.get("label") not in CONTAINER_LABELS


def is_noise(e):
    return e.get("role") == "slider" and re.match(r"^(Vertical|Horizontal) scroll bar", e.get("label") or "")


def parse_selector(text):
    """`id=x`, `label=Головна`, `label~=Голов`, `role=button&label~=Купити`, `#2` suffix.

    A bare word means identifier-or-label exact match.
    """
    index = None
    m = re.match(r"^(.*)#(\d+)$", text)
    if m:
        text, index = m.group(1), int(m.group(2))
    parts = []
    for chunk in text.split("&"):
        m = re.match(r"^(id|label|value|role|text)(~?=)(.*)$", chunk)
        if m:
            key, op, val = m.groups()
            parts.append((key, op == "~=", val))
        else:
            parts.append(("any", False, chunk))
    return parts, index


def _field(e, key):
    if key == "id":
        return e.get("identifier", "") or ""
    if key == "text":
        return (e.get("label", "") or "") + " " + (e.get("value", "") or "")
    return str(e.get(key, "") or "")


def _matches(e, parts):
    for key, contains, val in parts:
        if key == "any":
            if val not in (_field(e, "id"), _field(e, "label")):
                return False
            continue
        actual = _field(e, key)
        if key == "text" or contains:
            if val.lower() not in actual.lower():
                return False
        elif actual != val:
            return False
    return True


def find(elements, selector, visible_only=True):
    parts, index = parse_selector(selector)
    found = [e for e in elements if _matches(e, parts)
             and (not visible_only or e.get("state", {}).get("visible", True))]
    if index is not None:
        return found[index - 1:index]
    return found


def describe(e):
    bits = [e.get("role", "")]
    if e.get("identifier"):
        bits.append("id=" + e["identifier"])
    if e.get("label"):
        bits.append("label=" + e["label"][:40])
    if e.get("value") not in (None, ""):
        bits.append("value=" + str(e["value"])[:30])
    if not e.get("state", {}).get("enabled", True):
        bits.append("disabled")
    return " ".join(bits)


def suggestions(elements, selector, limit=3):
    """Cheap diagnostics instead of a full dump: closest ids/labels."""
    parts, _ = parse_selector(selector)
    needle = " ".join(v for _, _, v in parts).lower()
    scored = []
    for e in elements:
        if not e.get("state", {}).get("visible", True):
            continue
        score = max(difflib.SequenceMatcher(None, needle, _field(e, k).lower()).ratio()
                    for k in ("id", "label"))
        if score >= 0.5:
            scored.append((-score, describe(e)))
    seen, out = set(), []
    for _, d in sorted(scored):
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out[:limit]


def resolve(selector, action=None, timeout=0.0):
    """Return (element, elements) for exactly one visible match, polling up to timeout."""
    deadline = time.monotonic() + timeout
    while True:
        elements = snapshot()
        found = find(elements, selector)
        if action:
            found = [e for e in found if action in e.get("actions", [])] or found
        if len(found) == 1:
            return found[0], elements
        if len(found) > 1:
            raise Blocked("%s matches %d elements; add &role=… or #N: %s" % (
                selector, len(found), " | ".join(describe(e) for e in found[:4])))
        if time.monotonic() >= deadline:
            hint = suggestions(elements, selector)
            raise Fail("not found: %s%s" % (selector, ("; similar: " + " | ".join(hint)) if hint else ""))
        time.sleep(0.3)


# ------------------------------------------------------------------- actions

def cmd_screen(grep=None, limit=40, all_rows=False):
    elements = snapshot()
    rows, seen = [], set()
    no_id_targets = 0
    for e in elements:
        if not e.get("state", {}).get("visible", True) or (is_noise(e) and not all_rows):
            continue
        actionable = is_target(e)
        has_text = e.get("role") in ("text", "text-field") and e.get("label")
        if not (all_rows or e.get("identifier") or actionable or has_text):
            continue
        if actionable and not e.get("identifier"):
            no_id_targets += 1
        line = describe(e)
        if line in seen or (grep and not re.search(grep, line, re.I)):
            continue
        seen.add(line)
        rows.append(line)
    for line in rows[:limit]:
        print(line)
    tail = []
    if len(rows) > limit:
        tail.append("%d more (use --grep)" % (len(rows) - limit))
    if no_id_targets:
        tail.append("%d tappable without id" % no_id_targets)
    if tail:
        print("… " + "; ".join(tail))


_last_press = 0.0


def cmd_tap(selector, timeout=5.0, long_press=False):
    global _last_press
    e, _ = resolve(selector, "tap", timeout)
    actions = e.get("actions", [])
    # The app-wide press lock would swallow a second press within 500 ms.
    wait = _last_press + PRESS_GAP - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_press = time.monotonic()
    if long_press:
        xcb("long-press", {"elementRef": e["ref"], "duration": 1000})
    # `tap` reports success but does nothing on the iOS 27 tab bar; a touch down/up
    # at the element centre behaves like a finger everywhere we tried.
    elif "touch" in actions:
        xcb("touch", {"elementRef": e["ref"], "down": True, "up": True})
    elif "tap" in actions:
        xcb("tap", {"elementRef": e["ref"]})
    else:
        raise Blocked("not tappable: " + describe(e))
    return "%s %s" % ("hold" if long_press else "tap", selector)


def cmd_type(selector, text, replace=True, timeout=5.0):
    e, _ = resolve(selector, None, timeout)
    xcb("type-text", {"elementRef": e["ref"], "text": text, "replaceExisting": replace})
    return "type %s" % selector


def _axe():
    """AXe ships inside the XcodeBuildMCP formula; `axe type` needs no elementRef."""
    import shutil
    candidates = [os.environ.get("UI_AXE"), shutil.which("axe")]
    xcb_path = shutil.which(XCB)
    if xcb_path:
        root = os.path.dirname(os.path.dirname(os.path.realpath(xcb_path)))
        candidates.append(os.path.join(root, "libexec", "bundled", "axe"))
    for c in candidates:
        if c and os.access(c, os.X_OK):
            return c
    raise Blocked("axe not found (set UI_AXE); it comes with `brew install xcodebuildmcp`")


def cmd_keys(text):
    """Type into whatever field has focus, through the HID keyboard. For inputs
    the tree does not show (hidden TextInput behind the meter / amount UI).
    US keyboard characters only: digits, latin letters, `.` (becomes `,` in sums)."""
    r = run([_axe(), "type", text, "--udid", simulator()], 60)
    if r.returncode:
        raise Blocked("axe type failed: " + (r.stderr or r.stdout).strip()[:160])
    return "keys %s" % text


def cmd_key(code, count=1):
    """Press one HID key by keycode (42 — Backspace, 40 — Return, 43 — Tab) `count`
    times, in whatever field has focus. For what `keys` cannot type."""
    for _ in range(count):
        r = run([_axe(), "key", str(code), "--udid", simulator()], 30)
        if r.returncode:
            raise Blocked("axe key failed: " + (r.stderr or r.stdout).strip()[:160])
    return "key %s x%d" % (code, count)


def cmd_swipe(selector, direction, distance=0.6):
    e, _ = resolve(selector, "swipeWithin", 3.0)
    xcb("swipe", {"withinElementRef": e["ref"], "direction": direction, "distance": distance, "duration": 0.2})
    return "swipe %s %s" % (selector, direction)


def cmd_scroll_to(target, within, direction="up", max_swipes=8):
    for i in range(max_swipes + 1):
        elements = snapshot()
        if len(find(elements, target)) >= 1:
            return "scrollto %s (%d swipes)" % (target, i)
        if i == max_swipes:
            break
        box = find(elements, within)
        box = [e for e in box if "swipeWithin" in e.get("actions", [])] or box
        if not box:
            raise Fail("scroll container not found: " + within)
        xcb("swipe", {"withinElementRef": box[0]["ref"], "direction": direction, "distance": 0.5, "duration": 0.2})
        time.sleep(0.3)
    raise Fail("not reached after %d swipes: %s" % (max_swipes, target))


def cmd_wait(selector, timeout=10.0, gone=False):
    deadline = time.monotonic() + timeout
    while True:
        elements = snapshot()
        present = bool(find(elements, selector))
        if present != gone:
            return "%s %s" % ("gone" if gone else "wait", selector)
        if time.monotonic() >= deadline:
            if gone:
                raise Fail("still visible after %.0fs: %s" % (timeout, selector))
            hint = suggestions(elements, selector)
            raise Fail("not visible after %.0fs: %s%s" % (
                timeout, selector, ("; similar: " + " | ".join(hint)) if hint else ""))
        time.sleep(0.3)


def cmd_see(text, timeout=5.0, negate=False):
    selector = text if re.match(r"^(id|label|value|role|text)~?=", text) else "text~=" + text
    cmd_wait(selector, timeout, gone=negate)
    return ("nosee " if negate else "see ") + text


def cmd_check(selector, expectations, timeout=3.0):
    """expectations: label=…, label~=…, value=…, enabled, disabled, count=N."""
    deadline = time.monotonic() + timeout
    while True:
        elements = snapshot()
        found = find(elements, selector)
        problems = []
        for exp in expectations:
            m = re.match(r"^(label|value|id)(~?=)(.*)$", exp)
            if exp.startswith("count="):
                if len(found) != int(exp[6:]):
                    problems.append("count=%d" % len(found))
                continue
            if len(found) != 1:
                problems = ["%d matches" % len(found)]
                break
            e = found[0]
            if exp in ("enabled", "disabled"):
                actual = e.get("state", {}).get("enabled", True)
                if actual != (exp == "enabled"):
                    problems.append("enabled=%s" % actual)
            elif m:
                key, op, val = m.groups()
                actual = _field(e, key)
                ok = val.lower() in actual.lower() if op == "~=" else actual == val
                if not ok:
                    problems.append("%s=%r" % (key, actual))
            else:
                raise Blocked("unknown expectation: " + exp)
        if not expectations and len(found) != 1:
            problems = ["%d matches" % len(found)]
        if not problems:
            return "check %s %s" % (selector, " ".join(expectations))
        if time.monotonic() >= deadline:
            raise Fail("check %s: expected %s, got %s" % (selector, " ".join(expectations), ", ".join(problems)))
        time.sleep(0.3)


def _png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")


def cmd_shot(selector=None, scale=None, pad=8, name=None, rect=None):
    """Crop to an element (or rect in points) and downscale.

    scale = output pixels per screen point. Full screen defaults to 0.6
    (402pt → 241px, ~200 tokens); crops default to 1.0.
    """
    os.makedirs(OUT_DIR, exist_ok=True)
    stamp = name or time.strftime("shot-%H%M%S")
    raw = os.path.join(OUT_DIR, stamp + ".raw.png")
    out = os.path.join(OUT_DIR, stamp + ".jpg")
    frame = None
    if selector:
        e, elements = resolve(selector, None, 3.0)
        frame = e["frame"]
    else:
        elements = None
    if rect:
        x, y, w, h = (float(v) for v in rect.split(","))
        frame = {"x": x, "y": y, "width": w, "height": h}
    r = run(["xcrun", "simctl", "io", simulator(), "screenshot", "--type=png", raw])
    if r.returncode:
        raise Blocked("simctl screenshot failed: " + r.stderr.strip()[:160])
    px_w, px_h = _png_size(raw)
    if elements is None and frame:
        elements = snapshot()
    pt_w = next((e["frame"]["width"] for e in (elements or []) if e.get("role") == "application"), None)
    density = px_w / pt_w if pt_w else 3.0
    args = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "80"]
    if frame:
        x0 = max(0, int((frame["x"] - pad) * density))
        y0 = max(0, int((frame["y"] - pad) * density))
        # sips silently skips the crop when offset + size reaches the image edge.
        x1 = min(px_w - 1, int((frame["x"] + frame["width"] + pad) * density))
        y1 = min(px_h - 1, int((frame["y"] + frame["height"] + pad) * density))
        if x1 <= x0 or y1 <= y0:
            raise Fail("element is off-screen: %s" % selector)
        args += ["-c", str(y1 - y0), str(x1 - x0), "--cropOffset", str(y0), str(x0)]
        crop_w, crop_h = x1 - x0, y1 - y0
        scale = 1.0 if scale is None else scale
    else:
        crop_w, crop_h = px_w, px_h
        scale = 0.6 if scale is None else scale
    target_w = max(16, int(crop_w / density * scale))
    target_h = max(16, int(crop_h / density * scale))
    r = run(args + [raw, "--out", out])
    if r.returncode:
        raise Blocked("sips crop failed: " + r.stderr.strip()[:160])
    if frame:
        got = run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", out]).stdout.split()
        if got[-3:][::2] != [str(crop_w), str(crop_h)]:
            raise Blocked("sips ignored the crop (%s)" % " ".join(got[-4:]))
    r = run(["sips", "-z", str(target_h), str(target_w), out])
    if r.returncode:
        raise Blocked("sips resize failed: " + r.stderr.strip()[:160])
    os.remove(raw)
    tokens = max(1, target_w * target_h // 750)
    return "shot %s %dx%d ~%d tok" % (out, target_w, target_h, tokens)


def cmd_launch(fresh=True, args=(), timeout=40.0):
    """Restart the app. A dev build goes straight to Metro through the
    expo-dev-client URL (no launcher screen), then we wait for the JS root."""
    if not BUNDLE:
        raise Blocked("no expo.ios.bundleIdentifier in ./app.json; run from the project root or set UI_BUNDLE")
    sim = simulator()
    if fresh:
        run(["xcrun", "simctl", "terminate", sim, BUNDLE])
    via = "simctl"
    if fresh and not args and DEV_SCHEME and metro_running():
        url = "%s://expo-development-client/?url=%s" % (DEV_SCHEME, urllib.parse.quote(METRO, safe=""))
        r = run(["xcrun", "simctl", "openurl", sim, url])
        via = "metro"
    else:
        r = run(["xcrun", "simctl", "launch", sim, BUNDLE] + list(args))
    if r.returncode:
        raise Blocked("launch failed: " + r.stderr.strip()[:160])
    # Wait until the JS bundle has rendered something of our own (texts or ids),
    # not the splash, the bundling progress or the dev launcher.
    deadline = time.monotonic() + timeout
    while True:
        time.sleep(1.0)
        elements = snapshot(allow_launcher=True)
        if on_launcher(elements):
            raise Blocked("Expo dev launcher is open: Metro is %s at %s; start it with `npx expo start`"
                          % ("running" if metro_running() else "not running", METRO))
        texts = [e for e in elements if e.get("role") == "text" and not re.match(
            r"^(Bundling|Loading|Downloading)", e.get("label") or "")]
        if len(texts) >= 2:
            return "launch %s via %s" % (BUNDLE, via)
        if time.monotonic() >= deadline:
            raise Blocked("app did not render within %.0fs (bundling error? check Metro output)" % timeout)


def cmd_open(url):
    # `/outage-settings` → `<scheme>://outage-settings` (Expo Router path, groups omitted).
    if url.startswith("/"):
        if not SCHEME:
            raise Blocked("no expo.scheme in ./app.json for a route path; set UI_SCHEME")
        url = "%s://%s" % (SCHEME, url[1:])
    r = run(["xcrun", "simctl", "openurl", simulator(), url])
    if r.returncode:
        raise Blocked("openurl failed: " + r.stderr.strip()[:160])
    return "open %s" % url


def cmd_button(name):
    xcb("button", {"buttonType": name})
    return "button %s" % name


# ---------------------------------------------------------------------- flows

def _opts(tokens):
    """Split `k=v` options (timeout=, scale=, …) from positional tokens."""
    pos, opt = [], {}
    for t in tokens:
        m = re.match(r"^(timeout|scale|pad|name|rect|distance|max|dir|within|grep|count)=(.*)$", t)
        if m:
            opt[m.group(1)] = m.group(2)
        else:
            pos.append(t)
    return pos, opt


def step(line):
    # No inline comments: `#N` is the selector index. Whole-line `#` comments are skipped by run.
    tokens = shlex.split(line)
    if not tokens or tokens[0].startswith("#"):
        return None
    verb, rest = tokens[0], tokens[1:]
    pos, opt = _opts(rest)
    t = float(opt.get("timeout", 0)) if "timeout" in opt else None
    if verb == "tap":
        return cmd_tap(pos[0], t if t is not None else 5.0)
    if verb == "hold":
        return cmd_tap(pos[0], t if t is not None else 5.0, long_press=True)
    if verb == "type":
        return cmd_type(pos[0], pos[1], replace="append" not in pos[2:])
    if verb == "keys":
        return cmd_keys(" ".join(pos))
    if verb == "key":
        return cmd_key(pos[0], int(opt.get("count", 1)))
    if verb == "swipe":
        return cmd_swipe(pos[0], pos[1] if len(pos) > 1 else "up", float(opt.get("distance", 0.6)))
    if verb == "scrollto":
        return cmd_scroll_to(pos[0], opt.get("within", pos[1] if len(pos) > 1 else "role=scroll-view"),
                             opt.get("dir", "up"), int(opt.get("max", 8)))
    if verb == "wait":
        return cmd_wait(pos[0], t if t is not None else 10.0)
    if verb == "gone":
        return cmd_wait(pos[0], t if t is not None else 10.0, gone=True)
    if verb == "see":
        return cmd_see(" ".join(pos), t if t is not None else 5.0)
    if verb == "nosee":
        return cmd_see(" ".join(pos), t if t is not None else 5.0, negate=True)
    if verb == "check":
        return cmd_check(pos[0], pos[1:], t if t is not None else 3.0)
    if verb == "shot":
        return cmd_shot(pos[0] if pos else None, float(opt["scale"]) if "scale" in opt else None,
                        int(opt.get("pad", 8)), opt.get("name"), opt.get("rect"))
    if verb == "launch":
        return cmd_launch("keep" not in pos, [p for p in pos if p != "keep"], t if t is not None else 40.0)
    if verb == "open":
        return cmd_open(pos[0])
    if verb == "button":
        return cmd_button(pos[0])
    if verb == "sleep":
        time.sleep(float(pos[0]))
        return "sleep %s" % pos[0]
    if verb == "screen":
        cmd_screen(opt.get("grep"))
        return "screen"
    raise Blocked("unknown step: " + verb)


def cmd_run(path, verbose=False, keep_going=False, shot_on_fail=True):
    with open(path, encoding="utf-8") as f:
        lines = [(n, l.rstrip("\n")) for n, l in enumerate(f, 1)]
    started = time.monotonic()
    done = failed = 0
    for n, line in lines:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        t0 = time.monotonic()
        try:
            result = step(line)
            done += 1
            # Shots are always printed: the model needs their paths.
            if verbose or (result and result.startswith("shot ")):
                print("ok %s (%.1fs)" % (result, time.monotonic() - t0))
        except (Fail, Blocked) as exc:
            failed += 1
            kind = "FAIL" if isinstance(exc, Fail) else "BLOCKED"
            print("%s line %d `%s`: %s" % (kind, n, line.strip(), exc))
            if shot_on_fail:
                try:
                    print("  " + cmd_shot(name="fail-line%d" % n))
                except (Fail, Blocked):
                    pass
            if not keep_going:
                break
    total = done + failed
    status = "PASS" if not failed else "FAIL"
    print("%s %d/%d steps in %.0fs (%s)" % (status, done, total, time.monotonic() - started,
                                           os.path.basename(path)))
    return 0 if not failed else 1


# ------------------------------------------------------------------------ cli

def main(argv=None):
    p = argparse.ArgumentParser(prog="ui.py", description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("doctor")
    s = sub.add_parser("screen", help="compact list of visible ids, targets and texts")
    s.add_argument("--grep")
    s.add_argument("--limit", type=int, default=40)
    s.add_argument("--all", action="store_true")
    s = sub.add_parser("do", help="run one or more flow steps, e.g. do 'tap id=x' 'see Готово'")
    s.add_argument("steps", nargs="+")
    s = sub.add_parser("run", help="run a .flow file; prints only failures, shots and a summary")
    s.add_argument("flow")
    s.add_argument("-v", "--verbose", action="store_true")
    s.add_argument("-k", "--keep-going", action="store_true")
    s.add_argument("--no-fail-shot", action="store_true")
    args = p.parse_args(argv)
    try:
        dev = ensure_developer_dir()
        if args.cmd == "doctor":
            if not BUNDLE:
                raise Blocked("no expo.ios.bundleIdentifier in ./app.json; run from the project root or set UI_BUNDLE")
            sim = simulator()
            r = run(["xcrun", "simctl", "listapps", sim])
            installed = BUNDLE in r.stdout
            elements = snapshot(allow_launcher=True)
            print("ok xcode=%s sim=%s app=%s metro=%s screen=%s elements=%d" % (
                os.path.basename(dev.split("/Contents")[0]), sim[:8],
                "installed" if installed else "MISSING",
                "running" if metro_running() else "off",
                "dev-launcher" if on_launcher(elements) else "app", len(elements)))
            return 0
        if args.cmd == "screen":
            cmd_screen(args.grep, args.limit, args.all)
            return 0
        if args.cmd == "do":
            for line in args.steps:
                print("ok " + (step(line) or ""))
            return 0
        if args.cmd == "run":
            return cmd_run(args.flow, args.verbose, args.keep_going, not args.no_fail_shot)
    except Fail as exc:
        print("FAIL " + str(exc))
        return 1
    except Blocked as exc:
        print("BLOCKED " + str(exc))
        return 2
    except (IndexError, ValueError) as exc:
        print("BLOCKED bad step arguments: %s" % exc)
        return 2


if __name__ == "__main__":
    sys.exit(main())
