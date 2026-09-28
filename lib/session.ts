/* Helpers de sesión para Server Components y Server Actions. */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BUSINESS_COOKIE, SESSION_COOKIE, verifySession } from "./auth";
import { canAccessBusiness, getUserById, listBusinessSummaries, listBusinessSummariesForUser, type BusinessSummary, type User } from "./repo";

export async function currentUser(): Promise<User | null> {
  const id = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return id ? getUserById(id) : null;
}

/** Sin sesión válida (o usuario borrado) → cierra la sesión y manda al login. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/admin/salir");
  return user;
}

export async function requireSuperadmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isSuperadmin) redirect("/admin");
  return user;
}

/** Para Server Actions: lanza en vez de redirigir. */
export async function assertAccess(businessId: string): Promise<User> {
  const user = await currentUser();
  if (!user || !(await canAccessBusiness(user, businessId))) throw new Error("Sin acceso a este negocio.");
  return user;
}

export async function assertSuperadmin(): Promise<User> {
  const user = await currentUser();
  if (!user?.isSuperadmin) throw new Error("Solo el administrador de la plataforma puede hacer esto.");
  return user;
}

export const businessesFor = (user: User): Promise<BusinessSummary[]> =>
  user.isSuperadmin ? listBusinessSummaries() : listBusinessSummariesForUser(user.id);

/** Negocio activo del panel: el de la cookie si hay acceso; si no, el primero disponible. */
export async function activeBusinessId(user: User, list: BusinessSummary[]): Promise<string | null> {
  const wanted = (await cookies()).get(BUSINESS_COOKIE)?.value;
  if (wanted && list.some((b) => b.id === wanted)) return wanted;
  return list[0]?.id ?? null;
}
