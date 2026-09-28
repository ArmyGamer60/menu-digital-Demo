import { NextResponse, type NextRequest } from "next/server";
import { BUSINESS_COOKIE, SESSION_COOKIE } from "@/lib/auth";

/** Cierra una sesión que ya no es válida (usuario borrado, clave cambiada) y vuelve al login. */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(BUSINESS_COOKIE);
  return res;
}
