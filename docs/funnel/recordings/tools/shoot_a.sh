#!/bin/bash
# Hero take (#1 cabinet + #2 phone) on load A: records both while the owner adds the
# photo, taps "Груз загружен" and "Начать перевозку"; the drive starts the moment the
# load turns in_transit. Recording stops 30 s after that; the drive goes on (for #5, #7).
# usage: shoot_a.sh REC_DIR LOAD_ID
S="$(cd "$(dirname "$0")" && pwd)"
R="$1"; LOAD="$2"
API=https://api.yool.live/api/v1
say() { echo "$(date +%H:%M:%S) $*"; }
TOKEN=$(curl -s -m 20 $API/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"dilnoza@demo.yool.live\",\"password\":\"$DEMO_PW\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
status() { curl -s -m 5 "$API/loads/$LOAD" -H "Authorization: Bearer $TOKEN" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null; }

# screenrecord stops at 3 min: record 170 s chunks back to back until told to stop.
rm -f "$R/STOPPHONE"
( i=0; while [ ! -f "$R/STOPPHONE" ]; do
    adb shell screenrecord --size 720x1608 --bit-rate 12000000 --time-limit 170 /sdcard/rec_hero_$i.mp4; i=$((i+1))
  done ) &
touch "$R/REC"; say "RECORDING (cabinet + phone) — go"
last=""
while true; do
  s=$(status); [ -n "$s" ] && [ "$s" != "$last" ] && { say "status: $s"; last=$s; }
  [ "$s" = "in_transit" ] && break
  sleep 1
done
echo 0 > "$S/replay.state"
python3 "$S/replay_appium.py" "$S/drives/a.csv" > "$S/replay_a.log" 2>&1 &
say "drive started"
sleep 30
rm -f "$R/REC"; touch "$R/SHOT"
touch "$R/STOPPHONE"; adb shell pkill -INT screenrecord; sleep 3
for f in $(adb shell ls /sdcard/ | tr -d '\r' | grep '^rec_hero_'); do
  adb pull "/sdcard/$f" "$R/$f" >/dev/null && adb shell rm "/sdcard/$f"
done
say "recording stopped, phone clip saved; drive goes on"
