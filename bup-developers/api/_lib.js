// Banco Neon, senha (scrypt), sessão por cookie assinado e chaves de API (guardadas só como hash).
const { neon } = require('@neondatabase/serverless');
const c = require('crypto');
let db, ready;
const sql = (...a) => (db ||= neon(process.env.DATABASE_URL))(...a);
const init = () => (ready ||= (async () => {
  await sql`CREATE TABLE IF NOT EXISTS dev_users(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS dev_apps(id SERIAL PRIMARY KEY, owner_id INT NOT NULL REFERENCES dev_users(id) ON DELETE CASCADE, name TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'discord-bot', feature TEXT NOT NULL DEFAULT 'connect-accounts', key_hash TEXT NOT NULL, key_hint TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS dev_links(code TEXT PRIMARY KEY, app_id INT NOT NULL REFERENCES dev_apps(id) ON DELETE CASCADE, external_id TEXT NOT NULL, user_id INT REFERENCES dev_users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending', expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
})().catch((e) => { ready = null; throw e; }));
const sign = (v) => c.createHmac('sha256', process.env.AUTH_SECRET || '').update(v).digest('base64url');
const DAYS = 180;
const setCookie = (res, id) => {
  const v = id + '.' + (Date.now() + DAYS * 864e5);
  res.setHeader('Set-Cookie', `dev_session=${v}.${sign(v)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${DAYS * 86400}${process.env.VERCEL ? '; Secure' : ''}`);
};
const clear = (res) => res.setHeader('Set-Cookie', 'dev_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
const uid = (req) => {
  const m = (req.headers.cookie || '').match(/dev_session=(\d+)\.(\d+)\.([\w-]+)/);
  if (!m || !process.env.AUTH_SECRET) return null;
  const a = Buffer.from(sign(m[1] + '.' + m[2])), b = Buffer.from(m[3]);
  return a.length === b.length && c.timingSafeEqual(a, b) && +m[2] > Date.now() ? +m[1] : null;
};
const hash = (p) => { const s = c.randomBytes(16).toString('hex'); return s + ':' + c.scryptSync(p, s, 64).toString('hex'); };
const check = (p, h) => { const [s, k] = String(h).split(':'); return c.timingSafeEqual(c.scryptSync(p, s, 64), Buffer.from(k, 'hex')); };
const body = (req) => { let b = req.body; try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch { b = {}; } return b || {}; };
const newKey = () => { const k = 'bup_sk_' + c.randomBytes(24).toString('hex'); return { key: k, hash: c.createHash('sha256').update(k).digest('hex'), hint: k.slice(-4) }; };
const keyHash = (k) => c.createHash('sha256').update(String(k)).digest('hex');
const guard = (res) => { res.setHeader('Cache-Control', 'no-store'); if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) { res.status(500).json({ error: 'Configure DATABASE_URL e AUTH_SECRET na Vercel.' }); return false; } return true; };
module.exports = { sql, init, uid, setCookie, clear, hash, check, body, newKey, keyHash, guard };
