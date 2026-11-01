#!/usr/bin/env python3
"""rec.mjs frames (f_<ms>.jpg) -> MP4 at a constant frame rate, keeping real timing.

usage: frames2mp4.py DIR OUT.mp4 [--from S] [--to S] [--speed X] [--width W] [--crf N] [--crop W:H:X:Y]
--from/--to are seconds from the first frame in DIR; --speed > 1 speeds up.
Output: H.264, yuv420p, no audio, faststart (the landing's format).
"""
import argparse, glob, os, subprocess, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("dir"); ap.add_argument("out")
ap.add_argument("--from", dest="t0", type=float, default=0)
ap.add_argument("--to", dest="t1", type=float, default=1e9)
ap.add_argument("--speed", type=float, default=1)
ap.add_argument("--width", type=int, default=1920)
ap.add_argument("--crf", type=int, default=24)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--crop", default="", help="ffmpeg crop W:H:X:Y in source pixels, before scaling")
a = ap.parse_args()

fs = sorted(glob.glob(os.path.join(a.dir, "f_*.jpg")), key=lambda f: int(os.path.basename(f)[2:-4]))
ts = [int(os.path.basename(f)[2:-4]) / 1000 for f in fs]
base = ts[0]
sel = [(f, t - base) for f, t in zip(fs, ts) if a.t0 <= t - base <= a.t1]
assert sel, "no frames in range"
with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as lst:
    for (f, t), (_, tn) in zip(sel, sel[1:] + [(None, sel[-1][1] + 1 / a.fps)]):
        lst.write(f"file '{os.path.abspath(f)}'\nduration {max(tn - t, 0.001) / a.speed:.4f}\n")
    lst.write(f"file '{os.path.abspath(sel[-1][0])}'\n")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst.name,
                "-vf", (f"crop={a.crop}," if a.crop else "") + f"fps={a.fps},scale={a.width}:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow",
                "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", a.out], check=True)
os.unlink(lst.name)
print(a.out, f"{(sel[-1][1] - sel[0][1]) / a.speed:.1f}s", f"{os.path.getsize(a.out) / 1e6:.2f} MB")
