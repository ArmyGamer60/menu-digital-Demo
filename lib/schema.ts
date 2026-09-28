/* Esquema multi-negocio. Idempotente: se ejecuta al abrir la conexión.
   El contenido del menú (categorías, productos, tema, horarios…) vive como documento JSONB
   en `businesses.data`; lo consultable (slug, dominio, estado, contador) va en columnas. */
export const SCHEMA_SQL = `
create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  is_superadmin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists businesses (
  id text primary key,
  slug text not null unique,
  custom_domain text unique,
  status text not null default 'active',
  data jsonb not null,
  order_counter integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id text not null references users(id) on delete cascade,
  business_id text not null references businesses(id) on delete cascade,
  role text not null default 'owner',
  primary key (user_id, business_id)
);
create index if not exists memberships_business on memberships (business_id);

create table if not exists orders (
  business_id text not null references businesses(id) on delete cascade,
  id text not null,
  number integer not null,
  status text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (business_id, id)
);
create index if not exists orders_business_created on orders (business_id, created_at desc);

create table if not exists slug_redirects (
  slug text primary key,
  business_id text not null references businesses(id) on delete cascade
);
`;
