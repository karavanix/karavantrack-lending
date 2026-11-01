#!/bin/bash
# Load B, part 2: last standing clip (~20 min), then a second #6 take on drives/b2.csv
# (d3 0-180, d6 180-540 offline, d4 540-780) with the map zoomed out and not following.
# usage: shoot_b2.sh REC_DIR STAND_CLIP_AT(HHMMSS)
S="$(cd "$(dirname "$0")" && pwd)"
R="$1"; AT="$2"
say() { echo "$(date +%H:%M:%S) $*"; }
row() { cut -d' ' -f1 "$S/replay.state" 2>/dev/null || echo 0; }
wait_row() { while [ "$(row)" -lt "$1" ]; do sleep 1; done; }

while pgrep -f "replay_appium.py $S/drives/b.csv" >/dev/null; do sleep 2; done
while [ "$(date +%H%M%S)" -lt "$AT" ]; do sleep 2; done
touch "$R/REC"; say "REC on (#8 standing, last)"; sleep 2; echo "Стоит с" > "$R/CLICK"; sleep 12; touch "$R/SHOT"; sleep 6
echo "Стоит с" > "$R/CLICK"; sleep 2; rm -f "$R/REC"; say "REC off"

[ -f "$S/b2.go" ] || say "waiting for b2.go (map framing)"
while [ ! -f "$S/b2.go" ]; do sleep 2; done
echo 0 > "$S/replay.state"
python3 "$S/replay_appium.py" "$S/drives/b2.csv" > "$S/replay_b2.log" 2>&1 &
say "b2 replay started"
wait_row 180; adb shell svc data disable; say "OFFLINE"
wait_row 440; touch "$R/REC"; say "REC on (#6 take 2)"
wait_row 520; touch "$R/SHOT"
wait_row 540; adb shell svc data enable; say "ONLINE"
wait_row 650; touch "$R/SHOT"; rm -f "$R/REC"; say "REC off"
while pgrep -f "replay_appium.py $S/drives/b2.csv" >/dev/null; do sleep 2; done
say "b2 finished (phone held at the last point)"
