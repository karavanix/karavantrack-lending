# runland.sh "<path?query>" — open the landing on the phone in a new tab, bench
# it with bench-landing.js, close the tab. For the final run: "ru" (3D with
# the meter: which tier it picks), "ru?q=1" and "ru?q=2" (a tier held, its
# own fps), "ru?map=flat" (the fallback). Needs adb and Chrome on the phone:
#   adb reverse tcp:3123 tcp:3123
#   adb forward tcp:9333 localabstract:chrome_devtools_remote
# The phone's other tabs are left alone (and their addresses never printed).
cd "$(dirname "$0")"
url="http://localhost:3123/${1:-ru}"
id=$(curl -s -X PUT "localhost:9333/json/new?$url" | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["id"])')
sleep 12
node cdp.mjs 9333 "$id" bench-landing.js | python3 -I -c "
import json,sys; r=json.load(sys.stdin)
print('$1'.ljust(24), r['map'], r['flat'], r['screen'], 'dpr', r['dpr'], 'idle', r['idleMs'], 'tier', r['q'], 'meter', r['qlog'])
for s in r['seg']: print('   ', s['ch'].ljust(12), str(s['fps']).rjust(3), 'fps  p95', str(s['p95']).rjust(5), 'ms  jank', s['jank'])"
curl -s "localhost:9333/json/close/$id" >/dev/null
