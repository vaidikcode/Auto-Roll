import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access app routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/payroll")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/employees")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/billing")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/approvals")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith("/compliance")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/bag/webhooks).*)",
  ],
};
