import { clearCookie } from '../../../lib/core.js';
import { json } from '../../../lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() { return json({ ok: 1 }, 200, { 'Set-Cookie': clearCookie }); }
