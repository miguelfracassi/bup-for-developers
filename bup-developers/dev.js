// Menu arredondado + sessão. Ícones em SVG (sem emoji).
const IC = {
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 7h16M4 17h16"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 14h.01M15 14h.01"/>',
  down: '<path d="m6 9 6 6 6-6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const $ = (s, r = document) => r.querySelector(s);
async function api(path, data) {
  const r = await fetch('/api/' + path, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw Object.assign(new Error(j.error || 'Erro. Tente de novo.'), { status: r.status });
  return j;
}
let ME; const me = () => (ME ||= api('auth').then((j) => j.user).catch(() => null));
const L = [['/', 'Início'], ['/docs', 'Documentação'], ['/painel', 'Minhas apps']];
async function nav() {
  const p = location.pathname.replace(/\/$/, '') || '/', u = await me();
  const h = document.createElement('header'); h.className = 'nav';
  h.innerHTML = `<div class="nin"><a class="brand" href="/" aria-label="Bup for Developers">${ic('code')}<span class="lg">BUP</span><small>developers</small></a>
  <nav id="mn" aria-label="Principal">${L.map(([a, t]) => `<a href="${a}"${p === a ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <div class="nr"><a class="btn sm" href="/criar-app">${ic('plus')}<span class="t">Criar App</span></a>
  ${u ? `<div class="um"><button class="btn sm g" id="ub" aria-expanded="false">${ic('shield')}<span class="t">${u.name.replace(/</g, '&lt;')}</span>${ic('down')}</button></div>` : `<a class="btn sm g" href="/entrar">${ic('lock')}<span class="t">Entrar</span></a>`}
  <button class="burger" aria-label="Abrir menu" aria-expanded="false">${ic('menu')}</button></div></div>`;
  document.body.prepend(h);
  $('.burger').onclick = (e) => { const o = $('#mn').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };
  const ub = $('#ub'); if (ub) ub.onclick = () => {
    let d = $('.dd'); if (d) { d.remove(); ub.setAttribute('aria-expanded', 'false'); return; }
    d = document.createElement('div'); d.className = 'dd';
    d.innerHTML = `<a href="/painel">${ic('grid')}Conta de desenvolvedor</a><a href="/criar-app">${ic('plus')}Criar App</a><button id="lo">${ic('out')}Sair</button>`;
    $('.um').append(d); ub.setAttribute('aria-expanded', 'true');
    $('#lo').onclick = async () => { await api('auth', { action: 'logout' }).catch(() => {}); location.href = '/'; };
  };
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); const o = b.innerHTML; b.textContent = 'Copiado'; setTimeout(() => (b.innerHTML = o), 1400); } catch {} };
nav();
document.addEventListener('DOMContentLoaded', () => { const o = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), o.unobserve(e.target))), { threshold: .15 }); document.querySelectorAll('.tile').forEach((t) => o.observe(t)); });
