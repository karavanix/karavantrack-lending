#!/usr/bin/env python3
"""Demo company for the landing recordings -> one SQL file (one transaction).

Valhalla must be reachable on localhost:8002 (ssh tunnel to Ares).
usage: gen_demo.py OUT.sql
Every row hangs off the demo company / @demo.yool.live users.
After loading: `routing rematch --load-id <id>` for each load with points.
"""
import json, math, os, random, sys, uuid, urllib.request
from datetime import datetime, timedelta, timezone

import bcrypt

random.seed(20261101)
TZ = timezone(timedelta(hours=5))
NS = uuid.UUID("6f1b2a52-1d0e-4b8e-9c55-7a0de3c0a001")
PASSWORD = os.environ["DEMO_PW"]  # demo accounts password, ask the owner


def uid(name):
    return str(uuid.uuid5(NS, name))


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, datetime):
        return "'" + v.isoformat() + "'"
    return "'" + str(v).replace("'", "''") + "'"


def at(s):
    return datetime.strptime(s, "%d.%m %H:%M").replace(year=2026, tzinfo=TZ)


# ── people ──
# Same algorithm as $2b$; the $2a$ prefix is what Go's bcrypt was checked with.
pw_hash = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt(14)).decode().replace("$2b$", "$2a$", 1)
USERS = {
    # key: (first, last, role, email, can_login)
    "dilnoza": ("Дилноза", "Юсупова", "shipper", "dilnoza@demo.yool.live", True),
    "timur": ("Тимур", "Рахимов", "shipper", "timur@demo.yool.live", False),
    "rustam": ("Рустам", "Алиев", "carrier", "rustam@demo.yool.live", True),
    "sherzod": ("Шерзод", "Каримов", "carrier", "sherzod@demo.yool.live", False),
    "bakhtiyor": ("Бахтиёр", "Назаров", "carrier", "bakhtiyor@demo.yool.live", False),
    "anvar": ("Анвар", "Тошматов", "carrier", "anvar@demo.yool.live", False),
    "jasur": ("Жасур", "Эргашев", "carrier", "jasur@demo.yool.live", False),
}
CARRIER_ALIAS = {
    "rustam": "Рустам, MAN TGS",
    "sherzod": "Шерзод, Isuzu FVR",
    "bakhtiyor": "Бахтиёр, DAF XF",
    "anvar": "Анвар, MAN TGS",
    "jasur": "Жасур, Shacman X3000",
}
COMPANY = uid("company")
COMPANY_NAME = "Карвон Логистик"

# ── places ──
P = {
    "tash_sergeli": ("Ташкент, Сергелийский район, промзона", 41.2185, 69.2210),
    "tash_chilanzar": ("Ташкент, Чиланзарский район", 41.2740, 69.1900),
    "tash_yunusabad": ("Ташкент, Юнусабадский район", 41.3700, 69.2900),
    "andijan": ("Андижан, промзона", 40.7700, 72.3300),
    "bukhara": ("Бухара, промзона", 39.7600, 64.4500),
    "angren": ("Ангрен, промзона", 41.0080, 70.1000),
    "jizzakh": ("Джизак, промзона", 40.1200, 67.8500),
    "namangan": ("Наманган, промзона", 40.9900, 71.6400),
    "karshi": ("Карши, промзона", 38.8500, 65.8000),
    "bekabad": ("Бекабад, промзона", 40.2150, 69.2300),
    "samarkand": ("Самарканд, промзона", 39.6700, 66.9200),
    "gulistan": ("Гулистан, промзона", 40.4900, 68.7700),
    "navoi": ("Навои, промзона", 40.1000, 65.3800),
    "fergana": ("Фергана, промзона", 40.3800, 71.7600),
    "termez": ("Термез, промзона", 37.2400, 67.2900),
    "kokand": ("Коканд, промзона", 40.5300, 70.9200),
}

# ref, title, description, driver, from, to, created, pickup (start), final status
LOADS = [
    ("YL-1031", "Хлопковая пряжа, 18 т", "32 паллеты, тент. Разгрузка задним бортом.", "sherzod", "tash_sergeli", "andijan", "13.10 16:20", "14.10 07:30", "confirmed"),
    ("YL-1033", "Керамическая плитка, 20 т", "Хрупкое, 24 паллеты. Не штабелировать.", "bakhtiyor", "tash_chilanzar", "bukhara", "15.10 11:05", "16.10 06:00", "confirmed"),
    ("YL-1034", "Цемент М400, 22 т", "Мешки по 50 кг.", "anvar", "angren", "jizzakh", "17.10 15:40", "18.10 08:00", "cancelled"),
    ("YL-1036", "Минеральная вода, 22 т", "Бутылки 1,5 л в плёнке, 26 паллет.", "anvar", "tash_yunusabad", "namangan", "19.10 17:10", "20.10 07:00", "confirmed"),
    ("YL-1038", "Сахар, 20 т", "Мешки по 50 кг, 400 мест.", "jasur", "tash_sergeli", "karshi", "22.10 14:30", "23.10 06:30", "confirmed"),
    ("YL-1040", "Металлопрокат, 21 т", "Арматура А500, пачки по 2 т. Нужен кран на выгрузке.", "sherzod", "bekabad", "tash_yunusabad", "25.10 18:00", "26.10 09:00", "confirmed"),
    ("YL-1042", "Бытовая техника, 12 т", "Коробки, 18 паллет. Документы у водителя.", "rustam", "tash_chilanzar", "samarkand", "27.10 12:15", "28.10 07:00", "confirmed"),
    ("YL-1044", "Мебель, 8 т", "Упакованная мебель, 60 мест. Выгрузка на склад получателя.", "bakhtiyor", "tash_sergeli", "gulistan", "30.10 19:30", "31.10 14:00", "dropped_off"),
    ("YL-1046", "Удобрения, 20 т", "Аммиачная селитра в биг-бэгах.", "anvar", "navoi", "tash_sergeli", "31.10 17:40", "02.11 08:00", "assigned"),
    ("YL-1047", "Кирпич, 22 т", "Облицовочный кирпич на поддонах.", None, "tash_sergeli", "fergana", "31.10 20:10", "03.11 07:00", "created"),
    ("YL-1048", "Растительное масло, 18 т", "Бутылки 5 л, 22 паллеты.", None, "tash_yunusabad", "termez", "31.10 21:25", "04.11 06:00", "created"),
    ("YL-1049", "Стройматериалы, 18 т", "Сухие смеси и профиль, 20 паллет.", None, "angren", "kokand", "01.11 02:40", "01.11 14:00", "created"),
]
ORDER = ["created", "assigned", "accepted", "picking_up", "picked_up", "in_transit",
         "dropping_off", "dropped_off", "confirmed"]


# ── geometry ──
def valhalla_route(a, b):
    body = json.dumps({"locations": [{"lat": a[1], "lon": a[2]}, {"lat": b[1], "lon": b[2]}],
                       "costing": "truck", "directions_type": "none"}).encode()
    req = urllib.request.Request("http://localhost:8002/route", body, {"Content-Type": "application/json"})
    trip = json.load(urllib.request.urlopen(req, timeout=60))["trip"]
    return decode6(trip["legs"][0]["shape"])


def decode6(s):
    pts, i, lat, lng = [], 0, 0, 0
    while i < len(s):
        for which in (0, 1):
            shift = res = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                res |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            d = ~(res >> 1) if res & 1 else res >> 1
            if which == 0:
                lat += d
            else:
                lng += d
        pts.append((lat / 1e6, lng / 1e6))
    return pts


def dist(a, b):
    r = 6371000
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def bearing(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dl = math.radians(b[1] - a[1])
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def jitter(p, m):
    dy, dx = random.gauss(0, m), random.gauss(0, m)
    return (p[0] + dy / 111320, p[1] + dx / (111320 * math.cos(math.radians(p[0]))))


def drive(shape, start, battery):
    """Points every ~10 s along the shape; one 40-min break on long trips.
    Returns (points, arrival time, battery at arrival)."""
    cum = [0.0]
    for a, b in zip(shape, shape[1:]):
        cum.append(cum[-1] + dist(a, b))
    total = cum[-1]
    brk = total * random.uniform(0.45, 0.6) if total > 220_000 else None
    pts, t, s, seg, odo = [], start, 0.0, 0, 0.0
    pts.append(point(shape[0], t, 0, bearing(shape[0], shape[1]), "motionchange", True, battery, odo))
    while s < total:
        city = s < 7000 or total - s < 7000
        v = (random.uniform(7, 10) if city else random.uniform(17.5, 22.5))  # m/s
        step = v * 10
        s = min(s + step, total)
        t += timedelta(seconds=10 + random.uniform(-0.6, 0.6))
        while seg < len(cum) - 2 and cum[seg + 1] < s:
            seg += 1
        a, b = shape[seg], shape[seg + 1]
        f = 0 if cum[seg + 1] == cum[seg] else (s - cum[seg]) / (cum[seg + 1] - cum[seg])
        p = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
        battery = max(0.18, battery - 0.00045)
        odo += step
        pts.append(point(p, t, v, bearing(a, b), None, True, battery, odo))
        if brk is not None and s >= brk:
            brk = None
            pts.append(point(p, t + timedelta(seconds=30), 0, bearing(a, b), "motionchange", False, battery, odo))
            t += timedelta(minutes=random.randint(35, 50))
            pts.append(point(p, t, 0, bearing(a, b), "motionchange", True, battery, odo))
    pts.append(point(shape[-1], t + timedelta(seconds=40), 0, pts[-1]["heading_deg"], "motionchange", False, battery, odo))
    return pts, t, battery


def point(p, t, v, hdg, event, moving, battery, odo):
    p = jitter(p, 3.0)
    return dict(uuid=str(uuid.uuid4()), recorded_at=t, lat=round(p[0], 7), lng=round(p[1], 7),
                accuracy_m=round(random.uniform(3.8, 9.5), 1), speed_mps=round(v, 2) if v else 0.0,
                heading_deg=round(hdg, 1), event=event, is_moving=moving,
                activity_type="in_vehicle" if moving else "still",
                activity_confidence=random.randint(85, 100), odometer_m=round(odo, 1),
                battery_level=round(battery, 3), is_charging=False)


# ── SQL ──
out = []
w = out.append
w("BEGIN;")
w(f"DO $$ BEGIN IF EXISTS (SELECT 1 FROM companies WHERE id = {q(COMPANY)}) "
  "THEN RAISE EXCEPTION 'demo company already exists'; END IF; END $$;")

created_base = at("10.10 11:00")
for k, (fn, ln, role, email, login) in USERS.items():
    w("INSERT INTO users (id, first_name, last_name, email, password_hash, role, status, created_at, updated_at) "
      f"VALUES ({q(uid(k))}, {q(fn)}, {q(ln)}, {q(email)}, {q(pw_hash if login else None)}, {q(role)}, 'active', "
      f"{q(created_base)}, {q(created_base)});")

w(f"INSERT INTO companies (id, owner_id, name, status, created_at, updated_at) VALUES "
  f"({q(COMPANY)}, {q(uid('dilnoza'))}, {q(COMPANY_NAME)}, 'active', {q(created_base)}, {q(created_base)});")
w(f"INSERT INTO company_members (company_id, member_id, alias, role, created_at, updated_at) VALUES "
  f"({q(COMPANY)}, {q(uid('dilnoza'))}, 'Дилноза Юсупова', 'owner', {q(created_base)}, {q(created_base)}), "
  f"({q(COMPANY)}, {q(uid('timur'))}, 'Тимур Рахимов', 'admin', {q(created_base + timedelta(hours=1))}, {q(created_base + timedelta(hours=1))});")
for i, (k, alias) in enumerate(CARRIER_ALIAS.items()):
    t = created_base + timedelta(hours=2, minutes=7 * i)
    w(f"INSERT INTO company_carriers (company_id, carrier_id, alias, created_at, updated_at) VALUES "
      f"({q(COMPANY)}, {q(uid(k))}, {q(alias)}, {q(t)}, {q(t)});")

summary = []
for ref, title, desc, drv, frm, to, created_s, start_s, final in LOADS:
    lid = uid("load:" + ref)
    a, b = P[frm], P[to]
    created, start = at(created_s), at(start_s)
    member = "timur" if ref in ("YL-1036", "YL-1040", "YL-1047") else "dilnoza"
    plan_drop = start + timedelta(hours=8 if dist(a[1:], b[1:]) > 250_000 else 5)

    steps = []  # (to_status, time, user, location or None)
    pts = []
    steps.append(("created", created, member, None))
    if final != "created":
        steps.append(("assigned", created + timedelta(minutes=random.randint(12, 40)), member, None))
    if final == "cancelled":
        steps.append(("cancelled", start - timedelta(hours=14), member, None))
    elif final not in ("created", "assigned"):
        steps.append(("accepted", steps[-1][1] + timedelta(minutes=random.randint(15, 70)), drv, None))
        shape = valhalla_route(a, b)
        t_pick = start
        t_loaded = t_pick + timedelta(minutes=random.randint(40, 65))
        t_go = t_loaded + timedelta(minutes=random.randint(5, 12))
        battery = random.uniform(0.78, 0.95)
        pts, arrive, battery = drive(shape, t_go, battery)
        t_unload = arrive + timedelta(minutes=random.randint(3, 9))
        t_done = t_unload + timedelta(minutes=random.randint(30, 55))
        steps += [("picking_up", t_pick, drv, shape[0]), ("picked_up", t_loaded, drv, shape[0]),
                  ("in_transit", t_go, drv, shape[0]), ("dropping_off", t_unload, drv, shape[-1]),
                  ("dropped_off", t_done, drv, shape[-1])]
        if final == "confirmed":
            steps.append(("confirmed", t_done + timedelta(minutes=random.randint(40, 150)), member, None))

    carrier = uid(drv) if drv and final != "created" else None
    updated = steps[-1][1]
    w("INSERT INTO loads (id, company_id, member_id, carrier_id, reference_id, title, description, status, "
      "pickup_address, pickup_lat, pickup_lng, pickup_at, dropoff_address, dropoff_lat, dropoff_lng, dropoff_at, "
      "created_at, updated_at) VALUES "
      f"({q(lid)}, {q(COMPANY)}, {q(uid(member))}, {q(carrier)}, {q(ref)}, {q(title)}, {q(desc)}, {q(final)}, "
      f"{q(a[0])}, {a[1]}, {a[2]}, {q(start)}, {q(b[0])}, {b[1]}, {b[2]}, {q(plan_drop)}, {q(created)}, {q(updated)});")
    prev = "created"
    for to_status, t, who, loc in steps:
        w("INSERT INTO load_status_histories (load_id, user_id, from_status, to_status, note, created_at) VALUES "
          f"({q(lid)}, {q(uid(who))}, {q(prev)}, {q(to_status)}, '', {q(t)});")
        if loc is not None:
            p = jitter(loc, 4)
            w("INSERT INTO load_location_points (load_id, carrier_id, load_status_history_id, recorded_at, lat, lng, "
              "accuracy_m, is_mock) SELECT "
              f"{q(lid)}, {q(uid(who))}, currval('load_status_histories_id_seq'), {q(t)}, {p[0]:.7f}, {p[1]:.7f}, "
              f"{round(random.uniform(4, 12), 1)}, true;")
        prev = to_status

    cols = ["uuid", "recorded_at", "lat", "lng", "accuracy_m", "speed_mps", "heading_deg", "event", "is_moving",
            "activity_type", "activity_confidence", "odometer_m", "battery_level", "is_charging"]
    for i in range(0, len(pts), 400):
        rows = ",\n".join(
            "(" + ", ".join([q(lid), q(carrier), "true"] + [q(p[c]) for c in cols]) + ")" for p in pts[i:i + 400])
        w(f"INSERT INTO load_location_points (load_id, carrier_id, is_mock, {', '.join(cols)}) VALUES\n{rows};")
    summary.append((ref, final, lid, len(pts)))

w("COMMIT;")
open(sys.argv[1], "w").write("\n".join(out) + "\n")
for s in summary:
    print(*s)
