/* Conexión a Postgres (solo servidor).
   - Producción: DATABASE_URL o POSTGRES_URL (Neon / Supabase desde el Marketplace de Vercel).
   - Desarrollo sin URL: PGlite (Postgres embebido) persistido en ./.data/pglite.
   - Tests (MD_DB=memory): PGlite en memoria.
   El esquema se crea solo la primera vez (CREATE … IF NOT EXISTS) y se siembra el negocio demo. */
import postgres from "postgres";
import { SCHEMA_SQL } from "./schema";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
}

export class DbConfigError extends Error {}

const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

function postgresDb(url: string): Db {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const sql = postgres(url, { max: 3, idle_timeout: 20, prepare: false, ssl: local ? false : "require", onnotice: () => {} });
  return {
    query: async <T,>(text: string, params: unknown[] = []) => (await sql.unsafe(text, params as never[])) as unknown as T[],
    exec: async (text) => void (await sql.unsafe(text)),
  };
}

async function pgliteDb(dataDir?: string): Promise<Db> {
  // Import dinámico ignorado por el bundler: PGlite (wasm) nunca entra en el build de producción.
  const { PGlite } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ "@electric-sql/pglite"
  )) as typeof import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);
  return {
    query: async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows,
    exec: async (text) => void (await pg.exec(text)),
  };
}

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) return postgresDb(url);
  if (process.env.MD_DB === "memory") return pgliteDb();
  if (process.env.NODE_ENV === "production") {
    throw new DbConfigError("Falta DATABASE_URL: conecta una base de datos Postgres en Vercel → Storage.");
  }
  const { mkdirSync } = await import("node:fs");
  // Ruta armada en tiempo de ejecución para que el trazado de archivos de Next no la incluya en el deploy.
  const dir = process.env.PGLITE_DIR || [process.cwd(), ".data", "pglite"].join("/");
  mkdirSync(dir, { recursive: true });
  return pgliteDb(dir);
}

type Cache = { ready?: Promise<Db> };
const g = globalThis as typeof globalThis & { __mdDb?: Cache };
const cache: Cache = (g.__mdDb ??= {});

/** Conexión lista (con esquema y demo sembrados). Se comparte entre recargas en desarrollo. */
export function db(): Promise<Db> {
  cache.ready ??= (async () => {
    const d = await connect();
    await d.exec(SCHEMA_SQL);
    const { seedDemo } = await import("./seedDb");
    await seedDemo(d);
    return d;
  })().catch((e: unknown) => {
    cache.ready = undefined; // reintentar en la siguiente petición
    throw e;
  });
  return cache.ready;
}

/** Solo tests: descarta la conexión (PGlite en memoria → base limpia). */
export function resetDbForTests(): void {
  cache.ready = undefined;
}

/** JSON para parámetros `$n::text::jsonb` (el cast desde text evita que el driver lo vuelva a serializar). */
export const json = (v: unknown) => JSON.stringify(v);
