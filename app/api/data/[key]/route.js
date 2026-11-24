import { getKey, mutate } from '../../../../lib/db.js';
import { merge, KEYS } from '../../../../lib/core.js';
import { json, readBody, whoami, safe } from '../../../../lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(req, params) {
  const { key } = await params;
  if (!KEYS[key]) return { res: json({ error: 'topilmadi' }, 404) };
  const { u } = await whoami(req);
  if (!u) return { res: json({ error: 'login' }, 401) };
  return { key };
}

export const GET = safe(async (req, { params }) => {
  const g = await guard(req, params); if (g.res) return g.res;
  const cur = await getKey(g.key);
  if (!cur) return json({ ver: 0, data: null });
  const since = +new URL(req.url).searchParams.get('since');
  return json(since === cur.ver ? { ver: cur.ver, same: 1 } : { ver: cur.ver, data: cur.data });
});

export const PUT = safe(async (req, { params }) => {
  const g = await guard(req, params); if (g.res) return g.res;
  const b = await readBody(req);
  if (!KEYS[g.key](b.data)) return json({ error: 'Noto‘g‘ri ma’lumot' }, 400);
  delete b.data.auth;
  let merged = false, data;
  const out = await mutate(g.key, async (cur) => {
    merged = !!(cur && +b.base !== cur.ver);
    data = merged ? merge(g.key, cur.data, b.data) : b.data;
    return { data, ver: (cur ? cur.ver : 0) + 1 };
  });
  return json({ ver: out.ver, data, merged });
});
