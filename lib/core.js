// Sof mantiq: parol, sessiya cookie, ma'lumotni birlashtirish (bazaga bog'liq emas)
import crypto from 'node:crypto';

/* ---------- Parol va sessiya ---------- */
export const hashPw = (p, salt) => crypto.scryptSync(p, salt, 32).toString('hex');
export function mkAuth(u, p) { const salt = crypto.randomBytes(16).toString('hex'); return { u, salt, h: hashPw(p, salt) }; }
export const okPw = (a, p) => { try { return crypto.timingSafeEqual(Buffer.from(hashPw(p, a.salt), 'hex'), Buffer.from(a.h, 'hex')); } catch (e) { return false; } };
const sign = (secret, s) => crypto.createHmac('sha256', secret).update(s).digest('base64url');

export function mkCookie(secret, u, secure) {
  const exp = Date.now() + 30 * 864e5, b = Buffer.from(JSON.stringify({ u, exp })).toString('base64url');
  return `sid=${b}.${sign(secret, b)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 86400}${secure ? '; Secure' : ''}`;
}
export const clearCookie = 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';

export function userFromCookie(secret, cookieHeader, currentUser) {
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(cookieHeader || ''); if (!m) return null;
  const [b, s] = m[1].split('.'); if (!b || !s) return null;
  try {
    const want = Buffer.from(sign(secret, b)), got = Buffer.from(s);
    if (want.length !== got.length || !crypto.timingSafeEqual(got, want)) return null;
    const o = JSON.parse(Buffer.from(b, 'base64url'));
    return o.exp > Date.now() && o.u === currentUser ? o.u : null;
  } catch (e) { return null; }
}

/* ---------- Ma'lumotni birlashtirish (ikki qurilma bir vaqtda yozsa yo'qolmasin) ---------- */
function union(a, b, key, better) {
  const m = new Map();
  [...(a || []), ...(b || [])].forEach(x => { const k = key(x), o = m.get(k); m.set(k, o ? better(o, x) : x); });
  return [...m.values()];
}
const closed = (o, x) => (x.back || x.bdate) && !(o.back || o.bdate) ? x : o.back || o.bdate ? o : x;

export function merge(key, cur, inc) {
  if (key === 'nb') {
    const r = { ...inc };
    r.loans = union(cur.loans, inc.loans, l => [l.id, l.date, l.t, l.person].join('|'), closed);
    r.hist = union(cur.hist, inc.hist, h => [h.id, h.d, h.t, h.ev].join('|'), (o) => o);
    r.repairs = union(cur.repairs, inc.repairs, x => [x.id, x.sent, x.issue].join('|'), (o, x) => (x.back && !o.back ? x : o));
    r.persons = union(cur.persons, inc.persons, p => p.name.toLowerCase(), (o, x) => x);
    r.reports = union(cur.reports, inc.reports, x => x.date, (o, x) => x);
    return r;
  }
  const r = { ...inc };
  r.books = union(cur.books, inc.books, b => b.code, (o, x) => x);
  r.loans = union(cur.loans, inc.loans, l => [l.code, l.date, l.t, l.person].join('|'), closed);
  return r;
}
export const KEYS = {
  nb: d => d && Array.isArray(d.laptops),
  lib: d => d && Array.isArray(d.books) && Array.isArray(d.loans),
};
