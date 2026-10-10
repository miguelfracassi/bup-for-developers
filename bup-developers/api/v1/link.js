// API pública (Authorization: Bearer bup_sk_...). POST = cria pedido de ligação | GET ?code= = consulta o resultado
const crypto = require('crypto');
const { sql, init, body, keyHash, guard } = require('../_lib');
module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    await init();
    const key = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const [a] = key.startsWith('bup_sk_') ? await sql`SELECT id, name FROM dev_apps WHERE key_hash = ${keyHash(key)}` : [];
    if (!a) return res.status(401).json({ error: 'invalid_api_key' });
    const base = 'https://' + (req.headers.host || 'localhost');
    if (req.method === 'POST') {
      const ext = String(body(req).external_id || '').trim().slice(0, 64);
      if (!ext) return res.status(400).json({ error: 'external_id_required' });
      const code = crypto.randomBytes(16).toString('hex');
      await sql`INSERT INTO dev_links(code, app_id, external_id, expires_at) VALUES(${code}, ${a.id}, ${ext}, now() + interval '10 minutes')`;
      return res.status(201).json({ code, url: `${base}/conectar?code=${code}`, expires_in: 600 });
    }
    if (req.method === 'GET') {
      const code = String(req.query.code || '');
      const [l] = await sql`SELECT l.status, l.external_id, l.expires_at, u.id AS uid, u.name FROM dev_links l LEFT JOIN dev_users u ON u.id = l.user_id WHERE l.code = ${code} AND l.app_id = ${a.id}`;
      if (!l) return res.status(404).json({ error: 'not_found' });
      if (l.status === 'pending' && new Date(l.expires_at) < new Date()) return res.status(200).json({ status: 'expired' });
      return res.status(200).json(l.status === 'approved' ? { status: 'approved', external_id: l.external_id, user: { id: l.uid, name: l.name } } : { status: l.status });
    }
    return res.status(405).json({ error: 'method' });
  } catch (e) { return res.status(500).json({ error: 'server_error' }); }
};
