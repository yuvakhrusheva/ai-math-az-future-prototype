// AI Math AZ — end-of-year prototype. Teacher app + student tablet; student actions are buttons.
'use strict';

// ---------- Content (lesson 22: multiplying a 4-digit number by a 1-digit number) ----------
const STUDENTS = ['Айсель Г.', 'Камиль Р.', 'Лейла И.', 'Мурад Б.', 'Нармин А.', 'Нигяр А.', 'Орхан М.', 'Сабина К.', 'Тогрул Г.', 'Эмиль К.'];
const STAGES = ['Разминка', 'Решаем вместе', 'Практика', 'Рефлексия', 'ДЗ'];

const FRONTAL = {
  0: [
    { text: 'Найди произведения устно.', expr: '700 · 8 = ?', right: '5 600', wrong: '4 900', skill: 0 },
    { text: 'Вычисли устно.', expr: '3 000 · 6 = ?', right: '18 000', wrong: '1 800', skill: 0 },
  ],
  1: [
    { text: 'Найди произведение, записав множитель в развёрнутой форме.', expr: '1 021 · 5 = (1 000 + 20 + 1) · 5 = ?', right: '5 105', wrong: '5 015', skill: 2,
      hintTitle: 'Ошибки в неполных произведениях',
      hint: 'Обсудите с классом, что при разложении 1 021 на разрядные слагаемые нужно сохранить значения разрядов: 1 000, 20 и 1, а затем умножить каждое слагаемое на 5 и сложить результаты. Попросите проверить отдельно разложение и итоговое сложение: верное значение — 5 105.' },
    { text: 'Найди произведение удобным способом.', expr: '2 103 · 4 = ?', right: '8 412', wrong: '8 012', skill: 3,
      hintTitle: 'Потерян разряд при сложении',
      hint: 'Часть класса потеряла слагаемое 400 (100 · 4). Попросите выписать все неполные произведения столбиком перед сложением: 8 000 + 400 + 12.' },
  ],
};

// Practice: a × n, decomposed by place value.
const PRACTICE = [[4, 2118], [3, 1214], [5, 1102], [2, 3241], [6, 1012], [4, 1221], [3, 2031]].map(([a, n], i) => {
  const parts = String(n).split('').map((d, k, arr) => +d * 10 ** (arr.length - 1 - k)).filter(Boolean);
  return { a, n, parts, prods: parts.map(p => p * a), ans: a * n, skill: i < 2 ? 2 : i < 5 ? 3 : 4 };
});
const BONUS = [
  { text: 'Магазин продал 3 214 тетрадей по 5 манатов. Сколько денег он получил?', expr: '5 · 3 214 = ?', ans: '16 070' },
  { text: 'В 4 одинаковых коробках по 1 235 карандашей. Сколько всего карандашей?', expr: '4 · 1 235 = ?', ans: '4 940' },
];
const SKILLS = ['Умножает круглые числа устно', 'Раскладывает множитель на разрядные слагаемые', 'Находит неполные произведения и складывает их', 'Умножает четырёхзначное число на однозначное', 'Решает задачи на умножение'];
const BASE_SKILL = [0.9, 0.8, 0.5, 0.6, 0.55];

const PHOTO_WORKS = [
  { student: 0, lines: ['429 + 396 = 825', '925 − 825 = 100', 'Ответ: 100 ман.'], ai: [false, false, true, true] },
  { student: 2, lines: ['563 + 429 = 992 (много)', '429 + 396 = 825 (подходит)', '925 − 825 = 100 ман.'], ai: [false, true, true, true] },
  { student: 6, lines: ['563 + 396 = 959', '563 + 429 = 992', '429 + 396 = 825', '925 − 825 = 100'], ai: [true, true, true, true] },
  { student: 9, lines: ['563 + 396 = 959', 'Ответ: холодильник', 'и плита'], ai: [false, false, false, false] },
];
const CHECKLIST = ['Проверены все три пары цен — 959, 992, 825', 'Каждая сумма сравнена с 925 манатами', 'Выбрана подходящая пара — холодильник и микроволновка', 'Найден остаток — 100 манатов'];

const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const rnd = p => Math.random() < p;

// ---------- State ----------
let S;
function freshState() {
  return {
    view: 'both', page: 'live', me: 8,
    lesson: { started: false, stage: 0, stageStarted: false, task: 0, revealed: false, ended: false, hintVote: null },
    frontal: {}, // key "stage-task" -> {student: 'ok'|'bad'}
    practice: STUDENTS.map(() => PRACTICE.map(() => ({ st: 'none', attempts: 0, helper: false }))),
    cur: STUDENTS.map(() => 0),           // current practice task per student
    hands: [],                             // queue of student indexes
    helper: STUDENTS.map(() => null),      // {task, step, log[]}
    bonus: STUDENTS.map(() => ({ open: false, seen: false, done: [] })),
    reflection: {},
    hw: null,                              // {groups:{studentIdx:'errors'|'practice'|'bonus'}, confirmed}
    hwDone: STUDENTS.map(() => 0),
    gapDone: STUDENTS.map(() => SKILLS.map(() => 0)), gapSkill: 2,
    review: { idx: 0, marks: PHOTO_WORKS.map(w => [...w.ai]), confirmed: PHOTO_WORKS.map(() => false) },
    myclassTab: 'skills', warmupAdded: false,
    audio: 'none', studentPage: 'lesson',
  };
}

// ---------- Derived ----------
const key = () => `${S.lesson.stage}-${S.lesson.task}`;
const frontalTask = () => (FRONTAL[S.lesson.stage] || [])[S.lesson.task];
const answers = () => (S.frontal[key()] ||= {});
const solvedCount = i => S.practice[i].filter(c => c.st === 'ok').length;
const doneCount = i => S.practice[i].filter(c => c.st === 'ok' || c.st === 'bad').length;
function bonusEligible(i) { return S.cur[i] >= PRACTICE.length && solvedCount(i) / PRACTICE.length >= 0.7; }
function skillPct() {
  const tot = SKILLS.map(() => [0, 0]);
  Object.entries(S.frontal).forEach(([k, ans]) => {
    const [st, t] = k.split('-').map(Number); const task = FRONTAL[st]?.[t]; if (!task) return;
    Object.values(ans).forEach(v => { tot[task.skill][1]++; if (v === 'ok') tot[task.skill][0]++; });
  });
  S.practice.forEach(row => row.forEach((c, t) => { if (c.st === 'ok' || c.st === 'bad') { tot[PRACTICE[t].skill][1]++; if (c.st === 'ok') tot[PRACTICE[t].skill][0]++; } }));
  return tot.map(([ok, n], s) => n ? Math.round((ok + BASE_SKILL[s] * 4) / (n + 4) * 100) : Math.round(BASE_SKILL[s] * 100));
}
function studentSkill(i) {
  return SKILLS.map((_, s) => {
    if (S.gapDone[i][s] >= 3) return 'ok';
    const cells = S.practice[i].filter((c, t) => PRACTICE[t].skill === s && (c.st === 'ok' || c.st === 'bad'));
    const fr = Object.entries(S.frontal).filter(([k]) => FRONTAL[k[0]]?.[k[2]]?.skill === s).map(([, a]) => a[i]).filter(Boolean);
    const all = [...cells.map(c => c.st), ...fr];
    if (!all.length) return s < 2 ? 'ok' : 'prog';
    const r = all.filter(x => x === 'ok').length / all.length;
    return r >= 0.8 ? 'ok' : r >= 0.5 ? 'prog' : 'gap';
  });
}

// ---------- Actions ----------
const A = {
  view(el) { S.view = el.dataset.v; },
  nav(el) { S.page = el.dataset.p; },
  reset() { S = freshState(); toast('Состояние сброшено'); },
  pick(el) { S.me = +el.value; S.studentPage = 'home'; },
  // teacher: lesson
  startLesson() { S.lesson.started = true; S.page = 'live'; },
  stage(el) { const st = +el.dataset.s; if (!S.lesson.started) return; S.lesson.stage = st; S.lesson.stageStarted = false; S.lesson.task = 0; S.lesson.revealed = false; S.lesson.hintVote = null; },
  stageStart() { S.lesson.stageStarted = true; },
  reveal() { S.lesson.revealed = true; },
  nextTask() {
    const list = FRONTAL[S.lesson.stage] || [];
    if (S.lesson.task < list.length - 1) { S.lesson.task++; S.lesson.revealed = false; S.lesson.hintVote = null; }
    else A.stage({ dataset: { s: S.lesson.stage + 1 } });
  },
  hintVote(el) { S.lesson.hintVote = el.dataset.v; toast('Спасибо! Оценка уходит в контроль качества ИИ'); },
  cameOver(el) { S.hands = S.hands.filter(x => x !== +el.dataset.i); },
  endLesson() {
    S.lesson.ended = true;
    const groups = {};
    STUDENTS.forEach((_, i) => {
      const errs = S.practice[i].filter(c => c.st === 'bad' || c.attempts > 1 || c.helper).length + Object.values(S.frontal).filter(a => a[i] === 'bad').length;
      groups[i] = S.bonus[i].open ? 'bonus' : errs >= 1 ? 'errors' : 'practice';
    });
    S.hw = { groups, confirmed: false, editing: false };
    S.page = 'live';
  },
  hwEdit() { S.hw.editing = true; },
  hwClose() { S.hw.editing = false; },
  hwGroup(el) { S.hw.groups[+el.dataset.i] = el.value; },
  hwConfirm() { S.hw.confirmed = true; S.hw.editing = false; toast('Домашние задания отправлены ученикам'); },
  // teacher: class
  tab(el) { S.myclassTab = el.dataset.t; },
  addWarmup() { S.warmupAdded = true; toast('Задания на неполные произведения добавлены в разминку следующего урока'); },
  // teacher: review
  mark(el) { const r = S.review; r.marks[r.idx][+el.dataset.k] = !r.marks[r.idx][+el.dataset.k]; },
  confirmWork() {
    const r = S.review; r.confirmed[r.idx] = true;
    const next = r.confirmed.findIndex(c => !c);
    if (next >= 0) r.idx = next; else toast('Все работы проверены');
  },
  prevWork() { S.review.idx = Math.max(0, S.review.idx - 1); },
  // teacher: audio coach
  upload() { S.audio = 'processing'; render(); setTimeout(() => { S.audio = 'done'; render(); }, 1600); },

  // student (buttons instead of input)
  sAnswer(el) {
    const ok = el.dataset.ok === '1';
    if (S.lesson.stage <= 1) { answers()[S.me] = ok ? 'ok' : 'bad'; return; }
    if (S.lesson.stage === 2) practiceAnswer(S.me, ok);
  },
  sRetry() { const c = S.practice[S.me][S.cur[S.me]]; c.st = 'solving'; },
  sHand() { if (!S.hands.includes(S.me)) S.hands.push(S.me); toast('Учитель видит поднятую руку'); },
  sHelper() {
    const t = S.cur[S.me]; const c = S.practice[S.me][t]; c.helper = true; c.st = 'solving';
    S.helper[S.me] = { task: t, step: 0, log: [helperMsg(t, 0)] };
  },
  sHelperReply() {
    const h = S.helper[S.me]; const p = PRACTICE[h.task];
    h.log.push({ who: 'me', text: helperAnswer(p, h.step) });
    h.step++;
    if (h.step >= 3) {
      h.log.push({ who: 'ai', text: 'Отлично, ты нашёл решение сам! Ответ засчитан 👍' });
      const c = S.practice[S.me][h.task]; c.st = 'ok'; c.attempts++;
      setTimeout(() => { S.helper[S.me] = null; advance(S.me); render(); }, 1300);
    } else h.log.push(helperMsg(h.task, h.step));
  },
  sReflect(el) { S.reflection[S.me] = el.dataset.v; },
  sBonusOpen() { S.bonus[S.me].seen = true; },
  sBonus(el) { const b = S.bonus[S.me]; b.done.push(el.dataset.ok === '1'); },
  sPage(el) { S.studentPage = el.dataset.p; },
  sHw() { S.hwDone[S.me] = Math.min(5, S.hwDone[S.me] + 1); },
  sGapStart() { const g = studentSkill(S.me).indexOf('gap'); S.gapSkill = g >= 0 ? g : 2; S.studentPage = 'gap'; },
  sGap() { S.gapDone[S.me][S.gapSkill]++; },

  // simulation of the rest of the class
  simFrontal() {
    const t = frontalTask(); if (!t) return;
    const pWrong = S.lesson.stage === 1 ? 0.45 : 0.15;
    STUDENTS.forEach((_, i) => { if (i !== S.me && !answers()[i] && rnd(0.92)) answers()[i] = rnd(pWrong) ? 'bad' : 'ok'; });
    if (S.lesson.stage === 1 && Object.values(answers()).filter(v => v === 'bad').length < 3) [0, 3, 5].forEach(i => { if (i !== S.me) answers()[i] = 'bad'; });
  },
  simPractice() {
    STUDENTS.forEach((_, i) => {
      if (i === S.me) return;
      for (let k = 0; k < 2; k++) {
        const c = S.practice[i][S.cur[i]]; if (!c) break;
        if (rnd(0.15)) { c.helper = true; c.st = 'ok'; c.attempts = 1; advance(i); continue; }
        practiceAnswer(i, rnd(0.72));
        if (S.practice[i][S.cur[i]]?.st === 'bad' && rnd(0.35) && !S.hands.includes(i)) S.hands.push(i);
      }
    });
  },
  simReflect() { STUDENTS.forEach((_, i) => { if (i !== S.me) S.reflection[i] ||= ['😀', '🙂', '🤔'][Math.floor(Math.random() * 3)]; }); },
};

function practiceAnswer(i, ok) {
  const c = S.practice[i][S.cur[i]]; if (!c) return;
  c.attempts++;
  if (ok) { c.st = 'ok'; advance(i); }
  else if (c.attempts >= 2) { c.st = 'bad'; advance(i); }
  else c.st = 'bad';
}
function advance(i) {
  if (S.practice[i][S.cur[i]]?.st === 'bad' && S.practice[i][S.cur[i]].attempts < 2) return;
  if (S.cur[i] < PRACTICE.length - 1) { S.cur[i]++; S.practice[i][S.cur[i]].st = 'solving'; }
  else S.cur[i] = PRACTICE.length;
  if (bonusEligible(i)) S.bonus[i].open = true;
}
function mistakes(i) {
  return S.practice[i].map((c, t) => (c.st === 'bad' || c.attempts > 1 || c.helper) ? t : -1).filter(t => t >= 0);
}
function similar(p, k) { const n = p.n + 111 * (k + 1); return { a: p.a, n, ans: p.a * n }; }
function helperMsg(t, step) {
  const p = PRACTICE[t];
  const q = [
    `Давай по шагам. Разложи ${fmt(p.n)} на разрядные слагаемые. Какие числа получатся?`,
    `Верно! Теперь умножь каждое слагаемое на ${p.a}. Что получилось?`,
    `Отлично! Осталось сложить неполные произведения. Сколько всего?`,
  ][step];
  return { who: 'ai', text: q };
}
function helperAnswer(p, step) {
  return [p.parts.map(fmt).join(' + '), p.prods.map(fmt).join(', '), fmt(p.ans)][step];
}

// ---------- Render: teacher ----------
const NAV = [['home', '⌂', 'Главная'], ['live', '▶', 'Урок'], ['myclass', '👥', 'Мой класс'], ['review', '✓', 'На проверку'], ['audio', '🎧', 'Разбор урока']];
function teacher() {
  const pending = S.review.confirmed.filter(c => !c).length;
  const nav = NAV.map(([p, ic, t]) => `<button class="nav ${S.page === p ? 'on' : ''}" data-action="nav" data-p="${p}"><span>${ic}</span>${t}${p === 'review' && pending ? `<span class="cnt">${pending}</span>` : ''}${p === 'audio' ? ' <span class="new" style="margin-left:auto">✦</span>' : ''}</button>`).join('');
  const page = { home: tHome, live: tLive, myclass: tClass, review: tReview, audio: tAudio }[S.page]();
  return `<aside class="side"><div class="brand" style="padding:6px 8px 14px"><span class="logo">A</span> AI Math</div>${nav}<div class="who">Учитель · 4-А · 10 учеников</div></aside><div class="main">${page}</div>`;
}

function tHome() {
  const sp = skillPct(); const weak = SKILLS.map((s, k) => [s, sp[k]]).sort((a, b) => a[1] - b[1])[0];
  const att = STUDENTS.map((n, i) => [n, solvedCount(i), S.practice[i].filter(c => c.st === 'bad').length]).filter(x => x[2] > 0).slice(0, 4);
  return `<h1>Добрый день!</h1><div class="sub">Вторник · 4-А</div>
  <div class="hero"><div><div style="font-size:12px;opacity:.8;font-weight:600">БЛИЖАЙШИЙ УРОК · СЕГОДНЯ</div><div style="font-size:20px;font-weight:700;margin-top:4px">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div></div>
  <button class="btn" data-action="nav" data-p="live">Перейти к уроку →</button></div>
  <div class="grid3" style="margin-top:14px">
    <div class="card kpi"><b>${sp[2]}%</b><span class="muted">освоили неполные произведения</span></div>
    <div class="card kpi"><b>${S.bonus.filter(b => b.open).length} из 10</b><span class="muted">дошли до бонуса сегодня</span></div>
    <div class="card kpi"><b>${S.review.confirmed.filter(c => !c).length}</b><span class="muted">работ на проверке · ИИ отметил заранее</span></div>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div class="card"><div class="row between"><h3>Ученики к вниманию</h3><span class="new">✦ новое</span></div>
      ${att.length ? att.map(([n, ok, bad]) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${n}</span><span class="tag bad">${bad} ошибк. в практике</span></div>`).join('') : '<p class="muted" style="margin-top:10px">Появятся после практики</p>'}</div>
    <div class="card"><div class="row"><span style="color:var(--p)">✦</span><h3>Рекомендация ИИ</h3></div><p style="margin-top:8px;line-height:1.5">Слабее всего у класса навык «${weak[0]}» — ${weak[1]}%. Добавьте 2–3 задания на него в разминку следующего урока.</p>
      <button class="btn" style="margin-top:12px" data-action="addWarmup" ${S.warmupAdded ? 'disabled' : ''}>${S.warmupAdded ? 'Добавлено ✓' : 'Добавить в разминку'}</button></div>
  </div>`;
}

function tLive() {
  const L = S.lesson;
  if (L.ended) return tEnd();
  if (!L.started) return `<h1>Подготовка к уроку</h1><div class="sub">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div>
    <div class="card row between"><div><h2>Урок 22</h2><p class="muted">Разминка · Решаем вместе · Практика · Рефлексия · ДЗ</p></div><button class="btn" data-action="startLesson">▶ Начать урок</button></div>
    <div class="card" style="margin-top:14px"><h3>Что нового в уроке к концу года</h3><ul style="margin:10px 0 0 18px;line-height:1.9">
    <li>ИИ-подсказка учителю, когда класс ошибся во фронтальном задании</li><li><span class="new">✦</span> ИИ-помощник для ученика в практике</li><li><span class="new">✦</span> Бонусные задания от ИИ для тех, кто решил 70%+</li><li><span class="new">✦</span> Персональная домашка: работа над ошибками этого урока</li><li><span class="new">✦</span> Задания на неосвоенные навыки — в карте знаний ученика</li></ul></div>`;
  const stepper = STAGES.map((s, k) => `<button class="step ${k === L.stage ? 'on' : k < L.stage ? 'done' : ''}" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}</button>`).join('');
  let body = '';
  if (L.stage <= 1) body = tFrontal();
  else if (L.stage === 2) body = tPractice();
  else if (L.stage === 3) body = `<div class="card"><h3>Рефлексия</h3><p class="muted">Ответили: ${Object.keys(S.reflection).length} из 10</p><div class="row" style="margin-top:10px;font-size:26px">${Object.values(S.reflection).join(' ')}</div></div>`;
  else body = `<div class="card row between"><div><h3>Домашнее задание</h3><p class="muted">После завершения ИИ подберёт каждому свой набор</p></div><button class="btn" data-action="endLesson">Завершить урок</button></div>`;
  return `<div class="row between"><h1>Урок 22 · Умножение (ч.2)</h1><button class="btn light" data-action="endLesson">Завершить урок</button></div>
  <div class="stepper">${stepper}</div>${body}`;
}

function tFrontal() {
  const L = S.lesson, list = FRONTAL[L.stage], t = list[L.task];
  if (!L.stageStarted) return `<div class="card row between"><div><h3>${STAGES[L.stage]}</h3><p class="muted">${list.length} задания · все ученики решают одно и то же</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const a = answers(); const n = Object.keys(a).length; const bad = Object.values(a).filter(v => v === 'bad').length; const ok = n - bad;
  const tabs = list.map((_, k) => `<span class="${k === L.task ? 'on' : ''}">№${k + 1}</span>`).join('');
  const hint = bad >= 3 && t.hint ? `<div class="hint"><div class="row between"><b>✦ ${t.hintTitle}</b><span class="tag bad">${bad} из ${n}</span></div>
    <p style="margin-top:8px;line-height:1.5">${t.hint}</p><div class="row between" style="margin-top:10px"><span class="muted">Пример: ${STUDENTS[+Object.entries(a).find(([, v]) => v === 'bad')[0]]}</span>
    <span class="row"><button data-action="hintVote" data-v="up" style="opacity:${L.hintVote === 'up' ? 1 : .5}">👍</button><button data-action="hintVote" data-v="down" style="opacity:${L.hintVote === 'down' ? 1 : .5}">👎</button></span></div></div>` : '';
  const res = L.revealed ? `<div style="margin-top:12px"><div class="row between"><span>Верно: <b style="color:var(--green)">${ok}</b> · Неверно: <b style="color:var(--red)">${bad}</b></span><b>${n ? Math.round(ok / n * 100) : 0}%</b></div>
     <div class="bar" style="margin-top:6px"><div style="width:${n ? ok / n * 100 : 0}%;background:#7CC26B"></div></div></div>` : '';
  return `<div class="card"><h3>${STAGES[L.stage]}</h3><div class="tabs">${tabs}</div><h2 style="margin:6px 0 12px">${t.text}</h2>
    ${L.revealed ? res : `<div class="answered"><b>${n}</b><span class="muted">/10</span><div class="muted">ответили</div><button class="btn" style="margin-top:12px" data-action="reveal" ${n ? '' : 'disabled'}>Показать решение ученикам</button></div>`}
    ${hint}${L.revealed ? `<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-action="nextTask">Дальше →</button></div>` : ''}</div>`;
}

function tPractice() {
  if (!S.lesson.stageStarted) return `<div class="card row between"><div><h3>Практика · самостоятельная работа</h3><p class="muted">Ученики решают на планшетах. Карта класса заполняется в реальном времени.</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  STUDENTS.forEach((_, i) => { if (S.practice[i][0].st === 'none') S.practice[i][0].st = 'solving'; });
  const head = `<tr><th></th>${PRACTICE.map((_, k) => `<th>${k + 1}</th>`).join('')}<th>⭐</th><th>✓</th></tr>`;
  const rows = STUDENTS.map((n, i) => `<tr><td class="name">${n}${S.hands.includes(i) ? ' <span class="hand">✋</span>' : ''}</td>${S.practice[i].map(c => {
    const cls = { ok: 'c-ok', bad: 'c-bad', solving: 'c-solving', none: '' }[c.st];
    const label = c.st === 'ok' ? c.attempts : c.st === 'bad' ? (c.attempts >= 2 ? '✕' : c.attempts) : c.st === 'solving' ? '•••' : '';
    return `<td class="${cls}">${label}${c.helper ? '<span class="helper-dot">✦</span>' : ''}</td>`;
  }).join('')}<td>${S.bonus[i].open ? '⭐' : ''}</td><td class="muted">${solvedCount(i)}/7</td></tr>`).join('');
  const reached = STUDENTS.map((n, i) => [n, i]).filter(([, i]) => S.bonus[i].open);
  return `<div class="grid2" style="grid-template-columns:1fr 250px">
    <div class="card"><div class="row between wrap"><h3>Live-карта класса</h3><span class="row" style="gap:6px"><span class="new">✦ новое</span><span class="muted" style="font-size:12px">✦ — решал с ИИ-помощником · ⭐ — дошёл до бонуса</span></span></div>
      <table class="map" style="margin-top:8px">${head}${rows}</table>
      <p class="muted" style="font-size:12px;margin-top:6px">Цифра — с какой попытки решено · ✕ — не решено за 2 попытки · ••• — решает</p></div>
    <div class="col"><div class="card"><h3>✋ Подняли руку · ${S.hands.length}</h3>${S.hands.length ? S.hands.map(i => `<div class="queue-item"><span>${STUDENTS[i]}</span><button class="tag ok" data-action="cameOver" data-i="${i}">Подошёл</button></div>`).join('') : '<p class="muted" style="margin-top:8px">Очередь пуста</p>'}</div>
      <div class="card"><div class="row between"><h3>⭐ Бонус</h3><span class="new">✦</span></div><p class="muted" style="font-size:12.5px;margin-top:6px">Открывается при 70%+ заданий урока. Задания подбирает ИИ.</p><p style="margin-top:8px">Дошли: <b>${reached.length} из 10</b></p>${reached.map(([n]) => `<div style="margin-top:4px">⭐ ${n}</div>`).join('')}</div></div></div>`;
}

function tEnd() {
  const g = S.hw.groups; const cnt = k => Object.values(g).filter(v => v === k).length;
  const labels = { errors: 'Работа над ошибками: неполные произведения', practice: 'Закрепление: умножение на однозначное число', bonus: '⭐ Бонус: задачи посложнее' };
  const editor = S.hw.editing ? `<div class="modal-bg"><div class="modal"><div class="row between"><h2>Изменить домашку</h2><button data-action="hwClose">✕</button></div>
    ${STUDENTS.map((n, i) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${n}</span><select class="small" data-change="hwGroup" data-i="${i}">${Object.entries(labels).map(([k, l]) => `<option value="${k}" ${g[i] === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-action="hwClose">Готово</button></div></div></div>` : '';
  return `<div class="card" style="max-width:660px;margin:30px auto"><div class="row"><span class="tag ok" style="font-size:18px">✓</span><div><h2>Урок завершён</h2><p class="muted">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</p></div></div>
    <div class="banner" style="margin-top:16px"><div class="row between"><b>Домашнее задание назначено автоматически</b><span class="new">✦ новое</span></div><p class="muted" style="margin:4px 0 10px">Каждый ученик получил свой набор по итогам урока</p>
    ${Object.entries(labels).map(([k, l]) => `<div class="row between" style="background:#fff;padding:10px 12px;border-radius:10px;margin-top:6px"><span>${l}</span><b>${cnt(k)}</b></div>`).join('')}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn light" data-action="hwEdit" ${S.hw.confirmed ? 'disabled' : ''}>Изменить</button><button class="btn" data-action="hwConfirm" ${S.hw.confirmed ? 'disabled' : ''}>${S.hw.confirmed ? 'Отправлено ✓' : 'Подтвердить'}</button></div></div>${editor}`;
}

function tClass() {
  const sp = skillPct();
  const tabs = `<div class="seg" style="display:inline-flex;margin-bottom:14px"><button class="${S.myclassTab === 'skills' ? 'on' : ''}" data-action="tab" data-t="skills">Навыки ✦</button><button class="${S.myclassTab === 'students' ? 'on' : ''}" data-action="tab" data-t="students">Ученики</button></div>`;
  if (S.myclassTab === 'students') return `<h1>Мой класс</h1><div class="sub">4-А · 10 учеников</div>${tabs}<div class="card"><table class="map">
    <tr><th style="text-align:left">Ученик</th><th>Практика</th><th>С помощником</th><th>Бонус</th><th>Навыки с пробелом</th></tr>
    ${STUDENTS.map((n, i) => { const sk = studentSkill(i); return `<tr><td class="name">${n}</td><td>${solvedCount(i)}/7</td><td>${S.practice[i].filter(c => c.helper).length}</td><td>${S.bonus[i].open ? '⭐' : ''}</td><td>${sk.filter(x => x === 'gap').length}</td></tr>`; }).join('')}</table></div>`;
  const color = p => p >= 75 ? '#4E9A25' : p >= 55 ? '#E8A93A' : '#D9415D';
  const weak = sp.indexOf(Math.min(...sp));
  return `<h1>Мой класс</h1><div class="sub">Модуль «Умножение и деление» · 10 учеников · <span class="new">✦ новое</span></div>${tabs}
  <div class="grid2" style="grid-template-columns:1fr 320px"><div class="card">${SKILLS.map((s, k) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span style="width:52%">${s}</span><div class="bar" style="flex:1"><div style="width:${sp[k]}%;background:${color(sp[k])}"></div></div><b style="width:44px;text-align:right">${sp[k]}%</b></div>`).join('')}
  <p class="muted" style="font-size:12px;margin-top:8px">Пересчитывается после каждого ответа на уроке, в практике и дома</p></div>
  <div class="card"><div class="row"><span style="color:var(--p)">✦</span><h3>Рекомендация ИИ</h3></div><p style="margin-top:8px;line-height:1.5">Навык «${SKILLS[weak]}» освоили ${sp[weak]}% класса. В начале следующего урока дайте 2–3 задания на него в разминке.</p>
  <button class="btn" style="margin-top:12px" data-action="addWarmup" ${S.warmupAdded ? 'disabled' : ''}>${S.warmupAdded ? 'Добавлено ✓' : 'Добавить в разминку'}</button></div></div>`;
}

function tReview() {
  const r = S.review, w = PHOTO_WORKS[r.idx], m = r.marks[r.idx];
  const done = r.confirmed.filter(Boolean).length; const score = m.filter(Boolean).length;
  const status = score === 4 ? ['ok', 'Выполнено'] : score >= 2 ? ['mid', 'Частично выполнено'] : ['bad', 'Не выполнено'];
  return `<h1>На проверку</h1><div class="sub">Домашняя работа · Задача «Покупка» · Работа ${r.idx + 1} из ${PHOTO_WORKS.length} · проверено ${done}</div>
  <div class="grid2" style="grid-template-columns:330px 1fr">
   <div class="card col"><div><h3>Чеклист проверки</h3><div class="row" style="margin-top:6px"><span class="new">✦ ИИ</span><span class="muted" style="font-size:12.5px">отметил предварительно — проверьте</span></div></div>
    ${CHECKLIST.map((c, k) => `<button class="check ${m[k] ? 'on' : ''}" data-action="mark" data-k="${k}"><span class="box">${m[k] ? '✓' : ''}</span><span>${c}</span>${w.ai[k] && m[k] ? '<span class="ai-mark">ИИ</span>' : ''}</button>`).join('')}
    <div><span class="tag ${status[0]}">${score}/4 · ${status[1]}</span></div>
    <div class="row"><button class="btn light" data-action="prevWork" ${r.idx ? '' : 'disabled'}>← Назад</button><button class="btn" data-action="confirmWork" ${r.confirmed[r.idx] ? 'disabled' : ''}>${r.confirmed[r.idx] ? 'Подтверждено ✓' : 'Подтвердить и далее →'}</button></div></div>
   <div class="card"><div class="row"><span class="tag lav">${STUDENTS[w.student]}</span><span class="muted">Фото из тетради</span></div><div class="notebook" style="margin-top:12px">${w.lines.join('<br>')}</div></div></div>`;
}

function tAudio() {
  const body = S.audio === 'none' ? `<div class="card row between"><div><h3>Запись урока 22</h3><p class="muted">Учитель загружает запись урока — платформа не ведёт непрерывную запись</p></div><button class="btn" data-action="upload">Загрузить запись урока</button></div>`
    : S.audio === 'processing' ? `<div class="card"><h3>ИИ анализирует запись…</h3><div class="bar" style="margin-top:10px"><div style="width:65%;background:var(--p)"></div></div></div>`
    : `<div class="grid2"><div class="card"><h3>Кто говорил на уроке</h3><div class="bar" style="height:20px;margin-top:12px;display:flex"><div style="width:64%;background:var(--p);border-radius:0"></div><div style="width:36%;background:#BDB0FA;border-radius:0"></div></div>
       <div class="row between" style="margin-top:6px"><span>Учитель — 64%</span><span>Ученики — 36%</span></div>
       <div class="grid2" style="margin-top:14px"><div class="banner"><b style="font-size:22px">7</b><div class="muted">открытых вопросов классу</div></div><div class="banner"><b style="font-size:22px">3 с</b><div class="muted">среднее ожидание ответа</div></div></div></div>
       <div class="card"><div class="row"><span style="color:var(--p)">✦</span><h3>Рекомендации к следующему уроку</h3></div><ol style="margin:10px 0 0 18px;line-height:1.7">
       <li>Сократите объяснение в «Решаем вместе» — дайте ученикам проговорить шаги самим.</li><li>После вопроса подождите 5–7 секунд, прежде чем вызвать ученика.</li><li>Хорошо: вы разобрали типичную ошибку на примере ответа ученика.</li></ol></div></div>`;
  return `<h1>Разбор урока</h1><div class="sub">ИИ-аудиокоуч · <span class="new">✦ новое</span></div>${body}`;
}

// ---------- Render: student tablet ----------
function student() {
  const i = S.me;
  const picker = `<div class="picker">Планшет ученика: <select data-change="pick">${STUDENTS.map((n, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="muted" style="margin-left:auto">ввод заменён кнопками</span></div>`;
  const [screen, ctrls] = studentScreen(i);
  return `${picker}<div class="tablet"><div class="screen">${screen}</div></div><div class="controls"><h4>Действия ученика</h4><div class="row">${ctrls}</div></div>`;
}

function sTop(title, right = '') { return `<div class="s-top"><span>${title}</span><span>${right}</span></div>`; }
function dots(n, curIdx, states) { return `<span class="pill-dots">${Array.from({ length: n }, (_, k) => `<i class="${states?.[k] === 'ok' ? 'ok' : states?.[k] === 'bad' ? 'bad' : k === curIdx ? 'on' : ''}">${k + 1}</i>`).join('')}</span>`; }

function studentScreen(i) {
  const L = S.lesson; const name = STUDENTS[i].split(' ')[0];
  const sim = (act, label) => `<button class="btn sim" data-action="${act}">👥 ${label}</button>`;
  // after lesson: home / skills / homework / photo result
  if (L.ended || !L.started) {
    if (S.studentPage === 'skills') {
      const sk = studentSkill(i); const lab = { ok: ['ok', 'освоено'], prog: ['mid', 'в процессе'], gap: ['bad', 'пробел'] };
      return [`${sTop('Карта знаний', '<span class="new">✦ по навыкам</span>')}<div class="s-body"><b>Умножение и деление</b>${SKILLS.map((s, k) => `<div class="skill"><span>${s}</span><span class="tag ${lab[sk[k]][0]}">${lab[sk[k]][1]}</span></div>`).join('')}</div>`,
        `<button class="btn light" data-action="sPage" data-p="home">← На главную</button>${sk.includes('gap') ? '<button class="btn" data-action="sGapStart">✦ Закрыть пробел</button>' : ''}`];
    }
    if (S.studentPage === 'gap') {
      const sk = S.gapSkill, d = S.gapDone[i][sk];
      const base = PRACTICE.find(x => x.skill === sk) || PRACTICE[0]; const p = similar(base, d + 3);
      if (d >= 3) return [`${sTop('Закрываем пробел', dots(3, 3, ['ok', 'ok', 'ok']))}<div class="s-body"><div class="banner" style="background:var(--green-bg)"><b>Пробел закрыт 🎉</b><div>Навык «${SKILLS[sk]}» теперь — освоено</div></div></div>`,
        `<button class="btn" data-action="sPage" data-p="skills">Карта знаний</button><button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
      return [`${sTop('Закрываем пробел', dots(3, d))}<div class="s-body"><span class="tag lav" style="align-self:flex-start">✦ ИИ подобрал по навыку: ${SKILLS[sk]}</span><div class="s-task">Найди произведение через разрядные слагаемые.</div><div class="expr">${p.a} · ${fmt(p.n)} = <span class="ans">?</span></div></div>`,
        `<button class="btn" data-action="sGap">Ответить верно (${fmt(p.ans)})</button><button class="btn light" data-action="sPage" data-p="skills">← Карта знаний</button>`];
    }
    if (S.studentPage === 'photo') {
      const k = PHOTO_WORKS.findIndex(w => w.student === i); const w = PHOTO_WORKS[k];
      const m = S.review.marks[k];
      return [`${sTop('Домашнее задание · задача в тетради')}<div class="s-body"><b>Работа проверена</b><span class="tag mid" style="align-self:flex-start">${m.filter(Boolean).length} из 4</span>${CHECKLIST.map((c, j) => `<div class="banner" style="background:${m[j] ? 'var(--green-bg)' : 'var(--red-bg)'}">${m[j] ? '✓' : '✗'} ${c}</div>`).join('')}</div>`,
        `<button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
    }
    if (S.studentPage === 'hw' && S.hw?.confirmed) {
      const g = S.hw.groups[i]; const d = S.hwDone[i];
      const topic = { errors: 'Неполные произведения', practice: 'Умножение на однозначное число', bonus: 'Задачи посложнее ⭐' }[g];
      const ms = mistakes(i); const fromErr = g === 'errors' && ms.length;
      const src = fromErr ? ms[d % ms.length] : d % PRACTICE.length;
      const p = similar(PRACTICE[src], d);
      const why = fromErr ? `<span class="muted" style="font-size:12px">✦ похоже на задание ${src + 1} урока, где была ошибка</span>` : '';
      return [`${sTop('Домашнее задание', dots(5, d))}<div class="s-body"><span class="tag lav" style="align-self:flex-start">✦ ${g === 'bonus' ? 'подобрано по итогам урока' : 'подобрано по твоим ошибкам'}: ${topic}</span>
        ${d >= 5 ? '<div class="banner"><b>Домашка выполнена 🎉</b></div>' : `<div class="s-task">Найди произведение.</div><div class="expr">${p.a} · ${fmt(p.n)} = <span class="ans">?</span></div>${why}`}</div>`,
        `${d < 5 ? '<button class="btn" data-action="sHw">Ответить</button>' : ''}<button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
    }
    const hwCard = S.hw?.confirmed ? `<div class="banner"><div class="row between"><b>Твоя домашка · 5 заданий</b><span class="new">✦</span></div><div class="muted" style="font-size:12.5px">Подобрано по итогам урока · решено ${S.hwDone[i]}/5</div></div>` : `<div class="banner"><b>Домашнее задание</b><div class="muted" style="font-size:12.5px">${L.ended ? 'Учитель подтверждает домашку…' : 'Появится после урока'}</div></div>`;
    const photoK = PHOTO_WORKS.findIndex(w => w.student === i);
    const photo = photoK >= 0 && S.review.confirmed[photoK] ? `<div class="banner" style="background:var(--green-bg)"><b>Работа в тетради проверена</b><div class="muted" style="font-size:12.5px">Посмотри результат по критериям</div></div>` : '';
    const gapIdx = studentSkill(i).indexOf('gap');
    const gapCard = gapIdx >= 0 ? `<div class="banner" style="background:var(--red-bg)"><div class="row between"><b>Есть пробел в навыке</b><span class="new">✦</span></div><div style="font-size:12.5px">${SKILLS[gapIdx]} — ИИ подобрал 3 задания</div></div>` : '';
    return [`${sTop(`Привет, ${name}!`)}<div class="s-body"><div class="banner" style="background:#fff;border:1px solid var(--line)"><b>Урок 22</b><div class="muted" style="font-size:12.5px">${L.ended ? 'Урок завершён' : 'Урок ещё не начался — ждём учителя'}</div></div>${hwCard}${gapCard}${photo}
      <div class="banner" style="background:#fff;border:1px solid var(--line)"><div class="row between"><b>Карта знаний</b><span class="new">✦ по навыкам</span></div></div></div>`,
      `${S.hw?.confirmed ? '<button class="btn" data-action="sPage" data-p="hw">Решать домашку</button>' : ''}<button class="btn light" data-action="sPage" data-p="skills">Карта знаний</button>${gapCard ? '<button class="btn" data-action="sGapStart">✦ Закрыть пробел</button>' : ''}${photo ? '<button class="btn light" data-action="sPage" data-p="photo">Результат работы</button>' : ''}`];
  }
  // frontal
  if (L.stage <= 1) {
    const list = FRONTAL[L.stage]; const t = list[L.task];
    if (!L.stageStarted) return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><div style="font-size:40px">👀</div><b>Смотрим на учителя</b></div>`, ''];
    const my = answers()[i];
    const body = L.revealed ? `<div class="expr">${t.expr.replace('?', `<span class="ans ${my === 'ok' ? 'ok' : 'bad'}">${my === 'ok' ? t.right : my === 'bad' ? t.wrong : '—'}</span>`)}</div>
      <div class="banner">${my === 'ok' ? '✓ Верно! Молодец.' : my === 'bad' ? `✗ Не совсем так. Верный ответ: <b>${t.right}</b>` : 'Ты не успел ответить'}</div>`
      : `<div class="expr">${t.expr.replace('?', `<span class="ans">${my ? (my === 'ok' ? t.right : t.wrong) : '?'}</span>`)}</div>${my ? '<div class="banner">Ответ отправлен — ждём остальных</div>' : ''}`;
    return [`${sTop('Урок 22', `${STAGES[L.stage]}: ${dots(list.length, L.task)}`)}<div class="s-body"><div class="s-task">${t.text}</div>${body}</div>`,
      L.revealed ? '<span class="muted">Ждём следующее задание от учителя</span>' : my ? sim('simFrontal', 'Ответы класса') : `<button class="btn" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${sim('simFrontal', 'Ответы класса')}`];
  }
  // practice
  if (L.stage === 2) {
    if (!L.stageStarted) return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><div style="font-size:40px">👀</div><b>Смотрим на учителя</b></div>`, ''];
    const b = S.bonus[i];
    if (b.open && !b.seen && S.cur[i] >= PRACTICE.length) return bonusScreen(i, true);
    if (b.seen) return bonusScreen(i, false);
    if (b.open && !b.seen) return bonusScreen(i, true);
    const t = S.cur[i]; if (t >= PRACTICE.length) return [`${sTop('Практика')}<div class="s-body"><div class="banner"><b>Практика выполнена</b><div class="muted">Решено ${solvedCount(i)} из 7</div></div></div>`, sim('simPractice', 'Класс решает')];
    const p = PRACTICE[t], c = S.practice[i][t], h = S.helper[i];
    const states = S.practice[i].map(x => x.st);
    const head = sTop('Урок 22', `Практика: ${dots(7, t, states)}`);
    const task = `<div class="s-task">Вставь пропущенные числа и найди произведение.</div><div class="expr">${p.a} · ${fmt(p.n)} = ${p.a} · (${p.parts.map(fmt).join(' + ')}) = <span class="ans ${c.st === 'bad' ? 'bad' : ''}">${c.st === 'bad' ? fmt(p.ans - 10) : '?'}</span></div>`;
    if (h) return [`${head}<div class="s-body">${task}<div class="row"><b>ИИ-помощник</b><span class="new">✦ новое</span><span class="muted" style="font-size:11.5px">не даёт готовый ответ</span></div><div class="chat">${h.log.map(m => `<div class="msg ${m.who}">${m.text}</div>`).join('')}</div></div>`,
      h.step < 3 ? `<button class="btn" data-action="sHelperReply">Ответить помощнику: «${helperAnswer(p, h.step)}»</button>` : ''];
    if (c.st === 'bad') return [`${head}<div class="s-body">${task}<div class="banner" style="background:var(--red-bg)">Не совсем так. Попытка 1 из 2</div></div>`,
      `<button class="btn light" data-action="sHand">✋ Позвать учителя</button><button class="btn" data-action="sHelper">✦ Решить с помощником</button><button class="btn out" data-action="sRetry">Решить ещё раз</button>`];
    return [`${head}<div class="s-body">${task}<span class="muted" style="font-size:12px">Попытка ${c.attempts + 1} из 2</span></div>`,
      `<button class="btn" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${sim('simPractice', 'Класс решает')}`];
  }
  if (L.stage === 3) return [`${sTop('Урок 22', 'Рефлексия')}<div class="s-body"><div class="s-task">Как тебе урок?</div><div class="row" style="font-size:34px;justify-content:center">${['😀', '🙂', '🤔'].map(e => `<span style="opacity:${S.reflection[i] === e ? 1 : .4}">${e}</span>`).join('')}</div></div>`,
    `${['😀', '🙂', '🤔'].map(e => `<button class="btn light" data-action="sReflect" data-v="${e}">${e}</button>`).join('')}${sim('simReflect', 'Ответы класса')}`];
  return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><b>Учитель завершает урок</b><span class="muted">Домашка появится на главной</span></div>`, ''];
}

function bonusScreen(i, unlock) {
  const b = S.bonus[i];
  if (unlock) return [`${sTop('Урок 22', 'Бонус')}<div class="s-body" style="align-items:center;text-align:center;justify-content:center"><div style="font-size:44px">⭐</div><span class="new">✦ новое</span><b style="font-size:18px">Открыты бонусные задания!</b><span class="muted">Ты решил больше 70% заданий урока. Попробуй задания посложнее — их подобрал ИИ.</span></div>`,
    `<button class="btn" data-action="sBonusOpen">Решать бонус</button><button class="btn sim" data-action="simPractice">👥 Класс решает</button>`];
  const k = b.done.length;
  if (k >= BONUS.length) return [`${sTop('Урок 22', 'Бонус')}<div class="s-body"><div class="banner"><b>Бонус пройден ⭐</b><div class="muted">${b.done.filter(Boolean).length} из ${BONUS.length} верно</div></div></div>`, '<button class="btn sim" data-action="simPractice">👥 Класс решает</button>'];
  const t = BONUS[k];
  return [`${sTop('Урок 22', `Бонус: ${dots(BONUS.length, k, b.done.map(x => x ? 'ok' : 'bad'))}`)}<div class="s-body"><span class="tag lav" style="align-self:flex-start">✦ создано ИИ · похожее задание на тот же навык</span><div class="s-task">${t.text}</div><div class="expr">${t.expr.replace('?', '<span class="ans">?</span>')}</div></div>`,
    `<button class="btn" data-action="sBonus" data-ok="1">Ответить верно (${t.ans})</button><button class="btn out" data-action="sBonus" data-ok="0">Ответить с ошибкой</button><button class="btn sim" data-action="simPractice">👥 Класс решает</button>`];
}

// ---------- Plumbing ----------
function render() {
  const stage = document.getElementById('stage');
  stage.className = 'stage ' + ({ both: 'both', teacher: 'teacher-only', student: 'student-only' }[S.view]);
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  document.getElementById('teacher').innerHTML = teacher();
  document.getElementById('studentWrap').innerHTML = student();
}
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2200); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
  const fn = A[el.dataset.action]; if (fn) { fn(el); render(); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]'); if (!el) return;
  const fn = A[el.dataset.change]; if (fn) { fn(el); render(); }
});
S = freshState();
render();
