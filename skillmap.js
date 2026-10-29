// Skills map (port of the «Карта навыков 4 класса» artifact): a 3D cloud of criteria / skills linked by prerequisites,
// coloured by the results of the class or of one student. Results are simulated from the prototype's class metrics.
// Uses app.js globals at call time (S, STUDENTS, classMetrics, render); every name here is prefixed with sk to avoid clashes.
'use strict';
const SKD = window.SKILL_DATA;
const skSK = new Map(SKD.skills.map(s => [s.id, s]));
const skSUB = new Map(SKD.subs.map(s => [s.code, s]));
const skCR = new Map(); SKD.skills.forEach(s => s.crit.forEach(c => skCR.set(c.id, { ...c, skill: s.id })));
const SK_GROUPS = [
  { id: 'num', name: 'Многозначные числа', subs: ['4-1.1.1', '4-1.1.2'], color: '#5800e5' },
  { id: 'cmp', name: 'Сравнение и округление', subs: ['4-1.1.3', '4-1.1.4'], color: '#a78bfa' },
  { id: 'add', name: 'Сложение и вычитание', subs: ['4-1.2.1'], color: '#14a06b' },
  { id: 'mul', name: 'Умножение и деление', subs: ['4-1.2.2', '4-1.2.3'], color: '#e6a700' },
  { id: 'div', name: 'Делители и кратные', subs: ['4-1.2.4'], color: '#e8368f' },
  { id: 'prop', name: 'Свойства, порядок действий', subs: ['4-1.2.5'], color: '#101828' },
  { id: 'task', name: 'Задачи в несколько действий', subs: ['4-1.2.6'], color: '#f26b1d' },
  { id: 'alg', name: 'Выражения и уравнения', subs: ['4-2.1.1', '4-2.1.2', '4-2.2.2', '4-2.2.3'], color: '#0ea5c6' },
  { id: 'geo', name: 'Периметр и площадь', subs: ['4-4.2.1', '4-4.2.2'], color: '#7cb518' },
  { id: 'g3', name: 'Из 3 класса', subs: [null], color: '#9a94a3' },
];
const skGroupOfSub = new Map(); SK_GROUPS.forEach(g => g.subs.forEach(s => skGroupOfSub.set(s, g)));
const skGroupOf = sid => skGroupOfSub.get(skSK.get(sid).sub) || SK_GROUPS[SK_GROUPS.length - 1];
const skHash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };
const skEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const skPct = v => v == null ? '—' : Math.round(v) + '%';
const skPlural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

// Course order: `first` is the order of the lesson that teaches a criterion; prototype lesson N = course order N − 2.
const skMaxOrder = Math.max(...[...skCR.values()].map(c => c.first ?? 0));
const skSkillFirst = sid => { const v = skSK.get(sid).crit.map(c => c.first).filter(x => x != null); return v.length ? Math.min(...v) : null; };
const skSubFirst = new Map();
SKD.skills.forEach(s => { const f = skSkillFirst(s.id); if (f != null && s.sub) skSubFirst.set(s.sub, Math.min(skSubFirst.get(s.sub) ?? 1e9, f)); });
const skOrderOf = sid => { const s = skSK.get(sid); if (s.grade === 3) return -6; return skSkillFirst(sid) ?? skSubFirst.get(s.sub) ?? skMaxOrder + 1 + skHash(sid) * 4; };

const SK_STATUS = { ok: { name: 'Освоено', color: '#22a06b' }, mid: { name: 'Закрепить', color: '#e6a700' }, gap: { name: 'Пробел', color: '#f25a7d' }, none: { name: 'Ещё не изучали', color: '#d6d3dc' } };
const skStatusOf = v => v == null ? 'none' : v >= 75 ? 'ok' : v >= 55 ? 'mid' : 'gap';

// Simulated criterion results: a student's level follows their overall success; a weak prerequisite pulls the result down.
let skSim = null, skSimNow = null;
function skNow() { return S.lesson.ended ? 20 : 19; }
function skResults() {
  const now = skNow(); if (skSimNow === now) return skSim;
  const studied = [...skCR.values()].filter(c => skSK.get(c.skill).grade === 3 || (c.first != null && c.first <= now))
    .sort((a, b) => (skSK.get(a.skill).grade === 3 ? -1 : a.first) - (skSK.get(b.skill).grade === 3 ? -1 : b.first));
  const preOf = new Map(); SKD.edges.forEach(e => (preOf.get(e.t) || preOf.set(e.t, []).get(e.t)).push(e.s));
  const sig = x => 1 / (1 + Math.exp(-x));
  skSim = STUDENTS.map((name, i) => {
    const ab = (classMetrics(i).overall - 66) / 16, sc = {};
    for (const c of studied) {
      const ps = (preOf.get(c.id) || []).filter(p => sc[p] != null);
      const pm = ps.length ? ps.reduce((s, p) => s + sc[p], 0) / ps.length / 100 : 0.75;
      const d = (skHash(c.id + 'd') - 0.5) * 1.8;
      const v = 100 * sig(ab - d + 1.65 + 1.7 * (pm - 0.75)) + (skHash(name + c.id) - 0.5) * 16;
      sc[c.id] = Math.round(Math.max(0, Math.min(100, v)));
    }
    return sc;
  });
  skSimNow = now; return skSim;
}
const skCrits = id => skCR.has(id) ? [id] : skSK.get(id).crit.map(c => c.id);
function skScore(si, id) { const R = skResults(); const v = skCrits(id).map(c => R[si][c]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
function skClassScore(id) { const v = STUDENTS.map((_, i) => skScore(i, id)).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
const skVal = (si, id) => si == null ? skClassScore(id) : skScore(si, id);

// Model: nodes are criteria or skills, edges are prerequisite links; positions from a light 3D force layout (cached per mode).
const skModels = {};
function skModel(mode = S.sk.mode) {
  if (skModels[mode]) return skModels[mode];
  const nodes = new Map(), edges = new Map();
  const add = (x, e) => { x.ev.push(...e.ev); if (e.x) x.xr.push(e.x); else x.warm = true; };
  if (mode === 'crit') {
    for (const c of skCR.values()) { const s = skSK.get(c.skill); nodes.set(c.id, { id: c.id, title: c.text, skill: s, group: skGroupOf(s.id), order: s.grade === 3 ? -6 : (c.first ?? skOrderOf(s.id)) }); }
    for (const e of SKD.edges) if (nodes.has(e.s) && nodes.has(e.t)) { const k = e.s + '>' + e.t; const x = edges.get(k) || { s: e.s, t: e.t, ev: [], xr: [], warm: false }; add(x, e); edges.set(k, x); }
  } else {
    for (const s of SKD.skills) nodes.set(s.id, { id: s.id, title: s.name, skill: s, group: skGroupOf(s.id), order: skOrderOf(s.id) });
    for (const e of SKD.edges) { const a = skCR.get(e.s).skill, b = skCR.get(e.t).skill; if (a === b) continue;
      const k = a + '>' + b; const x = edges.get(k) || { s: a, t: b, ev: [], xr: [], warm: false }; add(x, e); edges.set(k, x); }
  }
  const pre = new Map(), post = new Map();
  for (const e of edges.values()) { (pre.get(e.t) || pre.set(e.t, []).get(e.t)).push(e); (post.get(e.s) || post.set(e.s, []).get(e.s)).push(e); }
  const RING = ['g3', 'num', 'cmp', 'add', 'task', 'prop', 'alg', 'geo', 'div', 'mul'], lo = -6, hi = skMaxOrder + 5;
  for (const n of nodes.values()) {
    const deg = (pre.get(n.id) || []).length + (post.get(n.id) || []).length, yn = (n.order - lo) / (hi - lo);
    const ang = (RING.indexOf(n.group.id) + 0.1 + 0.8 * skHash(n.id + 'a')) / RING.length * Math.PI * 2;
    const r = (0.2 + 0.8 * Math.sqrt(skHash(n.id + 'r'))) * (0.35 + 0.55 * yn) * 0.9, y0 = (yn - 0.5) * 0.8;
    Object.assign(n, { deg, y0, x: Math.cos(ang) * r, z: Math.sin(ang) * r, y: y0 + (skHash(n.id + 'y') - 0.5) * 0.12 });
  }
  const arr = [...nodes.values()], E2 = [...edges.values()].map(e => [nodes.get(e.s), nodes.get(e.t)]);
  const REST = 0.09, KS = 0.06, KY = 0.02, KG = 0.004, REP = 0.0009, RMIN = 0.16;
  for (let it = 0; it < 220; it++) {
    const cool = 1 - it / 260;
    for (const [a, b] of E2) { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6;
      const f = KS * cool * (d - REST) / d; a.x += dx * f; a.y += dy * f; a.z += dz * f; b.x -= dx * f; b.y -= dy * f; b.z -= dz * f; }
    for (let i = 0; i < arr.length; i++) { const a = arr[i];
      for (let j = i + 1; j < arr.length; j++) { const b = arr[j]; const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > RMIN * RMIN) continue; const f = REP * cool / (d2 + 0.002); a.x -= dx * f; a.y -= dy * f; a.z -= dz * f; b.x += dx * f; b.y += dy * f; b.z += dz * f; } }
    for (const n of arr) { n.y += (n.y0 - n.y) * KY; n.x -= n.x * KG; n.z -= n.z * KG; }
  }
  const mean = k => arr.reduce((s, n) => s + n[k], 0) / arr.length, mx = mean('x'), my = mean('y'), mz = mean('z');
  arr.forEach(n => { n.x -= mx; n.y -= my; n.z -= mz; });
  const ext = Math.max(...arr.map(n => Math.max(Math.hypot(n.x, n.z) * 1.15, Math.abs(n.y))));
  arr.forEach(n => { n.x /= ext; n.y /= ext; n.z /= ext; });
  return (skModels[mode] = { nodes, edges: [...edges.values()], pre, post });
}
function skChain(M, id) { const seen = new Set(), q = [id];
  while (q.length) { const v = q.pop(); for (const e of M.pre.get(v) || []) if (!seen.has(e.s) && e.s !== id) { seen.add(e.s); q.push(e.s); } } return seen; }
function skDependents(M, id) { const seen = new Set(), q = [id];
  while (q.length) { const v = q.pop(); for (const e of M.post.get(v) || []) if (!seen.has(e.t) && e.t !== id) { seen.add(e.t); q.push(e.t); } } return seen; }
let skSelKey = '', skSelSet = null, skUnlocks = null;
function skSelection(M) {
  const sel = S.sk.sel && M.nodes.has(S.sk.sel) ? S.sk.sel : null, key = S.sk.mode + sel;
  if (key !== skSelKey) { skSelKey = key; skSelSet = sel ? skChain(M, sel) : null; skUnlocks = sel ? new Set((M.post.get(sel) || []).map(e => e.t)) : null; }
  return sel;
}

// Canvas: drawn every frame into whichever #skcv is on the page (the teacher view is re-rendered on every action).
let skYaw = 0.6, skPitch = -0.32, skZoom = 1, skProj = [], skDrag = null;
const skReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function skFrame() {
  const cv = document.getElementById('skcv');
  if (cv && cv.clientWidth) skDraw(cv);
  requestAnimationFrame(skFrame);
}
function skDraw(cv) {
  const DPR = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
  const ctx = cv.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const M = skModel(), sel = skSelection(M), si = S.sk.student;
  if (!skDrag && !sel && !skReduce) skYaw += 0.0016;
  const cx = W / 2, cy = H / 2, scale = Math.min(W, H) * 0.42 * skZoom;
  const cyaw = Math.cos(skYaw), syaw = Math.sin(skYaw), cp = Math.cos(skPitch), sp = Math.sin(skPitch);
  ctx.clearRect(0, 0, W, H);
  const P = new Map();
  for (const n of M.nodes.values()) {
    const x1 = n.x * cyaw - n.z * syaw, z1 = n.x * syaw + n.z * cyaw, y2 = n.y * cp - z1 * sp, z2 = n.y * sp + z1 * cp, f = 3.2 / (3.2 + z2);
    P.set(n.id, { n, sx: cx + x1 * f * scale, sy: cy - y2 * f * scale, f, z: z2 });
  }
  for (const e of M.edges) {
    const a = P.get(e.s), b = P.get(e.t); if (!a || !b) continue;
    const hot = sel && (skSelSet.has(e.s) || e.s === sel) && (skSelSet.has(e.t) || e.t === sel), nxt = sel && e.s === sel && skUnlocks.has(e.t);
    ctx.lineWidth = 0.7;
    if (sel && !hot && !nxt) ctx.strokeStyle = 'rgba(16,24,40,0.03)';
    else if (hot) { ctx.strokeStyle = 'rgba(88,0,229,0.85)'; ctx.lineWidth = 1.1; }
    else if (nxt) { ctx.strokeStyle = 'rgba(16,24,40,0.75)'; ctx.lineWidth = 1.1; }
    else ctx.strokeStyle = 'rgba(16,24,40,0.10)';
    if (!e.warm) { ctx.setLineDash([4, 4]); if (!sel) ctx.strokeStyle = 'rgba(88,0,229,0.30)'; }
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke(); ctx.setLineDash([]);
  }
  skProj = [...P.values()].sort((a, b) => b.z - a.z);
  for (const p of skProj) {
    const n = p.n, r = (2.2 + Math.sqrt(n.deg) * 1.35) * p.f * (S.sk.mode === 'skill' ? 1.5 : 1) * Math.sqrt(skZoom); p.r = r;
    const on = !sel || n.id === sel || skSelSet.has(n.id) || skUnlocks.has(n.id);
    ctx.globalAlpha = on ? Math.max(0.55, Math.min(1, 1.25 - p.z * 0.5)) : 0.08;
    ctx.fillStyle = SK_STATUS[skStatusOf(skVal(si, n.id))].color;
    ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill();
    if (n.id === sel) { ctx.globalAlpha = 1; ctx.strokeStyle = '#101828'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.sx, p.sy, r + 4, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
}
function skPick(cv, x, y) {
  const r = cv.getBoundingClientRect(); let best = null, bd = 1e9;
  for (const p of skProj) { const d = Math.hypot(p.sx - (x - r.left), p.sy - (y - r.top)); if (d < Math.max(p.r + 5, 9) && d < bd) { bd = d; best = p; } }
  S.sk.sel = best ? best.n.id : null; render();
}
document.addEventListener('pointerdown', e => { const cv = e.target.closest('#skcv'); if (!cv) return;
  skDrag = { x: e.clientX, y: e.clientY, yaw: skYaw, pitch: skPitch, moved: false }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
document.addEventListener('pointermove', e => { if (!skDrag) return; const dx = e.clientX - skDrag.x, dy = e.clientY - skDrag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) skDrag.moved = true;
  skYaw = skDrag.yaw + dx * 0.006; skPitch = Math.max(-1.2, Math.min(1.2, skDrag.pitch + dy * 0.004)); });
document.addEventListener('pointerup', e => { const d = skDrag; if (!d) return; skDrag = null; const cv = document.getElementById('skcv');
  cv?.classList.remove('drag'); if (cv && !d.moved) skPick(cv, e.clientX, e.clientY); });
document.addEventListener('wheel', e => { if (!e.target.closest('#skcv')) return; e.preventDefault(); skZoom = Math.max(0.5, Math.min(4, skZoom * Math.exp(-e.deltaY * 0.0012))); }, { passive: false });
requestAnimationFrame(skFrame);

// Side panels: class bottlenecks / student's main gaps, and the card of the selected point.
const skDot = st => `<span class="sk-dot" style="background:${SK_STATUS[st].color}"></span>`;
const skItem = (n, right, si) => `<button class="sk-li" data-action="skSel" data-id="${n.id}">${skDot(skStatusOf(skVal(si, n.id)))}<span>${skEsc(n.title)}</span><small>${right}</small></button>`;
function skRoots(M, ids, idxs) {
  return [...ids].map(id => M.nodes.get(id)).filter(Boolean)
    .map(n => ({ n, v: idxs.length === 1 ? skScore(idxs[0], n.id) : null, k: idxs.filter(i => ['gap', 'mid'].includes(skStatusOf(skScore(i, n.id)))).length }))
    .filter(x => idxs.length === 1 ? ['gap', 'mid'].includes(skStatusOf(x.v)) : x.k > 0)
    .sort((a, b) => idxs.length === 1 ? a.n.order - b.n.order : b.k - a.k || a.n.order - b.n.order);
}
function skProgress(M, n, si) {
  if (si != null) {
    const v = skScore(si, n.id), s = skStatusOf(v), name = STUDENTS[si];
    if (s === 'none') return `<span class="sk-pill">${skDot('none')}${name}: ещё не изучали</span>`;
    let html = `<span class="sk-pill">${skDot(s)}${name}: ${SK_STATUS[s].name.toLowerCase()} · ${skPct(v)}</span>`;
    if (s !== 'ok') {
      const roots = skRoots(M, skSelSet, [si]);
      html += roots.length ? `<div class="sk-root"><b>Корень проблемы — начните с самых ранних:</b>${roots.slice(0, 5).map(x => skItem(x.n, skPct(x.v), si)).join('')}</div>`
        : `<div class="sk-root ok"><b>Пререквизиты освоены — пробел в самой теме. Нужна отработка этого ${S.sk.mode === 'crit' ? 'критерия' : 'навыка'}.</b></div>`;
    }
    return html;
  }
  const vals = STUDENTS.map((_, i) => skScore(i, n.id)), cnt = { ok: 0, mid: 0, gap: 0, none: 0 };
  vals.forEach(v => cnt[skStatusOf(v)]++);
  if (cnt.none === STUDENTS.length) return `<span class="sk-pill">${skDot('none')}Класс ещё не изучал</span>`;
  const studied = STUDENTS.length - cnt.none, cs = skClassScore(n.id);
  const weak = vals.map((v, i) => [v, i]).filter(([v]) => ['gap', 'mid'].includes(skStatusOf(v))).sort((a, b) => a[0] - b[0]);
  let html = `<span class="sk-pill">${skDot(skStatusOf(cs))}Класс: ${skPct(cs)} в среднем</span>
    <div class="sk-bar">${['ok', 'mid', 'gap'].map(k => `<i style="width:${cnt[k] / studied * 100}%;background:${SK_STATUS[k].color}"></i>`).join('')}</div>
    <p class="muted xs">Освоили ${cnt.ok} · закрепить ${cnt.mid} · пробел ${cnt.gap} из ${studied}</p>`;
  if (weak.length) {
    html += `<div class="sk-h">Кому нужна помощь · ${weak.length}</div>${weak.map(([v, i]) => `<button class="sk-li" data-action="openStudent" data-i="${i}">${skDot(skStatusOf(v))}<span>${STUDENTS[i]}</span><small>${skPct(v)} ›</small></button>`).join('')}`;
    const roots = skRoots(M, skSelSet, weak.map(w => w[1]));
    if (roots.length) html += `<div class="sk-root"><b>Общая причина — пробелы в пререквизитах у этих учеников:</b>${roots.slice(0, 4).map(x => skItem(x.n, x.k + ' из ' + weak.length, null)).join('')}</div>`;
  }
  return html;
}
function skCard(M, sel, si) {
  const n = M.nodes.get(sel), s = n.skill, sub = s.sub ? skSUB.get(s.sub) : null;
  const pre = M.pre.get(n.id) || [], post = M.post.get(n.id) || [];
  return `<div class="card sk-card"><button class="sk-x" data-action="skSel" data-id="" aria-label="Закрыть">×</button>
    <div class="sk-eyebrow"><i style="background:${n.group.color}"></i>${sub ? sub.code + ' · ' : '3 класс · '}${n.group.name}</div>
    <h3 style="margin:8px 0 4px">${skEsc(n.title)}</h3>
    <p class="muted xs" style="margin-bottom:10px">${S.sk.mode === 'crit' ? 'Навык: ' + skEsc(s.name) : sub ? skEsc(sub.text) : 'Пререквизит из 3 класса'}</p>
    ${skProgress(M, n, si)}
    <div class="sk-h">Опирается напрямую · ${pre.length}</div>${pre.map(e => skItem(M.nodes.get(e.s), '', si)).join('') || '<p class="muted xs">Пререквизитов нет — это одна из стартовых тем</p>'}
    <div class="sk-h">Открывает · ${post.length}</div>${post.map(e => skItem(M.nodes.get(e.t), '', si)).join('') || '<p class="muted xs">Пока ни на что не ведёт</p>'}</div>`;
}
// si: student index for the student card, null for the whole class.
function skSection(si) {
  S.sk.student = si;
  const M = skModel(), sel = skSelection(M), ids = [...M.nodes.keys()], cnt = { ok: 0, mid: 0, gap: 0, none: 0 };
  ids.forEach(id => cnt[skStatusOf(skVal(si, id))]++);
  const top = ids.filter(id => ['gap', 'mid'].includes(skStatusOf(skVal(si, id))))
    .map(id => ({ n: M.nodes.get(id), v: skVal(si, id), d: skDependents(M, id).size }))
    .sort((a, b) => (100 - b.v) * (1 + b.d) - (100 - a.v) * (1 + a.d)).slice(0, 6);
  const what = S.sk.mode === 'crit' ? 'критериев' : 'навыков';
  const modes = `<div class="seg-tabs sk-modes"><button class="${S.sk.mode === 'crit' ? 'on' : ''}" data-action="skMode" data-m="crit">Критерии</button><button class="${S.sk.mode === 'skill' ? 'on' : ''}" data-action="skMode" data-m="skill">Навыки</button></div>`;
  const legend = ['ok', 'mid', 'gap', 'none'].map(k => `<span class="lg">${skDot(k)}${SK_STATUS[k].name}</span>`).join('');
  return `<div class="sk-wrap">
    <div class="card sk-stage"><div class="row between wrap" style="gap:8px">${modes}<div class="legend-row">${legend}</div></div>
      <canvas id="skcv" aria-label="Карта навыков: точки — ${what}, линии — пререквизиты"></canvas>
      <p class="muted xs">Тяните — вращать · колесо — масштаб · нажмите на точку, чтобы увидеть её пререквизиты · ниже — раньше в курсе · пунктир — экспертные мосты между разделами</p></div>
    <div class="sk-side">${sel ? skCard(M, sel, si) : ''}
      <div class="card"><div class="sk-stats">${['ok', 'mid', 'gap', 'none'].map(k => `<div><b style="color:${k === 'none' ? 'var(--muted)' : SK_STATUS[k].color}">${cnt[k]}</b><span>${SK_STATUS[k].name}</span></div>`).join('')}</div>
        <div class="sk-h">${si == null ? 'Узкие места класса' : 'Главные пробелы'} · что блокирует больше всего</div>
        ${top.map(x => skItem(x.n, `${skPct(x.v)} · ведёт к ${x.d}`, si)).join('') || '<p class="muted xs">Пробелов нет</p>'}
        <p class="muted xs" style="margin-top:10px">Цвет точки — ${si == null ? 'средний результат класса' : 'результат ученика'}: от 75% — освоено, 55–74% — закрепить, ниже — пробел. Результаты смоделированы.</p></div></div></div>`;
}

// ---------- Student tablet: «Мои навыки» pie (ALEKS-like) ----------
// One slice per topic group, slice size = number of skills; the slice fills from the centre with mastered skills
// (full colour) and skills in progress (light). A skill earns a medal when every criterion taught in the course is mastered.
const SK_KID_GROUPS = SK_GROUPS.filter(g => g.id !== 'g3');
function skKidSkill(si, s) {
  const R = skResults()[si], taught = s.crit.filter(c => c.first != null);
  const done = taught.filter(c => R[c.id] != null && R[c.id] >= 75).length, studied = taught.filter(c => R[c.id] != null).length;
  const st = taught.length && done === taught.length ? 'medal' : studied ? 'learn' : 'soon';
  const next = taught.find(c => !(R[c.id] >= 75));
  return { s, st, done, total: taught.length, studied, next: next && R[next.id] != null ? next : null };
}
function skKidData(si) {
  return SK_KID_GROUPS.map(g => {
    const skills = SKD.skills.filter(s => s.grade === 4 && skGroupOf(s.id) === g && s.crit.some(c => c.first != null)).map(s => skKidSkill(si, s));
    return { g, skills, medal: skills.filter(x => x.st === 'medal').length, learn: skills.filter(x => x.st === 'learn').length };
  }).filter(x => x.skills.length);
}
const skArc = (cx, cy, r0, r1, a0, a1) => {
  const p = (r, a) => `${(cx + r * Math.sin(a)).toFixed(1)} ${(cy - r * Math.cos(a)).toFixed(1)}`, big = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${big} 0 ${p(r0, a0)}Z`;
};
const skMedal = (color, size = 34) => `<svg class="kid-medal" viewBox="0 0 34 40" width="${size}" height="${size * 40 / 34}" aria-hidden="true"><path d="M9 0h7l-3 14H6zM18 0h7l3 14h-7z" fill="${color}"/><circle cx="17" cy="25" r="13" fill="#FFC83D" stroke="#F0A800" stroke-width="2"/><path d="m17 17.5 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" fill="#fff"/></svg>`;
function skKidPie(si) {
  const D = skKidData(si), total = D.reduce((a, x) => a + x.skills.length, 0), medals = D.reduce((a, x) => a + x.medal, 0);
  const sel = D.find(x => x.g.id === S.pie.g);
  const C = 150, R0 = 44, R1 = 138, GAP = 0.025;
  let a = 0;
  const slices = D.map(x => {
    const span = x.skills.length / total * Math.PI * 2, a0 = a + GAP, a1 = a + span - GAP; a += span;
    const n = x.skills.length, rOf = f => R0 + (R1 - R0) * f, on = sel && sel.g.id === x.g.id, dim = sel && !on;
    const mid = (a0 + a1) / 2, off = on ? 6 : 0, dx = (off * Math.sin(mid)).toFixed(1), dy = (-off * Math.cos(mid)).toFixed(1);
    const badge = x.medal ? `<g transform="translate(${(C + (R1 - 16) * Math.sin(mid)).toFixed(1)} ${(C - (R1 - 16) * Math.cos(mid)).toFixed(1)})"><circle r="11" fill="#fff"/><text text-anchor="middle" dy="4.5" font-size="12" font-weight="800" fill="#B07800">${x.medal}</text></g>` : '';
    return `<g class="kid-slice" data-action="sPie" data-g="${x.g.id}" transform="translate(${dx} ${dy})" opacity="${dim ? 0.45 : 1}">
      <path d="${skArc(C, C, R0, R1, a0, a1)}" fill="#EEEBF8"/>
      ${x.medal + x.learn ? `<path d="${skArc(C, C, R0, rOf((x.medal + x.learn) / n), a0, a1)}" fill="${x.g.color}" opacity=".32"/>` : ''}
      ${x.medal ? `<path d="${skArc(C, C, R0, rOf(x.medal / n), a0, a1)}" fill="${x.g.color}"/>` : ''}
      ${on ? `<path d="${skArc(C, C, R0, R1, a0, a1)}" fill="none" stroke="#101828" stroke-width="2"/>` : ''}${badge}</g>`;
  }).join('');
  const pie = `<svg class="kid-pie" viewBox="0 0 300 300" width="262" height="262" role="img" aria-label="Мои навыки по темам">${slices}
    <circle cx="${C}" cy="${C}" r="${R0 - 4}" fill="#fff"/><text x="${C}" y="${C - 2}" text-anchor="middle" font-size="26" font-weight="800" fill="#101828">${medals}</text>
    <text x="${C}" y="${C + 16}" text-anchor="middle" font-size="11" font-weight="600" fill="#6B6F86">из ${total} медалей</text></svg>`;
  const legend = `<div class="kid-legend"><span><i style="background:var(--p)"></i>Освоено</span><span><i style="background:var(--p);opacity:.32"></i>Учусь</span><span><i style="background:#EEEBF8"></i>Скоро</span></div>`;
  let panel;
  if (!sel) {
    const won = D.flatMap(x => x.skills.filter(k => k.st === 'medal').map(k => [x.g, k]));
    panel = `<div class="kid-panel"><b class="kid-h">Мои медали · ${won.length}</b>
      ${won.length ? `<div class="kid-shelf">${won.map(([g, k]) => `<button class="kid-won" data-action="sPie" data-g="${g.id}" data-s="${k.s.id}">${skMedal(g.color, 30)}<span>${skEsc(k.s.name)}</span></button>`).join('')}</div>` : '<p class="muted">Освой навык полностью — и получишь первую медаль!</p>'}
      <p class="muted kid-tip">Нажми на кусочек круга — увидишь, какие навыки в нём и что осталось до медали.</p></div>`;
  } else {
    const rows = sel.skills.map(k => {
      const open = S.pie.s === k.s.id;
      const icon = k.st === 'medal' ? skMedal(sel.g.color, 26) : k.st === 'learn' ? `<span class="kid-ring" style="--c:${sel.g.color};--pc:${k.done / k.total * 100}%"></span>` : '<span class="kid-lock">🔒</span>';
      const dots = k.total ? `<span class="kid-dots">${Array.from({ length: k.total }, (_, j) => `<i style="${j < k.done ? `background:${sel.g.color}` : ''}"></i>`).join('')}</span>` : '';
      const more = !open ? '' : k.st === 'medal' ? '<div class="kid-more ok">Все задания этого навыка решены — медаль твоя!</div>'
        : k.st === 'soon' ? '<div class="kid-more">Этот навык ждёт тебя на следующих уроках.</div>'
        : `<div class="kid-more">Освоено ${k.done} из ${k.total} — до медали ещё ${k.total - k.done}. ${k.next ? `Потренируйся: ${skEsc(k.next.text.replace(/\s*\(.*$/, ''))}.` : 'Дальше — на следующих уроках.'}</div>`;
      return `<button class="kid-skill ${k.st} ${open ? 'open' : ''}" data-action="sPie" data-g="${sel.g.id}" data-s="${open ? '' : k.s.id}">${icon}<span class="kid-name">${skEsc(k.s.name)}</span>${dots}</button>${more}`;
    }).join('');
    panel = `<div class="kid-panel"><div class="row between"><b class="kid-h"><i class="kid-dot" style="background:${sel.g.color}"></i>${sel.g.name}</b><button class="kid-x" data-action="sPie" data-g="">✕</button></div>
      <p class="muted xs" style="margin:2px 0 8px">Медалей ${sel.medal} из ${sel.skills.length} · учусь ${sel.learn}</p>${rows}</div>`;
  }
  return `<div class="kid-wrap"><div class="kid-left">${pie}${legend}</div>${panel}</div>`;
}
