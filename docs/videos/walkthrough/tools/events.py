"""Export the film's sound events from the timeline: index.html records each one where its picture event is made
(window.__events), on the first frame its change is visible. Writes assets/audio/events.json for tools/mix.py.

Usage (from walkthrough/): python3 tools/events.py
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = r"""
const { chromium } = await import('/home/user/meltingpot-csc/web/node_modules/@playwright/test/index.mjs');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + process.argv[1] + '/index.html');
await p.waitForFunction(() => window.__events && window.__events.length > 0, null, { timeout: 20000 });
await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(() => window.__events)));
await b.close();
"""
res = subprocess.run(["node", "--input-type=module", "-e", js, HERE], capture_output=True, text=True)
if res.returncode:
    print(res.stderr[-2000:]); sys.exit(2)
events = json.loads(res.stdout.strip().splitlines()[-1])
out = os.path.join(HERE, "assets", "audio", "events.json")
json.dump({"source": "index.html window.__events (tools/events.py)", "fps": 30, "events": events}, open(out, "w"), indent=1)
kinds = {}
for e in events:
    kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
print(f"{len(events)} events -> {out}: " + ", ".join(f"{k} {v}" for k, v in sorted(kinds.items())))
