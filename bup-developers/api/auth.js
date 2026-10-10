// GET = quem sou eu | POST {action: signup | login | logout}
const { sql, init, uid, setCookie, clear, hash, check, body, guard } = require('./_lib');
const tries = new Map();
module.exports = async (req, res) => {
  if (!guard(res)) return;
  try {
    await init();
    if (req.method === 'GET') {
      const id = uid(req); if (!id) return res.status(401).json({ error: 'off' });
      const [u] = await sql`SELECT id, name, email, created_at FROM dev_users WHERE id = ${id}`;
      if (!u) { clear(res); return res.status(401).json({ error: 'off' }); }
      setCookie(res, u.id);
      return res.status(200).json({ user: u });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req);
    if (b.action === 'logout') { clear(res); return res.status(200).json({ ok: true }); }
    const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0], t = tries.get(ip) || { n: 0, at: Date.now() };
    if (Date.now() - t.at > 6e5) { t.n = 0; t.at = Date.now(); }
    if (++t.n > 20) return res.status(429).json({ error: 'Muitas tentativas. Espere alguns minutos.' });
    tries.set(ip, t);
    const email = String(b.email || '').trim().toLowerCase(), pass = String(b.password || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    if (b.action === 'signup') {
      const name = String(b.name || '').trim().slice(0, 30);
      if (name.length < 2) return res.status(400).json({ error: 'Digite seu nome (mínimo 2 letras).' });
      if (pass.length < 8 || pass.length > 100) return res.status(400).json({ error: 'A senha precisa ter entre 8 e 100 caracteres.' });
      const [ex] = await sql`SELECT id FROM dev_users WHERE email = ${email}`;
      if (ex) return res.status(409).json({ error: 'Esse e-mail já tem conta. Entre.' });
      const [u] = await sql`INSERT INTO dev_users(name, email, pass) VALUES(${name}, ${email}, ${hash(pass)}) RETURNING id, name, email`;
      setCookie(res, u.id); return res.status(200).json({ user: u });
    }
    if (b.action === 'login') {
      const [u] = await sql`SELECT id, name, email, pass FROM dev_users WHERE email = ${email}`;
      let ok = false; try { ok = !!u && check(pass, u.pass); } catch { ok = false; }
      if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      setCookie(res, u.id); return res.status(200).json({ user: { id: u.id, name: u.name, email: u.email } });
    }
    return res.status(400).json({ error: 'action' });
  } catch (e) { return res.status(500).json({ error: 'Erro no servidor.' }); }
};
