import { NextResponse } from "next/server";

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

    // Placeholder sink: log on the server. Hook up Resend / KV / API later.
    console.log("[lead]", {
      at: new Date().toISOString(),
      name: body.name,
      company: body.company,
      phone: body.phone,
      fleet: body.fleet,
      ua: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
