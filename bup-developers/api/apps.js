// Aplicações do desenvolvedor. GET = lista | POST {action: create | rename | delete | regenerate}
const { sql, init, uid, body, newKey, guard } = require('./_lib');
const PUR = ['discord-bot'], FEAT = ['connect-accounts'];
module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    await init();
    const id = uid(req); if (!id) return res.status(401).json({ error: 'Entre na sua conta primeiro.' });
    if (req.method === 'GET') {
      const apps = await sql`SELECT a.id, a.name, a.purpose, a.feature, a.key_hint, a.created_at, (SELECT COUNT(*)::int FROM dev_links l WHERE l.app_id = a.id AND l.status = 'approved') AS linked FROM dev_apps a WHERE a.owner_id = ${id} ORDER BY a.id DESC`;
      return res.status(200).json({ apps });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req), name = String(b.name || '').trim().slice(0, 40);
    if (b.action === 'create') {
      if (name.length < 2) return res.status(400).json({ error: 'Dê um nome à aplicação (mínimo 2 letras).' });
      if (!PUR.includes(b.purpose) || !FEAT.includes(b.feature)) return res.status(400).json({ error: 'Opção indisponível.' });
      const [n] = await sql`SELECT COUNT(*)::int AS n FROM dev_apps WHERE owner_id = ${id}`;
      if (n.n >= 10) return res.status(400).json({ error: 'Limite de 10 aplicações por conta.' });
      const k = newKey();
      const [a] = await sql`INSERT INTO dev_apps(owner_id, name, purpose, feature, key_hash, key_hint) VALUES(${id}, ${name}, ${b.purpose}, ${b.feature}, ${k.hash}, ${k.hint}) RETURNING id, name`;
      return res.status(200).json({ app: a, key: k.key }); // a chave aparece só agora
    }
    const appId = +b.id; if (!appId) return res.status(400).json({ error: 'id' });
    const [a] = await sql`SELECT id FROM dev_apps WHERE id = ${appId} AND owner_id = ${id}`;
    if (!a) return res.status(404).json({ error: 'Aplicação não encontrada.' });
    if (b.action === 'rename') {
      if (name.length < 2) return res.status(400).json({ error: 'Nome muito curto.' });
      await sql`UPDATE dev_apps SET name = ${name} WHERE id = ${appId}`; return res.status(200).json({ ok: true });
    }
    if (b.action === 'delete') { await sql`DELETE FROM dev_apps WHERE id = ${appId}`; return res.status(200).json({ ok: true }); }
    if (b.action === 'regenerate') {
      const k = newKey(); await sql`UPDATE dev_apps SET key_hash = ${k.hash}, key_hint = ${k.hint} WHERE id = ${appId}`;
      return res.status(200).json({ key: k.key });
    }
    return res.status(400).json({ error: 'action' });
  } catch (e) { return res.status(500).json({ error: 'Erro no servidor.' }); }
};
