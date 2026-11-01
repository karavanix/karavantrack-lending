#!/usr/bin/env python3
"""Screen-Studio-style zoom: the camera eases in on where the action is, holds, eases out.

usage: zoom.py IN.mp4 OUT.mp4 WxH "t:z:cx:cy; t:z:cx:cy; ..." [--up 2] [--crf 24]
Keyframes: time in seconds of IN, zoom (1 = whole frame), centre as 0..1 of the frame.
Between keyframes zoom and centre move with the chosen easing; before the first and after
the last the value holds. --up pre-scales the input so zoompan's integer offsets don't jitter.
--ease smooth: smoothstep (slow in, slow out). --ease snap (default since 4a): quartic ease-out,
the camera jumps at once and settles softly, the way Screen Studio cuts — keep the move 0.4–0.5 s.
"""
import argparse, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("inp"); ap.add_argument("out"); ap.add_argument("size"); ap.add_argument("keys")
ap.add_argument("--up", type=float, default=2)
ap.add_argument("--crf", type=int, default=24)
ap.add_argument("--ease", choices=["smooth", "snap"], default="snap")
a = ap.parse_args()

keys = [tuple(float(v) for v in k.split(":")) for k in a.keys.split(";") if k.strip()]
keys.sort()


def track(i):
    """ffmpeg expression of component i (1 zoom, 2 cx, 3 cy) over input time `it`."""
    expr = f"{keys[-1][i]}"
    for (ta, *va), (tb, *vb) in reversed(list(zip(keys, keys[1:]))):
        a0, b0 = va[i - 1], vb[i - 1]
        p = f"clip((it-{ta})/{max(tb - ta, 1e-3)},0,1)"
        e = f"(1-pow(1-{p},4))" if a.ease == "snap" else f"({p}*{p}*(3-2*{p}))"
        seg = f"({a0}+({b0 - a0})*{e})"
        expr = f"if(lt(it,{tb}),{seg},{expr})"
    return f"if(lt(it,{keys[0][0]}),{keys[0][i]},{expr})"


w, h = a.size.split("x")
z, cx, cy = track(1), track(2), track(3)
vf = (f"scale=iw*{a.up}:ih*{a.up}:flags=lanczos,"
      f"zoompan=z='{z}':x='clip(({cx})*iw-iw/zoom/2,0,iw-iw/zoom)':y='clip(({cy})*ih-ih/zoom/2,0,ih-ih/zoom)'"
      f":d=1:s={w}x{h}:fps=30,format=yuv420p")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", a.inp, "-vf", vf, "-c:v", "libx264", "-preset", "slow",
                "-crf", str(a.crf), "-an", "-movflags", "+faststart", a.out], check=True)
print(a.out)
