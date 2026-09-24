import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/** Protege /admin/*: sin sesión firmada válida → /admin/login?next=…; con sesión, /admin/login → /admin. */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) !== null;
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!authed) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE); // cookie inválida o de una contraseña anterior
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
