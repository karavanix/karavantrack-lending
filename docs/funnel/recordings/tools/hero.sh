#!/bin/bash
# Hero high-quality intermediates (hero/hi_cab.mp4 16:9, hero/hi_ph.mp4) from the same segments: FROM TO SPEED.
# The zoomed finals are rendered from them with zoom.py.
set -e
cd "$(dirname "$0")"
SEGS="44.5 48.5 1.3
64.5 66.5 1
70.5 81 2
98 101 1
106 121 2.5"
rm -rf hero/seg && mkdir -p hero/seg
i=0; : > hero/seg/cab.txt; : > hero/seg/ph.txt
while read a b sp; do
  python3 frames2mp4.py recA hero/seg/c$i.mp4 --from $a --to $b --speed $sp --width 2880 --crf 14 --crop 2880:1620:0:128 >/dev/null </dev/null
  ffmpeg -nostdin -v error -y -ss $a -to $b -i recA/rec_hero_0.mp4 -vf "crop=720:1528:0:80,setpts=PTS/$sp,fps=30" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -an hero/seg/p$i.mp4
  echo "file 'c$i.mp4'" >> hero/seg/cab.txt; echo "file 'p$i.mp4'" >> hero/seg/ph.txt; i=$((i+1))
done <<< "$SEGS"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i hero/seg/cab.txt -c copy hero/hi_cab.mp4
ffmpeg -nostdin -v error -y -f concat -safe 0 -i hero/seg/ph.txt -c copy hero/hi_ph.mp4
echo "hi: $(ffprobe -v error -show_entries format=duration -of csv=p=0 hero/hi_cab.mp4)s cab, $(ffprobe -v error -show_entries format=duration -of csv=p=0 hero/hi_ph.mp4)s phone"
