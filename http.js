import { getAuth, getSecret } from './db.js';
import { userFromCookie } from './core.js';

export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

export const clientIp = req => (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
export const isHttps = req => (req.headers.get('x-forwarded-proto') || '').split(',')[0] === 'https';

export async function readBody(req) {
  const t = await req.text();
  if (t.length > 4.2e6) throw Object.assign(new Error('big'), { status: 413 });   // Vercel chegarasi ~4.5 MB
  try { return JSON.parse(t || '{}'); } catch (e) { throw Object.assign(new Error('json'), { status: 400 }); }
}

// Kirgan foydalanuvchini qaytaradi (yoki null)
export async function whoami(req) {
  const [secret, auth] = await Promise.all([getSecret(), getAuth()]);
  return { u: userFromCookie(secret, req.headers.get('cookie'), auth.data.u), auth, secret };
}

// Route'larni xatodan himoyalash
export const safe = fn => async (...a) => {
  try { return await fn(...a); }
  catch (e) {
    console.error(e);
    const s = e.status || 500;
    return json({ error: s === 413 ? 'Ma’lumot juda katta' : s === 400 ? 'Noto‘g‘ri so‘rov' : 'Server xatosi' }, s);
  }
};
