import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight request to the database so the free-tier project
// never reaches 7 days of inactivity. Returns no private data.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    return NextResponse.json(
      { ok: res.ok, time: new Date().toISOString() },
      { status: res.ok ? 200 : 502 }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}