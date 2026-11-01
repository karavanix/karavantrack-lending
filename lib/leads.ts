// The lead («Большой автопарк?») as the form sends it and the API route reads it.

export const LEAD_FIELDS = ["name", "company", "phone", "fleet"] as const;
export type LeadField = (typeof LEAD_FIELDS)[number];

export type Lead = Record<LeadField, string> & {
  /** Hidden field; a non-empty value means a bot filled the form. */
  honeypot?: string;
};

export const LEADS_ENDPOINT = "/api/leads";

/** Validates a parsed request body; `missing` names the first empty required field. */
export function readLead(body: unknown): { lead: Lead; missing?: undefined } | { lead?: undefined; missing: LeadField } {
  const b = (body ?? {}) as Record<string, unknown>;
  const lead: Partial<Lead> = { honeypot: typeof b.honeypot === "string" ? b.honeypot : undefined };
  for (const k of LEAD_FIELDS) {
    const v = b[k];
    if (typeof v !== "string" || !v.trim()) return { missing: k };
    lead[k] = v;
  }
  return { lead: lead as Lead };
}

/** Browser side: posts the lead to our route; true when it was accepted. */
export async function submitLead(lead: Lead): Promise<boolean> {
  try {
    const res = await fetch(LEADS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    return res.ok;
  } catch {
    return false;
  }
}
