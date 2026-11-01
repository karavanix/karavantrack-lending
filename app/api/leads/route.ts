import { NextResponse } from "next/server";
import { readLead } from "@/lib/leads";

// Accepts the lead form and forwards it to api-server. Bots that fill the honeypot get a cheerful
// 200 and nothing is sent. API_BASE_URL is set on the prod host; locally point it at a stub.
const API_BASE_URL = process.env.API_BASE_URL || "https://api.yool.live/api/v1";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if ((body as { honeypot?: unknown } | null)?.honeypot) return NextResponse.json({ ok: true });

  const { lead, missing } = readLead(body);
  if (!lead) return NextResponse.json({ ok: false, error: `missing ${missing}` }, { status: 400 });

  try {
    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": req.headers.get("user-agent") ?? "",
      },
      body: JSON.stringify({ name: lead.name, company: lead.company, phone: lead.phone, fleet: lead.fleet }),
    });
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
