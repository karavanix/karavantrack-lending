#!/usr/bin/env python3
"""A 1 Hz drive along the Valhalla truck route between two points, for replay_appium.py.

usage: gen_drive.py OUT.csv FROM_LAT,FROM_LNG TO_LAT,TO_LNG PLAN
PLAN is a comma list of phases: d<minutes> drives on, s<minutes> stands still.
  e.g. "d5,d7,d4,s20" — the drive phases are only labels, they run one after another.
Valhalla must be on localhost:8002 (ssh tunnel). Columns: phase, recorded_at, lat, lng,
accuracy_m, speed_mps, heading_deg.
"""
import csv, json, math, random, sys, urllib.request
from datetime import datetime, timedelta, timezone

random.seed(7)
out, a, b, plan = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
a = tuple(map(float, a.split(","))); b = tuple(map(float, b.split(",")))


def decode6(s):
    pts, i, lat, lng = [], 0, 0, 0
    while i < len(s):
        for which in (0, 1):
            shift = res = 0
            while True:
                c = ord(s[i]) - 63; i += 1
                res |= (c & 0x1F) << shift; shift += 5
                if c < 0x20:
                    break
            d = ~(res >> 1) if res & 1 else res >> 1
            if which == 0:
                lat += d
            else:
                lng += d
        pts.append((lat / 1e6, lng / 1e6))
    return pts


def dist(p, q):
    p1, p2 = math.radians(p[0]), math.radians(q[0])
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(q[1] - p[1]) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def bearing(p, q):
    p1, p2, dl = math.radians(p[0]), math.radians(q[0]), math.radians(q[1] - p[1])
    return (math.degrees(math.atan2(math.sin(dl) * math.cos(p2),
                                    math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl))) + 360) % 360


body = json.dumps({"locations": [{"lat": a[0], "lon": a[1]}, {"lat": b[0], "lon": b[1]}],
                   "costing": "truck", "directions_type": "none"}).encode()
req = urllib.request.Request("http://localhost:8002/route", body, {"Content-Type": "application/json"})
shape = decode6(json.load(urllib.request.urlopen(req, timeout=60))["trip"]["legs"][0]["shape"])
cum = [0.0]
for p, q in zip(shape, shape[1:]):
    cum.append(cum[-1] + dist(p, q))

t = datetime(2026, 1, 1, tzinfo=timezone.utc)
s, seg, v, hdg = 0.0, 0, 0.0, bearing(shape[0], shape[1])
rows = []


def pos(s):
    global seg
    while seg < len(cum) - 2 and cum[seg + 1] < s:
        seg += 1
    p, q = shape[seg], shape[seg + 1]
    f = 0 if cum[seg + 1] == cum[seg] else (s - cum[seg]) / (cum[seg + 1] - cum[seg])
    return (p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f), bearing(p, q)


for phase in plan.split(","):
    kind, minutes = phase[0], float(phase[1:])
    for _ in range(int(minutes * 60)):
        if kind == "d":
            target = 9.5 if s < 2500 else random.uniform(17, 21)  # ~35 km/h out of town, then 60-75
            v += max(-1.5, min(1.2, target - v))
            s = min(s + v, cum[-1])
        else:
            v = 0.0
        p, h = pos(s)
        if v > 0.5:
            hdg = h
        rows.append([phase, t.isoformat().replace("+00:00", "Z"), f"{p[0]:.7f}", f"{p[1]:.7f}",
                     f"{random.uniform(4.5, 8):.1f}", f"{v:.2f}", f"{hdg:.1f}"])
        t += timedelta(seconds=1)

with open(out, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["phase", "recorded_at", "lat", "lng", "accuracy_m", "speed_mps", "heading_deg"])
    w.writerows(rows)
print(f"{len(rows)} rows, {s / 1000:.1f} of {cum[-1] / 1000:.1f} km")
