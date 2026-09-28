import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/** Hosts propios de la app. Cualquier otro se trata como dominio propio de un negocio. */
function isAppHost(host: string): boolean {
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost") || host.endsWith(".vercel.app")) return true;
  const extra = (process.env.APP_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(host);
}

const appOrigin = () => {
  const h = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return h.replace(/\/$/, "");
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");

  // Dominio propio de un negocio (menu.sucafe.com): la raíz muestra su menú.
  if (host && !isAppHost(host)) {
    if (pathname === "/") return NextResponse.rewrite(new URL(`/sites/${encodeURIComponent(host)}${search}`, req.url));
    if (pathname.startsWith("/admin")) {
      const origin = appOrigin();
      if (origin) return NextResponse.redirect(`${origin}${pathname}${search}`);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin") || pathname === "/admin/salir") return NextResponse.next();

  // /admin/*: sin sesión firmada válida → /admin/login?next=…; con sesión, /admin/login → /admin.
  const authed = (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) !== null;
  if (pathname === "/admin/login") {
    return authed ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!authed) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE); // cookie inválida o de una clave anterior
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|sites/|favicon\\.ico|.*\\.[a-z0-9]{2,5}$).*)"],
};
