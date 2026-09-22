import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "https://api.yool.live/api/v1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.honeypot) return NextResponse.json({ ok: true });

    const required = ["name", "company", "phone", "fleet"] as const;
    for (const k of required) {
      if (!body[k] || typeof body[k] !== "string") {
        return NextResponse.json({ ok: false, error: `missing ${k}` }, { status: 400 });
      }
    }

    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers.get("user-agent") ?? "",
      },
      body: JSON.stringify({
        name: body.name,
        company: body.company,
        phone: body.phone,
        fleet: body.fleet,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
