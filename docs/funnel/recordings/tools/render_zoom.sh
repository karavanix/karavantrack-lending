#!/bin/bash
# Final renders with "zoom to the action" (zoom.py keyframes t:zoom:cx:cy) and tap marks.
# Run from the recording workdir: recA/ (load A frames + rec_hero_0.mp4), recB/ (B take 2 frames
# + rec9.mp4), recB_part1/ (B part 1 frames), pub/ (public page frames); hero.sh first.
# Coordinates are 0..1 of the frame; times are seconds of the intermediate.
set -e
cd "$(dirname "$0")"
mkdir -p zoom out
convert -size 120x120 xc:none -fill 'rgba(20,30,50,0.28)' -stroke 'rgba(255,255,255,0.95)' -strokewidth 5 \
  -draw 'circle 60,60 60,8' zoom/tap.png

# 1 — cabinet: badge before «Загружен» → photo in history → wide → badge before «В пути» → speed + truck → wide
python3 zoom.py hero/hi_cab.mp4 out/01-hero-cabinet.ru.mp4 1920x1080 \
  "0:1:.5:.5; 6.4:1:.5:.5; 7.4:2:.33:.12; 8.7:2:.33:.12; 9.4:2:.30:.90; 10.6:2:.30:.90; 11.4:1:.5:.5; 13.4:1:.5:.5; 14.1:1.9:.33:.12; 15.2:1.9:.33:.12; 16.0:1.6:.52:.48; 18.8:1.6:.52:.48; 19.4:1:.5:.5" --crf 30

# 2 — phone: no zoom (720 px source), tap marks on the shutter, «Груз загружен», «Начать перевозку»
ffmpeg -nostdin -v error -y -i hero/hi_ph.mp4 -i zoom/tap.png -filter_complex \
  "[0:v][1:v]overlay=x=300:y=1235:enable='between(t,1.75,2.1)'[a];[a][1:v]overlay=x=300:y=1356:enable='between(t,3.45,3.85)'[b];[b][1:v]overlay=x=300:y=1356:enable='between(t,10.1,10.5)',format=yuv420p" \
  -c:v libx264 -preset slow -crf 25 -an -movflags +faststart out/02-hero-phone.ru.mp4

# 6 — offline: badge «Нет данных» → map where the path appears → badge «В пути» → wide
python3 frames2mp4.py recB zoom/c6a.mp4 --from 45 --to 50 --width 2880 --crf 14 </dev/null
python3 frames2mp4.py recB zoom/c6b.mp4 --from 100 --to 113 --width 2880 --crf 14 </dev/null
printf "file 'c6a.mp4'\nfile 'c6b.mp4'\n" > zoom/c6.txt
ffmpeg -nostdin -v error -y -f concat -safe 0 -i zoom/c6.txt -c copy zoom/hi6.mp4
python3 zoom.py zoom/hi6.mp4 out/06-offline.ru.mp4 1920x1200 \
  "0:1:.5:.5; 0.5:1:.5:.5; 1.4:2:.42:.15; 4.2:2:.42:.15; 5.3:1.25:.72:.5; 11.2:1.25:.72:.5; 12.4:2:.42:.15; 15.0:2:.42:.15; 16.4:1:.5:.5" --crf 30

# 8 — standing: popover «Стоит · уже N мин», two clips crossfaded
python3 frames2mp4.py recB_part1 zoom/c8a.mp4 --from 803.4 --to 809.6 --width 2880 --crf 14 </dev/null
python3 frames2mp4.py recB_part1 zoom/c8b.mp4 --from 1163.5 --to 1169.7 --width 2880 --crf 14 </dev/null
ffmpeg -nostdin -v error -y -i zoom/c8a.mp4 -i zoom/c8b.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=5.6,format=yuv420p" -c:v libx264 -preset slow -crf 14 -an zoom/hi8.mp4
python3 zoom.py zoom/hi8.mp4 out/08-idle.ru.mp4 1920x1200 "0:1:.5:.5; 0.3:1:.5:.5; 1.2:1.9:.47:.30; 10.9:1.9:.47:.30; 11.7:1:.5:.5" --crf 30

# 7 — recipient's page: header with the badges, then the moving map
python3 frames2mp4.py pub zoom/hi7.mp4 --from 4 --to 36 --speed 2 --width 1170 --crf 14 </dev/null
python3 zoom.py zoom/hi7.mp4 out/07-recipient-link.ru.mp4 720x1558 "0:1:.5:.5; 0.5:1:.5:.5; 1.4:1.3:.42:.06; 4.4:1.3:.42:.06; 5.4:1:.5:.5" --up 1.5 --crf 27

# 9 — driver app: tap mark on «Начать перевозку» (filter time = source time, trimmed after)
ffmpeg -nostdin -v error -y -i recB/rec9.mp4 -i zoom/tap.png -filter_complex \
  "[0:v]crop=720:1528:0:80,fps=30[v];[v][1:v]overlay=x=300:y=460:enable='between(t,3.75,4.15)',trim=start=2.5:end=9.5,setpts=PTS-STARTPTS,format=yuv420p" \
  -c:v libx264 -preset slow -crf 23 -an -movflags +faststart out/09-driver-start.ru.mp4

for f in out/0[126789]-*.ru.mp4; do ffmpeg -nostdin -v error -y -i "$f" -frames:v 1 -c:v libwebp -quality 80 "${f%.mp4}.webp"; done
