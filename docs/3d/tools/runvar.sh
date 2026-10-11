# runvar.sh "<query>"  — load the probe on the phone with these switches and bench it
q="$1"
printf 'async () => { location.href = "http://localhost:3123/lab/trip.html%s"; return "ok"; }' "$q" > nav_q.js
node cdp.mjs 9333 6931 nav_q.js >/dev/null
sleep 9
printf 'async () => location.search' > where.js
w=$(node cdp.mjs 9333 6931 where.js)
node cdp.mjs 9333 6931 bench.js | python3 -I -c "
import json,sys; r=json.load(sys.stdin)
print('$w'.ljust(26), ' '.join(f\"{s['ch'][:6]}:{s['fps']}/{s['jank']}\" for s in r['seg']))"
