// Página /conectar: a pessoa logada vê qual app pede a ligação (GET ?code=) e aprova ou nega (POST). Nenhuma senha é compartilhada.
const { sql, init, uid, body, guard } = require('./_lib');
module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    await init();
    const id = uid(req); if (!id) return res.status(401).json({ error: 'off' });
    const code = String(req.method === 'GET' ? req.query.code : body(req).code || '').trim();
    const [l] = await sql`SELECT l.code, l.status, l.expires_at, a.name AS app FROM dev_links l JOIN dev_apps a ON a.id = l.app_id WHERE l.code = ${code}`;
    if (!l || new Date(l.expires_at) < new Date()) return res.status(404).json({ error: 'Link inválido ou expirado. Peça outro ao bot.' });
    if (req.method === 'GET') return res.status(200).json({ app: l.app, status: l.status });
    if (l.status !== 'pending') return res.status(409).json({ error: 'Esse link já foi usado.' });
    const ok = body(req).approve !== false;
    await sql`UPDATE dev_links SET status = ${ok ? 'approved' : 'denied'}, user_id = ${ok ? id : null} WHERE code = ${code}`;
    return res.status(200).json({ ok: true, approved: ok });
  } catch (e) { return res.status(500).json({ error: 'Erro no servidor.' }); }
};
