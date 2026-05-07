import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_error", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth_error", request.url));
  }

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (allowedEmails.length > 0 && !allowedEmails.includes(data.user.email ?? "")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
