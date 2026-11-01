#!/bin/bash
# Hero clips #1 (cabinet, 16:9) and #2 (phone) from the same timeline segments: FROM TO SPEED
set -e
cd "$(dirname "$0")"
SEGS="44.5 48.5 1.3
64.5 66.5 1
70.5 81 2
98 101 1
106 119 2.5"
rm -rf hero/seg && mkdir -p hero/seg
i=0; : > hero/seg/cab.txt; : > hero/seg/ph.txt
while read a b sp; do
  python3 frames2mp4.py recA hero/seg/c$i.mp4 --from $a --to $b --speed $sp --width 1920 --crf 20 --crop 2880:1620:0:128 >/dev/null </dev/null
  ffmpeg -nostdin -v error -y -ss $a -to $b -i recA/rec_hero_0.mp4 -vf "crop=720:1528:0:80,setpts=PTS/$sp,fps=30" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -an hero/seg/p$i.mp4
  echo "file 'c$i.mp4'" >> hero/seg/cab.txt; echo "file 'p$i.mp4'" >> hero/seg/ph.txt; i=$((i+1))
done <<< "$SEGS"
ffmpeg -v error -y -f concat -safe 0 -i hero/seg/cab.txt -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -an -movflags +faststart out/01-hero-cabinet.ru.mp4
ffmpeg -v error -y -f concat -safe 0 -i hero/seg/ph.txt -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -an -movflags +faststart out/02-hero-phone.ru.mp4
for n in 01-hero-cabinet 02-hero-phone; do
  ffmpeg -v error -y -i out/$n.ru.mp4 -frames:v 1 -c:v libwebp -quality 80 out/$n.ru.webp
  echo "$n $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/$n.ru.mp4)s $(du -k out/$n.ru.mp4 | cut -f1)KB"
done
