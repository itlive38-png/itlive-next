// Postgres (Neon). Vercel'da xotira va fayl saqlanmaydi, shuning uchun hamma narsa bazada.
// Jadval tuzilmasi eski (Render) versiya bilan bir xil: kv(key, val, ver) — eski ma'lumot o'z-o'zidan ishlaydi.
import pg from 'pg';
import crypto from 'node:crypto';
import { mkAuth } from './core.js';

const g = globalThis;
function pool() {
  if (!g.__itlivePool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    if (!url) throw new Error('DATABASE_URL berilmagan');
    g.__itlivePool = new pg.Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
      max: 3, idleTimeoutMillis: 10000,
    });
  }
  return g.__itlivePool;
}
export const q = (sql, args) => pool().query(sql, args);

export function ready() {
  if (!g.__itliveReady) {
    g.__itliveReady = (async () => {
      await q('create table if not exists kv(key text primary key, val text not null, ver int not null default 0)');
      await q('create table if not exists login_fails(ip text primary key, n int not null default 0, until bigint not null default 0)');
    })().catch(e => { g.__itliveReady = null; throw e; });
  }
  return g.__itliveReady;
}

export async function getKey(key) {
  await ready();
  const r = await q('select val,ver from kv where key=$1', [key]);
  return r.rows[0] ? { ver: r.rows[0].ver, data: JSON.parse(r.rows[0].val) } : null;
}

// Bir kalit ustida ketma-ket (qulflangan) o'qish-o'zgartirish-yozish
export async function mutate(key, fn) {
  await ready();
  const c = await pool().connect();
  try {
    await c.query('begin');
    await c.query('select pg_advisory_xact_lock(hashtext($1))', [key]);
    const r = await c.query('select val,ver from kv where key=$1', [key]);
    const cur = r.rows[0] ? { ver: r.rows[0].ver, data: JSON.parse(r.rows[0].val) } : null;
    const out = await fn(cur);
    if (out) await c.query('insert into kv(key,val,ver) values($1,$2,$3) on conflict(key) do update set val=$2,ver=$3', [key, JSON.stringify(out.data), out.ver]);
    await c.query('commit');
    return out;
  } catch (e) { await c.query('rollback').catch(() => {}); throw e; }
  finally { c.release(); }
}

/* ---------- Sessiya kaliti va admin yozuvi ---------- */
export async function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (g.__itliveSecret) return g.__itliveSecret;
  await ready();
  await q('insert into kv(key,val,ver) values($1,$2,1) on conflict(key) do nothing', ['_secret', JSON.stringify(crypto.randomBytes(32).toString('hex'))]);
  g.__itliveSecret = (await getKey('_secret')).data;
  return g.__itliveSecret;
}

export async function getAuth() {
  let rec = await getKey('auth');
  if (!rec) {
    const a = mkAuth(process.env.ADMIN_USER || 'admin', process.env.ADMIN_PASS || 'admin123');
    await q('insert into kv(key,val,ver) values($1,$2,1) on conflict(key) do nothing', ['auth', JSON.stringify(a)]);
    if (!process.env.ADMIN_PASS) console.warn('ADMIN_PASS berilmagan: boshlang‘ich parol admin123 — darhol o‘zgartiring!');
    rec = await getKey('auth');
  }
  return rec;
}
export async function setAuth(data) {
  await ready();
  await q('update kv set val=$2, ver=ver+1 where key=$1', ['auth', JSON.stringify(data)]);
}

/* ---------- Login urinishlarini cheklash ---------- */
export async function isLocked(ip) {
  await ready();
  const r = await q('select until from login_fails where ip=$1', [ip]);
  return !!r.rows[0] && Number(r.rows[0].until) > Date.now();
}
export async function recordFail(ip) {
  await q(
    `insert into login_fails(ip,n,until) values($1,1,0)
     on conflict(ip) do update set
       n = case when login_fails.n+1 >= 5 then 0 else login_fails.n+1 end,
       until = case when login_fails.n+1 >= 5 then $2 else login_fails.until end`,
    [ip, Date.now() + 15000]);
}
export const clearFails = ip => q('delete from login_fails where ip=$1', [ip]);
