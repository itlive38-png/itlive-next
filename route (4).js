import { setAuth } from '../../../lib/db.js';
import { okPw, mkAuth, mkCookie } from '../../../lib/core.js';
import { json, readBody, whoami, isHttps, safe } from '../../../lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = safe(async (req) => {
  const { u, auth, secret } = await whoami(req);
  if (!u) return json({ error: 'login' }, 401);
  const b = await readBody(req), a = auth.data;
  if (!okPw(a, String(b.cur || ''))) return json({ error: 'Joriy parol noto‘g‘ri' }, 403);
  const nu = String(b.u || '').trim(), np = String(b.p || '');
  if (nu.length < 3) return json({ error: 'Login kamida 3 belgi' }, 400);
  if (np && np.length < 6) return json({ error: 'Parol kamida 6 belgi' }, 400);
  await setAuth(np ? mkAuth(nu, np) : { ...a, u: nu });
  return json({ ok: 1 }, 200, { 'Set-Cookie': mkCookie(secret, nu, isHttps(req)) });
});
