#!/bin/bash
# Final renders with "zoom to the action" (zoom.py keyframes t:zoom:cx:cy) and tap marks.
# v2 (session 4a): every clip STARTS and ENDS on its key element, so poster = frame 0 = last
# frame and the loop restarts without a jump; moves are 0.45 s quartic ease-out (zoom.py --ease snap).
# Sources: $RAW (default ../raw, outside git): recA/ (load A frames + rec_hero_0.mp4), recB/ (B take 2
# + rec9.mp4), recB_part1/ (B part 1), pub/ (public page), hero/hi_cab.mp4 + hi_ph.mp4 (hero.sh),
# zoom/hi6.mp4, hi7.mp4, hi8.mp4 (intermediates of v1, kept). Output: $RAW/out2/.
# Event times (header strips, 0.5 s): hi_cab «Загружен» 8.0, photo in history ~9, «В пути» 13.5,
# connection badge green 17.5; hi6 path appears ~8, «Нет данных» → «В пути» 14.5; hi8 xfade 5.6.
set -e
cd "$(dirname "$0")"
RAW=${RAW:-../raw}; OUT=$RAW/out2; Z=$RAW/zoom; mkdir -p "$OUT"
[ -f "$Z/tap.png" ] || convert -size 120x120 xc:none -fill 'rgba(20,30,50,0.28)' -stroke 'rgba(255,255,255,0.95)' -strokewidth 5 \
  -draw 'circle 60,60 60,8' "$Z/tap.png"

# 1 — cabinet: header ×2.2 (title + status/connection badges) → wide → header before «Загружен» →
# photo in history → wide → header before «В пути» → speed + truck → header. Length = hi_cab, synced with #2.
python3 zoom.py "$RAW/hero/hi_cab.mp4" "$OUT/01-hero-cabinet.ru.mp4" 1920x1080 \
  "0:2.2:.42:.13; 2.5:2.2:.42:.13; 2.95:1:.5:.5; 7.3:1:.5:.5; 7.75:2.2:.42:.13; 8.9:2.2:.42:.13; 9.35:2:.30:.90; 11.0:2:.30:.90; 11.45:1:.5:.5; 13.0:1:.5:.5; 13.45:2.2:.42:.13; 15.3:2.2:.42:.13; 15.75:1.6:.52:.48; 18.6:1.6:.52:.48; 19.05:2.2:.42:.13" --crf 31

# 2 — phone: unchanged from v1 (no zoom at 720 px; tap marks on the shutter, «Груз загружен», «Начать перевозку»)
ffmpeg -nostdin -v error -y -i "$RAW/hero/hi_ph.mp4" -i "$Z/tap.png" -filter_complex \
  "[0:v][1:v]overlay=x=300:y=1235:enable='between(t,1.75,2.1)'[a];[a][1:v]overlay=x=300:y=1356:enable='between(t,3.45,3.85)'[b];[b][1:v]overlay=x=300:y=1356:enable='between(t,10.1,10.5)',format=yuv420p" \
  -c:v libx264 -preset slow -crf 25 -an -movflags +faststart "$OUT/02-hero-phone.ru.mp4"

# 6 — offline: header «Нет данных с 06:18» + the frozen truck ×1.8 → map ×1.3 (menu out of frame; the path appears at ~8 s)
# → header just before it turns «В пути» (14.5), hold to the end.
python3 zoom.py "$Z/hi6.mp4" "$OUT/06-offline.ru.mp4" 1920x1200 \
  "0:1.8:.45:.30; 2.3:1.8:.45:.30; 2.75:1.3:.68:.5; 13.6:1.3:.68:.5; 14.05:1.8:.45:.30" --crf 29

# 8 — standing: popover «Стоит · уже 6 → 12 мин» ×1.9 → map with the stopped truck ×1.3 → popover.
python3 zoom.py "$Z/hi8.mp4" "$OUT/08-idle.ru.mp4" 1920x1200 \
  "0:1.9:.47:.30; 7.5:1.9:.47:.30; 7.95:1.3:.66:.5; 10.9:1.3:.66:.5; 11.35:1.9:.47:.30" --crf 29

# 7 — recipient's page: header with the badges ×1.3 → whole screen with the moving map → header.
python3 zoom.py "$Z/hi7.mp4" "$OUT/07-recipient-link.ru.mp4" 720x1558 \
  "0:1.3:.42:.06; 2.2:1.3:.42:.06; 2.65:1:.5:.5; 15.1:1:.5:.5; 15.55:1.3:.42:.06" --up 1.5 --crf 27

# 9 — driver app: top 660 px only (header + the load card with its button; the empty list below is out),
# tap mark on «Начать перевозку» (filter time = source time, trimmed after). Shown cut off at the bottom.
ffmpeg -nostdin -v error -y -i "$RAW/recB/rec9.mp4" -i "$Z/tap.png" -filter_complex \
  "[0:v]crop=720:660:0:80,fps=30[v];[v][1:v]overlay=x=300:y=460:enable='between(t,3.75,4.15)',trim=start=2.5:end=9.5,setpts=PTS-STARTPTS,format=yuv420p" \
  -c:v libx264 -preset slow -crf 23 -an -movflags +faststart "$OUT/09-driver-start.ru.mp4"

for f in "$OUT"/0[126789]-*.ru.mp4; do ffmpeg -nostdin -v error -y -i "$f" -frames:v 1 -c:v libwebp -quality 82 "${f%.mp4}.webp"; done
ls -la "$OUT"
