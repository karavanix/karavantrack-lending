#!/bin/bash
# Load B shoot: #9 (phone, "Начать перевозку"), #6 (offline → filled), #8 (standing, minutes go).
# usage: shoot_b.sh REC_DIR   (REC_DIR = the running rec.mjs output dir)
# Timeline = drives/b.csv rows (1 row = 1 s): d5 0-300, d7 300-720 (offline), d4 720-960, s20 960-2160.
S="$(cd "$(dirname "$0")" && pwd)"
R="$1"
say() { echo "$(date +%H:%M:%S) $*"; }
row() { cut -d' ' -f1 "$S/replay.state" 2>/dev/null || echo 0; }
wait_row() { while [ "$(row)" -lt "$1" ]; do sleep 1; done; }
clip() { touch "$R/REC"; say "REC on ($1)"; }
unclip() { rm -f "$R/REC"; say "REC off"; }

# #9: phone screen, tap "Начать перевозку" a few seconds in; the truck starts moving at the tap.
echo 0 > "$S/replay.state"
adb shell screenrecord --size 720x1608 --bit-rate 12000000 --time-limit 16 /sdcard/rec9.mp4 &
REC9=$!
sleep 4
adb shell input tap 540 900
python3 "$S/replay_appium.py" "$S/drives/b.csv" > "$S/replay_b.log" 2>&1 &
say "tapped Начать перевозку, replay started"
wait $REC9
adb pull /sdcard/rec9.mp4 "$R/rec9.mp4" >/dev/null && adb shell rm /sdcard/rec9.mp4
say "#9 phone clip saved"

# #6: offline for the d7 phase; record the cabinet from just before "Нет данных" until the tail is drawn.
wait_row 300; adb shell svc data disable; say "OFFLINE"
wait_row 530; clip "#6 no data"
wait_row 620; touch "$R/SHOT"
wait_row 720; adb shell svc data enable; say "ONLINE"
wait_row 830; touch "$R/SHOT"; unclip

# #8: standing from row 960; the badge turns "Стоит с" ~5 min later. Short clips as minutes go.
for at in 1330 1690 2100; do
  wait_row $at; clip "#8 standing"; sleep 2; echo "Стоит с" > "$R/CLICK"; sleep 12; touch "$R/SHOT"; sleep 6
  echo "Стоит с" > "$R/CLICK"; sleep 2; unclip
done
while pgrep -f "replay_appium.py $S/drives/b.csv" >/dev/null; do sleep 2; done
say "replay finished (phone held at the last point)"
