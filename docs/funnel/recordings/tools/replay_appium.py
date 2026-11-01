#!/usr/bin/env python3
"""Replays a gen_drive.py CSV through Appium Settings, with speed and bearing.

usage: replay_appium.py CSV [start_row] [max_rows]
Unlike replay.py (cmd location: no speed), this goes through io.appium.settings'
LocationService, so the app sees speed and heading. Needs the APK installed and
`appops set io.appium.settings android:mock_location allow`. Paces by recorded_at,
progress to replay.state.

On exit (end, Ctrl-C, kill) the phone is HELD at the last point, speed 0: while a
load is tracking, releasing the mock would send the owner's real location into it.
Release only once tracking is off: `adb shell am stopservice io.appium.settings/.LocationService`.
Keep Wi-Fi off while replaying: over Wi-Fi Google's fused location mixes in real fixes.
"""
import csv, subprocess, sys, time, datetime, os, signal, atexit

HERE = os.path.dirname(os.path.abspath(__file__))
SVC = "io.appium.settings/.LocationService"

path = sys.argv[1]
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10**9

rows = list(csv.DictReader(open(path)))[start:start + limit]
sh = subprocess.Popen(["adb", "shell"], stdin=subprocess.PIPE, text=True,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def run(cmd):
    sh.stdin.write(cmd + "\n")
    sh.stdin.flush()


last = None


def hold():
    if last is None:
        return
    subprocess.run(["adb", "shell", f"am start-foreground-service --user 0 -n {SVC} "
                    f"--es latitude {last['lat']} --es longitude {last['lng']} --es altitude 0 "
                    f"--es accuracy {last['accuracy_m']} --es speed 0 --es bearing {last['heading_deg']}"],
                   capture_output=True)
    print(f"{datetime.datetime.now():%H:%M:%S} holding at the last point (mock still on)", flush=True)


atexit.register(hold)
signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))


def ts(r):
    return datetime.datetime.fromisoformat(r["recorded_at"].replace("Z", "+00:00")).timestamp()


prev, phase = None, None
for i, r in enumerate(rows, start):
    if prev is not None:
        time.sleep(min(max(ts(r) - ts(prev), 0.2), 5.0))
    if r.get("phase") != phase:
        phase = r.get("phase")
        print(f"{datetime.datetime.now():%H:%M:%S} row {i}: phase {phase}", flush=True)
    run(f"am start-foreground-service --user 0 -n {SVC} "
        f"--es latitude {r['lat']} --es longitude {r['lng']} --es altitude 0 "
        f"--es accuracy {r['accuracy_m']} --es speed {r['speed_mps']} --es bearing {r['heading_deg']}")
    with open(os.path.join(HERE, "replay.state"), "w") as f:
        f.write(f"{i} {phase} {r['lat']} {r['lng']} {datetime.datetime.now(datetime.timezone.utc):%H:%M:%S}\n")
    prev = last = r

sh.stdin.close()
sh.wait()
