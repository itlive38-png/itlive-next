import { json, whoami, safe } from '../../../lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = safe(async (req) => {
  const { u } = await whoami(req);
  return u ? json({ u }) : json({ error: 'login' }, 401);
});
