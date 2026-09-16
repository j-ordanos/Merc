import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
let db: PGlite;
const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const product = '20000000-0000-4000-8000-000000000001';
const key = '30000000-0000-4000-8000-000000000001';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
    create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean); create table storage.objects(id uuid,bucket_id text); alter table storage.objects enable row level security;`);
  const migration = (await readFile('supabase/migrations/202609160001_store.sql', 'utf8')).replace(
    'create extension if not exists pgcrypto;',
    '',
  );
  await db.exec(migration);
  await db.exec(
    `insert into auth.users values ('${alice}'),('${bob}'); insert into categories values('home','Home'); insert into products(id,slug,name,category,price_minor,description,image_url,image_alt) values('${product}','mug','Mug','home',85000,'Test mug','https://example.com/mug.jpg','Mug');`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
async function create(k = key, hash = 'same') {
  return db.query<{ result: { order_id: string; claimed: boolean } }>(
    'select public.create_checkout($1,$2,$3,$4,$5) as result',
    [
      alice,
      k,
      hash,
      JSON.stringify([{ productId: product, quantity: 2 }]),
      JSON.stringify({ name: 'Alice' }),
    ],
  );
}
describe('database invariants and RLS', () => {
  it('creates authoritative snapshots atomically and claims a duplicate only once', async () => {
    const first = await create();
    const second = await create();
    expect(first.rows[0].result.claimed).toBe(true);
    expect(second.rows[0].result.claimed).toBe(false);
    expect(second.rows[0].result.order_id).toBe(first.rows[0].result.order_id);
    const totals = await db.query<{ total_minor: number }>('select total_minor from orders');
    expect(totals.rows).toEqual([{ total_minor: 170000 }]);
    const attempts = await db.query('select * from payment_attempts');
    expect(attempts.rows).toHaveLength(1);
  });
  it('rejects reuse of a key for changed details', async () => {
    await expect(create(key, 'changed')).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  });
  it('rejects duplicate products and unavailable products without leaving partial orders', async () => {
    await expect(
      db.query('select create_checkout($1,$2,$3,$4,$5)', [
        alice,
        crypto.randomUUID(),
        'bad',
        JSON.stringify([
          { productId: product, quantity: 1 },
          { productId: product, quantity: 2 },
        ]),
        '{}',
      ]),
    ).rejects.toThrow('INVALID_CART');
    await db.exec(`update products set available=false where id='${product}'`);
    await expect(create(crypto.randomUUID())).rejects.toThrow('INVALID_CART');
    expect((await db.query('select * from orders')).rows).toHaveLength(1);
    await db.exec(`update products set available=true where id='${product}'`);
  });
  it('isolates customer orders and hides payment secrets', async () => {
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${bob}',false);`,
    );
    expect((await db.query('select * from orders')).rows).toHaveLength(0);
    expect((await db.query('select * from order_items')).rows).toHaveLength(0);
    await expect(db.query('select * from payment_attempts')).rejects.toThrow();
    await expect(create(crypto.randomUUID())).rejects.toThrow();
    await db.exec(`select set_config('request.jwt.claim.sub','${alice}',false);`);
    expect((await db.query('select * from orders')).rows).toHaveLength(1);
    await expect(db.exec("update orders set status='paid'")).rejects.toThrow();
    await db.exec('reset role;');
  });
});
