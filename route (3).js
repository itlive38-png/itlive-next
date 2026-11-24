import { getAuth, getSecret, isLocked, recordFail, clearFails } from '../../../lib/db.js';
import { okPw, mkCookie } from '../../../lib/core.js';
import { json, readBody, clientIp, isHttps, safe } from '../../../lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = safe(async (req) => {
  const ip = clientIp(req);
  if (await isLocked(ip)) return json({ error: 'Ko‘p urinish. 15 soniya kuting' }, 429);
  const b = await readBody(req);
  const a = (await getAuth()).data;
  if (String(b.u || '').trim() === a.u && okPw(a, String(b.p || ''))) {
    await clearFails(ip);
    return json({ ok: 1, u: a.u }, 200, { 'Set-Cookie': mkCookie(await getSecret(), a.u, isHttps(req)) });
  }
  await recordFail(ip);
  return json({ error: 'Login yoki parol noto‘g‘ri' }, 401);
});
