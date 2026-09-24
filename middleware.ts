import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, parseSession } from "@/lib/auth";

/** Protege /admin/*: sin sesión → /admin/login?next=…; con sesión, /admin/login → /admin. */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = parseSession(req.cookies.get(SESSION_COOKIE)?.value) !== null;
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!authed) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
