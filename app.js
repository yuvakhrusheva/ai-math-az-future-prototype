// AI Math AZ — end-of-year prototype. Teacher app + student tablet; student actions are buttons.
'use strict';

// ---------- Content (lesson 22: multiplying a 4-digit number by a 1-digit number) ----------
const STUDENTS = ['Айсель Г.', 'Камиль Р.', 'Лейла И.', 'Мурад Б.', 'Нармин А.', 'Нигяр А.', 'Орхан М.', 'Сабина К.', 'Тогрул Г.', 'Эмиль К.'];
const STAGES = ['Разминка', 'Решаем вместе', 'Практика', 'Рефлексия', 'ДЗ'];

// Frontal tasks: the AI hint for the teacher fires on any of them when 3+ students are wrong.
const FRONTAL = {
  0: [
    { text: 'Найди произведение устно.', expr: '700 · 8 = ?', right: '5 600', wrong: '4 900', skill: 0,
      hintTitle: 'Путаница в табличном умножении',
      hint: 'Часть класса умножила 7 · 7 вместо 7 · 8. Повторите: 700 · 8 — это 7 сотен · 8 = 56 сотен = 5 600. Попросите проговорить вслух, сколько сотен получилось.' },
    { text: 'Вычисли устно.', expr: '3 000 · 6 = ?', right: '18 000', wrong: '1 800', skill: 0,
      hintTitle: 'Потерян ноль при умножении круглых чисел',
      hint: 'Ученики потеряли разряд: 3 тысячи · 6 = 18 тысяч, а не 18 сотен. Предложите записать ответ через разряды: «18 тысяч» → 18 000.' },
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
const HARD = [
  { text: 'Магазин продал 3 214 тетрадей по 5 манатов. Сколько денег он получил?', a: 5, n: 3214 },
  { text: 'В 4 одинаковых коробках по 1 235 карандашей. Сколько всего карандашей?', a: 4, n: 1235 },
  { text: 'Поезд проходит за день 1 208 км. Сколько километров он пройдёт за 6 дней?', a: 6, n: 1208 },
];
const SKILLS = ['Умножает круглые числа устно', 'Раскладывает множитель на разрядные слагаемые', 'Находит неполные произведения и складывает их', 'Умножает четырёхзначное число на однозначное', 'Решает задачи на умножение'];
const SKILL_SHORT = ['Круглые числа', 'Разложение', 'Неполные произведения', '4-значное × 1-значное', 'Задачи'];

const PHOTO_WORKS = [
  { student: 0, lines: ['429 + 396 = 825', '925 − 825 = 100', 'Ответ: 100 ман.'], ai: [false, false, true, true] },
  { student: 2, lines: ['563 + 429 = 992 (много)', '429 + 396 = 825 (подходит)', '925 − 825 = 100 ман.'], ai: [false, true, true, true] },
  { student: 6, lines: ['563 + 396 = 959', '563 + 429 = 992', '429 + 396 = 825', '925 − 825 = 100'], ai: [true, true, true, true] },
  { student: 9, lines: ['563 + 396 = 959', 'Ответ: холодильник', 'и плита'], ai: [false, false, false, false] },
];
const CHECKLIST = ['Проверены все три пары цен — 959, 992, 825', 'Каждая сумма сравнена с 925 манатами', 'Выбрана подходящая пара — холодильник и микроволновка', 'Найден остаток — 100 манатов'];

// Knowledge map: lessons by module (as on the real platform).
const MAP = [
  { module: 'Сложение и вычитание', lessons: [[17, 'Обобщающие задания', 11, 11], [18, 'МСО-1', 16, 16], [19, 'Работа над ошибками', 6, 9]] },
  { module: 'Умножение и деление', here: true, lessons: [[20, 'Повторение (вспомните)', 8, 8], [21, 'Умножение четырёхзначного числа на однозначное (ч.1)', 9, 12], [22, 'Умножение четырёхзначного числа на однозначное (ч.2)', null, 11], [23, 'Задачи и примеры', 0, 0]] },
];

const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const rnd = p => Math.random() < p;

// ---------- State ----------
let S;
function freshState() {
  return {
    view: 'both', page: 'live', me: 8,
    lesson: { started: false, stage: 0, stageStarted: false, task: 0, revealed: false, ended: false, hintVotes: {} },
    frontal: {},                                    // "stage-task" -> {student: 'ok'|'bad'}
    practice: STUDENTS.map(() => PRACTICE.map(() => ({ st: 'none', attempts: 0, helper: false }))),
    cur: STUDENTS.map(() => 0),
    hands: [],
    helper: STUDENTS.map(() => null),               // {task, step}
    bonus: STUDENTS.map(() => ({ open: false, seen: false, done: [] })),
    reflection: {},
    hw: null,                                       // {plans:{i:[items]}, confirmed, editing}
    hwDone: STUDENTS.map(() => 0),
    review: { idx: 0, marks: PHOTO_WORKS.map(w => [...w.ai]), confirmed: PHOTO_WORKS.map(() => false) },
    classStudent: null, audio: 'none', studentPage: 'home', redo: false,
  };
}

// ---------- Derived ----------
const key = () => `${S.lesson.stage}-${S.lesson.task}`;
const frontalTask = () => (FRONTAL[S.lesson.stage] || [])[S.lesson.task];
const answers = () => (S.frontal[key()] ||= {});
const solvedCount = i => S.practice[i].filter(c => c.st === 'ok').length;
const finishedPractice = i => S.cur[i] >= PRACTICE.length;
const firstTry = i => S.practice[i].filter(c => c.st === 'ok' && c.attempts === 1 && !c.helper).length;
const strong = i => firstTry(i) / PRACTICE.length >= 0.7;
function lessonSolved(i) {
  const fr = Object.values(S.frontal).filter(a => a[i] === 'ok').length;
  return fr + solvedCount(i);
}
const LESSON_TASKS = 4 + PRACTICE.length;
function mistakes(i) { return S.practice[i].map((c, t) => (c.st === 'bad' || c.attempts > 1 || c.helper) ? t : -1).filter(t => t >= 0); }
function studentSkill(i) {
  return SKILLS.map((_, s) => {
    const prac = S.practice[i].filter((c, t) => PRACTICE[t].skill === s && c.st !== 'none' && c.st !== 'solving');
    const fr = Object.entries(S.frontal).filter(([k]) => FRONTAL[k[0]]?.[k[2]]?.skill === s).map(([, a]) => a[i]).filter(Boolean);
    const all = [...prac.map(c => (c.st === 'ok' && c.attempts === 1 && !c.helper) ? 'ok' : c.st === 'ok' ? 'mid' : 'bad'), ...fr];
    if (!all.length) return s <= 1 ? 'ok' : 'none';
    const score = all.reduce((a, x) => a + (x === 'ok' ? 1 : x === 'mid' ? 0.5 : 0), 0) / all.length;
    return score >= 0.8 ? 'ok' : score >= 0.5 ? 'prog' : 'gap';
  });
}
function similar(p, k) { const n = p.n + 111 * (k + 1); return { a: p.a, n, ans: p.a * n }; }
// Personal homework: own mistakes → weak skills → harder tasks for those who mastered everything.
function hwPlan(i) {
  const plan = [];
  mistakes(i).slice(0, 2).forEach(t => plan.push({ kind: 'err', t }));
  const sk = studentSkill(i);
  const order = sk.map((v, s) => [v, s]).filter(([v]) => v !== 'ok' || false).sort((a, b) => ({ gap: 0, prog: 1, none: 2 }[a[0]] - { gap: 0, prog: 1, none: 2 }[b[0]]));
  order.filter(([v]) => v === 'gap' || v === 'prog').forEach(([, s]) => { if (plan.length < 4) plan.push({ kind: 'skill', s }); });
  const hardN = strong(i) ? 2 : 1; for (let h = 0; h < hardN && plan.length < 5; h++) plan.push({ kind: 'hard', h: (i + h) % HARD.length });
  const keep = [3, 4, 2, 1].filter(s => !plan.some(x => x.kind === 'skill' && x.s === s));
  while (plan.length < 5) plan.push({ kind: 'keep', s: keep[(plan.length + i) % keep.length] });
  return plan;
}
function hwTask(item, k) {
  if (item.kind === 'err') { const p = similar(PRACTICE[item.t], k); return { ...p, why: `по ошибке в задании ${item.t + 1} урока` }; }
  if (item.kind === 'skill' || item.kind === 'keep') { const base = PRACTICE.find(x => x.skill === item.s) || PRACTICE[3]; return { ...similar(base, k + 2), why: item.kind === 'skill' ? `слабый навык: ${SKILL_SHORT[item.s].toLowerCase()}` : `закрепление: ${SKILL_SHORT[item.s].toLowerCase()}` }; }
  const t = HARD[item.h]; return { a: t.a, n: t.n, ans: t.a * t.n, text: t.text, why: 'задача посложнее' };
}
function bonusTasks(i) {
  if (strong(i)) return HARD.map(t => ({ text: t.text, a: t.a, n: t.n, ans: t.a * t.n, why: 'посложнее, на тот же навык' }));
  const ms = mistakes(i); const src = (ms.length ? ms : [0, 1]).slice(0, 2);
  return src.map((t, k) => { const p = similar(PRACTICE[t], k + 5); return { text: 'Найди произведение через разрядные слагаемые.', ...p, why: `похоже на задание ${t + 1}, где была ошибка` }; });
}

// ---------- Actions ----------
const A = {
  view(el) { S.view = el.dataset.v; },
  nav(el) { S.page = el.dataset.p; },
  reset() { S = freshState(); toast('Состояние сброшено'); },
  pick(el) { S.me = +el.value; S.studentPage = 'home'; S.redo = false; },
  demo(el) { if (el.value) { seed(el.value); el.value = ''; } },
  // teacher: lesson
  startLesson() { S.lesson.started = true; S.page = 'live'; },
  stage(el) { const st = +el.dataset.s; if (!S.lesson.started) return; Object.assign(S.lesson, { stage: st, stageStarted: false, task: 0, revealed: false }); },
  stageStart() { S.lesson.stageStarted = true; if (S.lesson.stage === 2) STUDENTS.forEach((_, i) => { if (S.practice[i][0].st === 'none') S.practice[i][0].st = 'solving'; }); },
  reveal() { S.lesson.revealed = true; },
  nextTask() {
    const list = FRONTAL[S.lesson.stage] || [];
    if (S.lesson.task < list.length - 1) { S.lesson.task++; S.lesson.revealed = false; }
    else A.stage({ dataset: { s: S.lesson.stage + 1 } });
  },
  hintVote(el) { S.lesson.hintVotes[key()] = el.dataset.v; toast('Оценка учителя уходит в контроль качества ИИ'); },
  cameOver(el) { S.hands = S.hands.filter(x => x !== +el.dataset.i); },
  endLesson() {
    S.lesson.ended = true;
    const plans = {}; STUDENTS.forEach((_, i) => { plans[i] = hwPlan(i); });
    S.hw = { plans, confirmed: false, editing: false }; S.page = 'live';
  },
  hwEdit() { S.hw.editing = true; },
  hwClose() { S.hw.editing = false; },
  hwDrop(el) { const i = +el.dataset.i, k = +el.dataset.k; S.hw.plans[i].splice(k, 1); },
  hwConfirm() { S.hw.confirmed = true; S.hw.editing = false; toast('Каждый ученик получил свою домашку'); },
  // teacher: class
  classStudent(el) { S.classStudent = +el.dataset.i; },
  // teacher: review
  mark(el) { const r = S.review; r.marks[r.idx][+el.dataset.k] = !r.marks[r.idx][+el.dataset.k]; },
  confirmWork() { const r = S.review; r.confirmed[r.idx] = true; const next = r.confirmed.findIndex(c => !c); if (next >= 0) r.idx = next; else toast('Все работы проверены'); },
  prevWork() { S.review.idx = Math.max(0, S.review.idx - 1); },
  upload() { S.audio = 'processing'; render(); setTimeout(() => { S.audio = 'done'; render(); }, 1600); },

  // student (buttons instead of input)
  sAnswer(el) {
    const ok = el.dataset.ok === '1';
    if (S.lesson.stage <= 1 && !S.lesson.ended) { answers()[S.me] = ok ? 'ok' : 'bad'; return; }
    practiceAnswer(S.me, ok);
  },
  sRetry() { const c = S.practice[S.me][S.cur[S.me]]; c.st = 'solving'; },
  sHand() { if (!S.hands.includes(S.me)) S.hands.push(S.me); toast('Учитель видит поднятую руку'); },
  sHelper() { const t = S.cur[S.me]; const c = S.practice[S.me][t]; c.helper = true; c.st = 'solving'; S.helper[S.me] = { task: t, step: 0 }; },
  sHelperStep() {
    const h = S.helper[S.me]; h.step++;
    if (h.step >= 3) { const c = S.practice[S.me][h.task]; c.st = 'ok'; c.attempts = Math.max(c.attempts, 1) + 1; h.done = true; }
  },
  sHelperNext() { S.helper[S.me] = null; advance(S.me); },
  sReflect(el) { S.reflection[S.me] = el.dataset.v; },
  sBonusOpen() { S.bonus[S.me].seen = true; },
  sBonus(el) { S.bonus[S.me].done.push(el.dataset.ok === '1'); },
  sPage(el) { S.studentPage = el.dataset.p; S.redo = false; },
  sRedo() { S.redo = true; S.studentPage = 'redo'; const t = S.practice[S.me].findIndex(c => c.st !== 'ok'); S.cur[S.me] = t >= 0 ? t : PRACTICE.length; if (t >= 0) S.practice[S.me][t].st = 'solving'; },
  sHw() { S.hwDone[S.me]++; },

  // simulation of the rest of the class
  simFrontal() {
    const t = frontalTask(); if (!t) return;
    const pWrong = S.lesson.stage === 1 ? 0.45 : 0.25;
    STUDENTS.forEach((_, i) => { if (i !== S.me && !answers()[i] && rnd(0.92)) answers()[i] = rnd(pWrong) ? 'bad' : 'ok'; });
    if (Object.values(answers()).filter(v => v === 'bad').length < 3) [0, 3, 5].forEach(i => { if (i !== S.me) answers()[i] = 'bad'; });
  },
  simPractice() {
    STUDENTS.forEach((_, i) => {
      if (i === S.me) return;
      for (let k = 0; k < 2; k++) {
        const c = S.practice[i][S.cur[i]]; if (!c) break;
        if (rnd(0.15)) { c.helper = true; c.st = 'ok'; c.attempts = 2; advance(i); continue; }
        practiceAnswer(i, rnd(0.7));
        if (S.practice[i][S.cur[i]]?.st === 'bad' && rnd(0.35) && !S.hands.includes(i)) S.hands.push(i);
      }
    });
  },
  simReflect() { STUDENTS.forEach((_, i) => { if (i !== S.me) S.reflection[i] ||= ['😀', '🙂', '🤔'][Math.floor(Math.random() * 3)]; }); },
};

function practiceAnswer(i, ok) {
  const c = S.practice[i][S.cur[i]]; if (!c) return;
  c.attempts++;
  if (S.redo) { c.st = ok ? 'ok' : 'bad'; if (ok) advance(i, true); return; }
  if (ok) { c.st = 'ok'; advance(i); }
  else if (c.attempts >= 2) { c.st = 'bad'; advance(i, true); }
  else c.st = 'bad';
}
function advance(i, force) {
  const c = S.practice[i][S.cur[i]];
  if (!force && c?.st === 'bad' && c.attempts < 2) return;
  if (S.redo) { const t = S.practice[i].findIndex((x, k) => k > S.cur[i] && x.st !== 'ok'); S.cur[i] = t >= 0 ? t : PRACTICE.length; if (t >= 0) S.practice[i][t].st = 'solving'; return; }
  if (S.cur[i] < PRACTICE.length - 1) { S.cur[i]++; S.practice[i][S.cur[i]].st = 'solving'; }
  else S.cur[i] = PRACTICE.length;
  if (finishedPractice(i)) S.bonus[i].open = true;
}

// Demo shortcuts: jump straight to a feature.
function seed(kind) {
  S = freshState(); const L = S.lesson; L.started = true;
  const others = (pWrong) => STUDENTS.forEach((_, i) => { if (i !== S.me) answers()[i] = rnd(pWrong) ? 'bad' : 'ok'; });
  if (kind === 'hint') { L.stage = 1; L.stageStarted = true; others(0.5); [0, 3, 5].forEach(i => answers()[i] = 'bad'); answers()[S.me] = 'bad'; }
  if (kind === 'helper' || kind === 'bonus' || kind === 'hw' || kind === 'map' || kind === 'skills') {
    L.stage = 1; L.stageStarted = true; L.revealed = true; others(0.5); answers()[S.me] = 'bad';
    L.stage = 2; A.stageStart(); A.simPractice(); A.simPractice();
  }
  if (kind === 'helper') { practiceAnswer(S.me, false); toast('Ученик ошибся — нажмите «✦ Решить с помощником» под планшетом'); }
  if (kind === 'map') { practiceAnswer(S.me, true); practiceAnswer(S.me, false); practiceAnswer(S.me, false); practiceAnswer(S.me, true); }
  if (kind === 'bonus' || kind === 'hw' || kind === 'skills') {
    practiceAnswer(S.me, false); A.sHelper(); A.sHelperStep(); A.sHelperStep(); A.sHelperStep(); A.sHelperNext();
    let k = 0; while (!finishedPractice(S.me) && k < 20) practiceAnswer(S.me, k++ !== 2);
    for (let k = 0; k < 3; k++) A.simPractice();
  }
  if (kind === 'hw' || kind === 'map' || kind === 'skills') { A.endLesson(); }
  if (kind === 'hw') { A.hwConfirm(); S.studentPage = 'hw'; }
  if (kind === 'map') { A.hwConfirm(); S.studentPage = 'map'; }
  if (kind === 'skills') { A.hwConfirm(); S.page = 'myclass'; }
  if (kind === 'review') { L.started = false; S.page = 'review'; }
  if (kind === 'audio') { L.started = false; S.page = 'audio'; }
  render();
}

// ---------- Render: teacher ----------
const NAV = [['home', '⌂', 'Главная'], ['live', '▶', 'Урок'], ['myclass', '👥', 'Мой класс'], ['review', '✓', 'На проверку'], ['audio', '🎧', 'Разбор урока']];
function teacher() {
  const pending = S.review.confirmed.filter(c => !c).length;
  const nav = NAV.map(([p, ic, t]) => `<button class="nav ${S.page === p ? 'on' : ''}" data-action="nav" data-p="${p}"><span>${ic}</span>${t}${p === 'review' && pending ? `<span class="cnt">${pending}</span>` : ''}${p === 'audio' ? ' <span class="new" style="margin-left:auto">✦</span>' : ''}</button>`).join('');
  const page = { home: tHome, live: tLive, myclass: tClass, review: tReview, audio: tAudio }[S.page]();
  return `<aside class="side"><div class="brand" style="padding:6px 8px 14px"><span class="logo">A</span> AI Math</div>${nav}<div class="who">Учитель · 4-А · 10 учеников</div></aside><div class="main">${page}</div>`;
}

function firedHints() {
  return Object.entries(S.frontal).map(([k, a]) => [FRONTAL[k[0]]?.[k[2]], Object.values(a).filter(v => v === 'bad').length, k]).filter(([t, bad]) => t && bad >= 3);
}

function tHome() {
  const gaps = STUDENTS.map((n, i) => [n, studentSkill(i)]).filter(([, sk]) => sk.includes('gap'));
  const hints = firedHints();
  return `<h1>Добрый день!</h1><div class="sub">Вторник · 4-А</div>
  <div class="hero"><div><div style="font-size:12px;opacity:.8;font-weight:600">БЛИЖАЙШИЙ УРОК · СЕГОДНЯ</div><div style="font-size:20px;font-weight:700;margin-top:4px">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div></div>
  <button class="btn" data-action="nav" data-p="live">Перейти к уроку →</button></div>
  <div class="grid3" style="margin-top:14px">
    <div class="card kpi"><b>${gaps.length}</b><span class="muted">учеников с пробелом в навыках</span></div>
    <div class="card kpi"><b>${S.bonus.filter(b => b.open).length} из 10</b><span class="muted">дошли до бонуса</span></div>
    <div class="card kpi"><b>${S.review.confirmed.filter(c => !c).length}</b><span class="muted">работ на проверке · ИИ отметил заранее</span></div>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div class="card"><div class="row between"><h3>Ученики с пробелами</h3><span class="new">✦ новое</span></div>
      ${gaps.length ? gaps.slice(0, 5).map(([n, sk]) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${n}</span><span class="tag bad">${sk.map((v, s) => v === 'gap' ? SKILL_SHORT[s] : null).filter(Boolean).join(', ')}</span></div>`).join('') : '<p class="muted" style="margin-top:10px">Появятся после урока</p>'}</div>
    <div class="card"><div class="row"><span style="color:var(--p)">✦</span><h3>ИИ-подсказки по фронтальной работе</h3></div>
      ${hints.length ? hints.map(([t, bad]) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${t.hintTitle}</b><div class="muted" style="font-size:12.5px">ошиблись ${bad} — подсказка показана на уроке</div></div>`).join('')
        : '<p class="muted" style="margin-top:8px;line-height:1.5">Когда трое и больше учеников ошибаются во фронтальном задании, учитель сразу получает совет, как разобрать ошибку.</p>'}</div>
  </div>`;
}

function tLive() {
  const L = S.lesson;
  if (L.ended) return tEnd();
  if (!L.started) return `<h1>Подготовка к уроку</h1><div class="sub">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div>
    <div class="card row between"><div><h2>Урок 22</h2><p class="muted">Разминка · Решаем вместе · Практика · Рефлексия · ДЗ</p></div><button class="btn" data-action="startLesson">▶ Начать урок</button></div>
    <div class="card" style="margin-top:14px"><h3>Что нового в уроке к концу года</h3><ul style="margin:10px 0 0 18px;line-height:1.9">
    <li>ИИ-подсказка учителю во фронтальной работе, когда класс ошибся</li><li><span class="new">✦</span> ИИ-помощник ведёт ученика по шагам прямо в задании</li>
    <li><span class="new">✦</span> Бонус для всех, кто закончил практику: посложнее или по своим ошибкам</li><li><span class="new">✦</span> Персональная домашка: свои ошибки и слабые навыки каждого</li></ul>
    <p class="muted" style="margin-top:12px;font-size:12.5px">Быстро перейти к любой функции — меню «Показать функцию» сверху.</p></div>`;
  const stepper = STAGES.map((s, k) => `<button class="step ${k === L.stage ? 'on' : k < L.stage ? 'done' : ''}" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}</button>`).join('');
  let body = '';
  if (L.stage <= 1) body = tFrontal();
  else if (L.stage === 2) body = tPractice();
  else if (L.stage === 3) body = `<div class="card"><h3>Рефлексия</h3><p class="muted">Ответили: ${Object.keys(S.reflection).length} из 10</p><div class="row" style="margin-top:10px;font-size:26px">${Object.values(S.reflection).join(' ')}</div></div>`;
  else body = `<div class="card row between"><div><h3>Домашнее задание</h3><p class="muted">После завершения ИИ соберёт каждому свой набор</p></div><button class="btn" data-action="endLesson">Завершить урок</button></div>`;
  return `<div class="row between"><h1>Урок 22 · Умножение (ч.2)</h1><button class="btn light" data-action="endLesson">Завершить урок</button></div>
  <div class="stepper">${stepper}</div>${body}`;
}

function tFrontal() {
  const L = S.lesson, list = FRONTAL[L.stage], t = list[L.task];
  if (!L.stageStarted) return `<div class="card row between"><div><h3>${STAGES[L.stage]}</h3><p class="muted">${list.length} задания · фронтальная работа: все решают одно и то же</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const a = answers(); const n = Object.keys(a).length; const bad = Object.values(a).filter(v => v === 'bad').length; const ok = n - bad;
  const tabs = list.map((_, k) => `<span class="${k === L.task ? 'on' : ''}">№${k + 1}</span>`).join('');
  const vote = L.hintVotes[key()];
  const ex = Object.entries(a).find(([, v]) => v === 'bad');
  const hint = bad >= 3 ? `<div class="hint"><div class="row between"><b>✦ ${t.hintTitle}</b><span class="tag bad">${bad} из ${n}</span></div>
    <p style="margin-top:8px;line-height:1.5">${t.hint}</p><div class="row between" style="margin-top:10px"><span class="muted">Пример ответа: ${STUDENTS[+ex[0]]} — ${t.wrong}</span>
    <span class="row"><button data-action="hintVote" data-v="up" style="opacity:${vote === 'up' ? 1 : .5}">👍</button><button data-action="hintVote" data-v="down" style="opacity:${vote === 'down' ? 1 : .5}">👎</button></span></div></div>`
    : `<p class="muted" style="font-size:12.5px;margin-top:12px">✦ Если ошибутся трое и больше, здесь появится подсказка ИИ, как разобрать ошибку с классом.</p>`;
  const res = `<div style="margin-top:12px"><div class="row between"><span>Верно: <b style="color:var(--green)">${ok}</b> · Неверно: <b style="color:var(--red)">${bad}</b></span><b>${n ? Math.round(ok / n * 100) : 0}%</b></div>
     <div class="bar" style="margin-top:6px"><div style="width:${n ? ok / n * 100 : 0}%;background:#7CC26B"></div></div></div>`;
  return `<div class="card"><h3>${STAGES[L.stage]} · фронтальная работа</h3><div class="tabs">${tabs}</div><h2 style="margin:6px 0 12px">${t.text} <span class="muted" style="font-weight:500">${t.expr.replace(' = ?', '')}</span></h2>
    ${L.revealed ? res : `<div class="answered"><b>${n}</b><span class="muted">/10</span><div class="muted">ответили</div><button class="btn" style="margin-top:12px" data-action="reveal" ${n ? '' : 'disabled'}>Показать решение ученикам</button></div>`}
    ${hint}${L.revealed ? `<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-action="nextTask">Дальше →</button></div>` : ''}</div>`;
}

function tPractice() {
  if (!S.lesson.stageStarted) return `<div class="card row between"><div><h3>Практика · самостоятельная работа</h3><p class="muted">Ученики решают на планшетах. Карта класса заполняется в реальном времени.</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const head = `<tr><th></th>${PRACTICE.map((_, k) => `<th>${k + 1}</th>`).join('')}<th>⭐</th><th>✓</th></tr>`;
  const rows = STUDENTS.map((n, i) => `<tr><td class="name">${n}${S.hands.includes(i) ? ' <span class="hand">✋</span>' : ''}</td>${S.practice[i].map(c => {
    const cls = { ok: 'c-ok', bad: 'c-bad', solving: 'c-solving', none: '' }[c.st];
    const label = c.st === 'ok' ? c.attempts : c.st === 'bad' ? (c.attempts >= 2 ? '✕' : c.attempts) : c.st === 'solving' ? '•••' : '';
    return `<td class="${cls}">${label}${c.helper ? '<span class="helper-dot">✦</span>' : ''}</td>`;
  }).join('')}<td>${S.bonus[i].open ? '⭐' : ''}</td><td class="muted">${solvedCount(i)}/7</td></tr>`).join('');
  const reached = STUDENTS.map((n, i) => [n, i]).filter(([, i]) => S.bonus[i].open);
  return `<div class="grid2" style="grid-template-columns:1fr 260px">
    <div class="card"><div class="row between wrap"><h3>Live-карта класса</h3><span class="row" style="gap:6px"><span class="new">✦ новое</span><span class="muted" style="font-size:12px">✦ — решал с ИИ-помощником · ⭐ — в бонусе</span></span></div>
      <table class="map" style="margin-top:8px">${head}${rows}</table>
      <p class="muted" style="font-size:12px;margin-top:6px">Цифра — с какой попытки решено · ✕ — не решено за 2 попытки · ••• — решает</p></div>
    <div class="col"><div class="card"><h3>✋ Подняли руку · ${S.hands.length}</h3>${S.hands.length ? S.hands.map(i => `<div class="queue-item"><span>${STUDENTS[i]}</span><button class="tag ok" data-action="cameOver" data-i="${i}">Подошёл</button></div>`).join('') : '<p class="muted" style="margin-top:8px">Очередь пуста</p>'}</div>
      <div class="card"><div class="row between"><h3>⭐ Бонус</h3><span class="new">✦</span></div><p class="muted" style="font-size:12.5px;margin-top:6px">Открывается каждому, кто закончил практику. Кто решил 70%+ с первой попытки — задания посложнее, остальные — похожие на те, где ошибся.</p>
      <p style="margin-top:8px">В бонусе: <b>${reached.length} из 10</b></p>${reached.map(([n, i]) => `<div class="row between" style="margin-top:4px"><span>⭐ ${n}</span><span class="tag ${strong(i) ? 'ok' : 'mid'}">${strong(i) ? 'посложнее' : 'по ошибкам'}</span></div>`).join('')}</div></div></div>`;
}

const HW_LABEL = { err: ['bad', 'ошибки урока'], skill: ['mid', 'слабый навык'], keep: ['lav', 'закрепление'], hard: ['ok', 'посложнее'] };
function tEnd() {
  const P = S.hw.plans;
  const rowFor = (n, i, edit) => `<div style="padding:9px 0;border-bottom:1px solid var(--line)"><div class="row between"><b>${n}</b><span class="muted">${P[i].length} заданий</span></div>
    <div class="row wrap" style="gap:6px;margin-top:6px">${P[i].map((it, k) => { const t = hwTask(it, k); return `<span class="tag ${HW_LABEL[it.kind][0]}">${t.why}${edit ? ` <button data-action="hwDrop" data-i="${i}" data-k="${k}">✕</button>` : ''}</span>`; }).join('')}</div></div>`;
  const editor = S.hw.editing ? `<div class="modal-bg"><div class="modal"><div class="row between"><h2>Изменить домашку</h2><button data-action="hwClose">✕</button></div>
    <p class="muted" style="margin:6px 0">Уберите лишние задания у конкретного ученика</p>${STUDENTS.map((n, i) => rowFor(n, i, true)).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-action="hwClose">Готово</button></div></div></div>` : '';
  return `<div class="card" style="max-width:760px;margin:20px auto"><div class="row"><span class="tag ok" style="font-size:18px">✓</span><div><h2>Урок завершён</h2><p class="muted">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</p></div></div>
    <div class="banner" style="margin-top:16px"><div class="row between"><b>Персональная домашка собрана для каждого ученика</b><span class="new">✦ новое</span></div>
    <p class="muted" style="margin:4px 0 6px">По ошибкам этого урока, по слабым навыкам ученика и задачи посложнее для тех, кто всё освоил</p>
    <div class="row wrap" style="gap:6px">${Object.values(HW_LABEL).map(([c, l]) => `<span class="tag ${c}">${l}</span>`).join('')}</div>
    <div style="background:#fff;border-radius:12px;padding:4px 12px;margin-top:10px;max-height:330px;overflow:auto">${STUDENTS.map((n, i) => rowFor(n, i, false)).join('')}</div></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn light" data-action="hwEdit" ${S.hw.confirmed ? 'disabled' : ''}>Изменить</button><button class="btn" data-action="hwConfirm" ${S.hw.confirmed ? 'disabled' : ''}>${S.hw.confirmed ? 'Отправлено ✓' : 'Подтвердить'}</button></div></div>${editor}`;
}

const SK_CELL = { ok: ['c-ok', '✓', 'освоено'], prog: ['c-solving', '~', 'в процессе'], gap: ['c-bad', '!', 'пробел'], none: ['', '·', 'нет данных'] };
function tClass() {
  const sel = S.classStudent;
  const head = `<tr><th style="text-align:left">Ученик</th>${SKILL_SHORT.map(s => `<th>${s}</th>`).join('')}</tr>`;
  const rows = STUDENTS.map((n, i) => { const sk = studentSkill(i); return `<tr><td class="name"><button data-action="classStudent" data-i="${i}" style="font-weight:${sel === i ? 700 : 500};color:${sel === i ? 'var(--p)' : 'inherit'}">${n}</button></td>${sk.map(v => `<td class="${SK_CELL[v][0]}">${SK_CELL[v][1]}</td>`).join('')}</tr>`; }).join('');
  let side = `<div class="card"><h3>Выберите ученика</h3><p class="muted" style="margin-top:6px;line-height:1.5">Навыки считаются по ответам каждого ученика: на уроке, в практике и дома.</p></div>`;
  if (sel !== null) {
    const sk = studentSkill(sel); const plan = S.hw?.plans?.[sel];
    side = `<div class="card"><h3>${STUDENTS[sel]}</h3>${SKILLS.map((s, k) => `<div class="skill" style="margin-top:6px"><span>${s}</span><span class="tag ${{ ok: 'ok', prog: 'mid', gap: 'bad', none: 'lav' }[sk[k]]}">${SK_CELL[sk[k]][2]}</span></div>`).join('')}
      ${plan ? `<p style="margin-top:12px"><b>В домашке:</b> ${plan.map((it, k) => hwTask(it, k).why).join(' · ')}</p>` : ''}</div>`;
  }
  return `<h1>Мой класс · навыки</h1><div class="sub">Модуль «Умножение и деление» · по каждому ученику · <span class="new">✦ новое</span></div>
  <div class="grid2" style="grid-template-columns:1fr 300px"><div class="card"><table class="map">${head}${rows}</table>
  <p class="muted" style="font-size:12px;margin-top:8px">✓ освоено · ~ в процессе · ! пробел · · нет данных</p></div>${side}</div>`;
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
const box = (v, cls = '') => `<span class="ans ${cls}">${v ?? ''}</span>`;
const sim = (act, label) => `<button class="btn sim" data-action="${act}">👥 ${label}</button>`;

// Practice task with the decomposition inputs; the helper highlights one group at a time.
function practiceTask(p, c, h) {
  const step = h ? h.step : -1;
  const fill = g => (h && (step > g || h.done)) || c.st === 'ok';
  const cls = g => h ? (step === g && !h.done ? 'hl' : fill(g) ? 'ok' : '') : c.st === 'ok' ? 'ok' : '';
  const ansCls = h ? cls(2) : c.st === 'bad' ? 'bad' : c.st === 'ok' ? 'ok' : '';
  const ansVal = (h ? fill(2) : c.st === 'ok') ? fmt(p.ans) : c.st === 'bad' && !h ? fmt(p.ans - 10) : '';
  const errShown = c.st === 'bad' && !h;
  const l1 = `${p.a} · ${fmt(p.n)} = ${p.a} · (${p.parts.map(x => box(fill(0) || errShown ? fmt(x) : '', errShown ? 'ok' : cls(0))).join(' + ')})`;
  const l2 = `= ${p.prods.map(x => box(fill(1) || errShown ? fmt(x) : '', errShown ? 'ok' : cls(1))).join(' + ')}`;
  const l3 = `= ${box(ansVal, ansCls)}`;
  const tips = [`✦ Разложи ${fmt(p.n)} на разрядные слагаемые: тысячи, сотни, десятки, единицы`, `✦ Умножь каждое слагаемое на ${p.a}`, '✦ Сложи неполные произведения'];
  const tip = h && !h.done ? `<div class="chip-hint">${tips[h.step]}</div>` : h?.done ? `<div class="chip-hint ok">✦ Ты решил сам — ответ засчитан</div>` : '';
  return `<div class="s-task">Вставь пропущенные числа и найди произведение.</div><div class="expr steps"><div>${l1}</div><div>${l2}</div><div>${l3}</div></div>${tip}`;
}

function studentScreen(i) {
  const L = S.lesson; const name = STUDENTS[i].split(' ')[0];
  // outside the lesson: home, knowledge map (by lessons), redo, homework, photo result
  if (L.ended || !L.started) {
    if (S.studentPage === 'map') {
      const solved22 = lessonSolved(i);
      const mod = MAP.map(m => `<div style="margin-top:4px"><div class="row between"><b>${m.module}</b>${m.here ? '<span class="tag lav">ты здесь</span>' : ''}</div>
        ${m.lessons.map(([no, title, done, total]) => { const d = done ?? solved22; const left = total - d; return `<div class="skill" style="margin-top:6px"><span class="muted" style="flex:none;width:22px">${no}</span><span>${title}</span>${total === 0 ? '<span class="muted">🔒</span>' : left > 0 ? `<span class="tag mid">${d}/${total}</span>` : '<span class="tag ok">✓</span>'}</div>`; }).join('')}</div>`).join('');
      const can = L.ended && S.practice[i].some(c => c.st !== 'ok');
      return [`${sTop('Карта знаний', 'по урокам')}<div class="s-body" style="gap:6px">${mod}</div>`,
        `${can ? '<button class="btn" data-action="sRedo">Дорешать урок 22</button>' : ''}<button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
    }
    if (S.studentPage === 'redo') {
      const t = S.cur[i];
      if (t >= PRACTICE.length) return [`${sTop('Урок 22 · дорешивание')}<div class="s-body"><div class="banner" style="background:var(--green-bg)"><b>Все задания урока решены 🎉</b><div>Решено ${lessonSolved(i)} из ${LESSON_TASKS}</div></div></div>`,
        `<button class="btn light" data-action="sPage" data-p="map">← Карта знаний</button>`];
      return practiceScreen(i, 'Урок 22 · дорешивание', `<button class="btn light" data-action="sPage" data-p="map">← Карта знаний</button>`);
    }
    if (S.studentPage === 'photo') {
      const k = PHOTO_WORKS.findIndex(w => w.student === i); const m = S.review.marks[k];
      return [`${sTop('Домашнее задание · задача в тетради')}<div class="s-body"><b>Работа проверена</b><span class="tag mid" style="align-self:flex-start">${m.filter(Boolean).length} из 4</span>${CHECKLIST.map((c, j) => `<div class="banner" style="background:${m[j] ? 'var(--green-bg)' : 'var(--red-bg)'}">${m[j] ? '✓' : '✗'} ${c}</div>`).join('')}</div>`,
        `<button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
    }
    if (S.studentPage === 'hw' && S.hw?.confirmed) {
      const plan = S.hw.plans[i]; const d = S.hwDone[i];
      if (d >= plan.length) return [`${sTop('Домашнее задание', dots(plan.length, -1, plan.map(() => 'ok')))}<div class="s-body"><div class="banner" style="background:var(--green-bg)"><b>Домашка выполнена 🎉</b></div></div>`, `<button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
      const t = hwTask(plan[d], d);
      return [`${sTop('Домашнее задание', dots(plan.length, d))}<div class="s-body"><span class="tag lav" style="align-self:flex-start">✦ подобрано для тебя: ${t.why}</span>
        <div class="s-task">${t.text || 'Найди произведение.'}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${box('?')}</div></div>`,
        `<button class="btn" data-action="sHw">Ответить верно (${fmt(t.ans)})</button><button class="btn light" data-action="sPage" data-p="home">← На главную</button>`];
    }
    const plan = S.hw?.confirmed ? S.hw.plans[i] : null;
    const hwCard = plan ? `<div class="banner"><div class="row between"><b>Твоя домашка · ${plan.length} заданий</b><span class="new">✦</span></div><div class="muted" style="font-size:12.5px">${[...new Set(plan.map((it, k) => hwTask(it, k).why))].slice(0, 3).join(' · ')}</div><div style="font-size:12.5px;margin-top:4px">Решено ${Math.min(S.hwDone[i], plan.length)}/${plan.length}</div></div>`
      : `<div class="banner"><b>Домашнее задание</b><div class="muted" style="font-size:12.5px">${L.ended ? 'Учитель подтверждает домашку…' : 'Появится после урока'}</div></div>`;
    const photoK = PHOTO_WORKS.findIndex(w => w.student === i);
    const photo = photoK >= 0 && S.review.confirmed[photoK] ? `<div class="banner" style="background:var(--green-bg)"><b>Работа в тетради проверена</b><div class="muted" style="font-size:12.5px">Посмотри результат по критериям</div></div>` : '';
    const left = L.ended ? S.practice[i].filter(c => c.st !== 'ok').length : 0;
    return [`${sTop(`Привет, ${name}!`)}<div class="s-body"><div class="banner" style="background:#fff;border:1px solid var(--line)"><b>Урок 22</b><div class="muted" style="font-size:12.5px">${L.ended ? 'Урок завершён' : 'Урок ещё не начался — ждём учителя'}</div></div>${hwCard}${photo}
      <div class="banner" style="background:#fff;border:1px solid var(--line)"><div class="row between"><b>Карта знаний</b>${left ? `<span class="tag mid">можно дорешать: ${left}</span>` : ''}</div><div class="muted" style="font-size:12.5px">Пройденные и текущие темы</div></div></div>`,
      `${plan ? '<button class="btn" data-action="sPage" data-p="hw">Решать домашку</button>' : ''}<button class="btn light" data-action="sPage" data-p="map">Карта знаний</button>${photo ? '<button class="btn light" data-action="sPage" data-p="photo">Результат работы</button>' : ''}`];
  }
  // frontal
  if (L.stage <= 1) {
    const list = FRONTAL[L.stage]; const t = list[L.task];
    if (!L.stageStarted) return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><div style="font-size:40px">👀</div><b>Смотрим на учителя</b></div>`, ''];
    const my = answers()[i];
    const body = L.revealed ? `<div class="expr">${t.expr.replace('?', box(my === 'ok' ? t.right : my === 'bad' ? t.wrong : '—', my === 'ok' ? 'ok' : 'bad'))}</div>
      <div class="banner">${my === 'ok' ? '✓ Верно! Молодец.' : my === 'bad' ? `✗ Не совсем так. Верный ответ: <b>${t.right}</b>` : 'Ты не успел ответить'}</div>`
      : `<div class="expr">${t.expr.replace('?', box(my ? (my === 'ok' ? t.right : t.wrong) : '?'))}</div>${my ? '<div class="banner">Ответ отправлен — ждём остальных</div>' : ''}`;
    return [`${sTop('Урок 22', `${STAGES[L.stage]}: ${dots(list.length, L.task)}`)}<div class="s-body"><div class="s-task">${t.text}</div>${body}</div>`,
      L.revealed ? '<span class="muted">Ждём следующее задание от учителя</span>' : my ? sim('simFrontal', 'Ответы класса') : `<button class="btn" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${sim('simFrontal', 'Ответы класса')}`];
  }
  if (L.stage === 2) {
    if (!L.stageStarted) return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><div style="font-size:40px">👀</div><b>Смотрим на учителя</b></div>`, ''];
    const b = S.bonus[i];
    if (b.open) return bonusScreen(i, !b.seen);
    return practiceScreen(i, 'Урок 22', sim('simPractice', 'Класс решает'));
  }
  if (L.stage === 3) return [`${sTop('Урок 22', 'Рефлексия')}<div class="s-body"><div class="s-task">Как тебе урок?</div><div class="row" style="font-size:34px;justify-content:center">${['😀', '🙂', '🤔'].map(e => `<span style="opacity:${S.reflection[i] === e ? 1 : .4}">${e}</span>`).join('')}</div></div>`,
    `${['😀', '🙂', '🤔'].map(e => `<button class="btn light" data-action="sReflect" data-v="${e}">${e}</button>`).join('')}${sim('simReflect', 'Ответы класса')}`];
  return [`${sTop('Урок 22')}<div class="s-body" style="align-items:center;justify-content:center"><b>Учитель завершает урок</b><span class="muted">Домашка появится на главной</span></div>`, ''];
}

function practiceScreen(i, title, extra) {
  const t = S.cur[i];
  if (t >= PRACTICE.length) return [`${sTop(title)}<div class="s-body"><div class="banner"><b>Практика выполнена</b><div class="muted">Решено ${solvedCount(i)} из 7</div></div></div>`, extra];
  const p = PRACTICE[t], c = S.practice[i][t], h = S.helper[i];
  const head = sTop(title, `Практика: ${dots(7, t, S.practice[i].map(x => x.st))}`);
  if (h) return [`${head}<div class="s-body">${practiceTask(p, c, h)}</div>`,
    h.done ? '<button class="btn" data-action="sHelperNext">Решать дальше →</button>' : `<button class="btn" data-action="sHelperStep">Заполнить шаг ${h.step + 1} из 3</button>`];
  if (c.st === 'bad') return [`${head}<div class="s-body">${practiceTask(p, c, null)}<div class="banner" style="background:var(--red-bg)">Не совсем так — ошибка в последнем шаге.${S.redo ? '' : ' Попытка 1 из 2'}</div></div>`,
    `<button class="btn" data-action="sHelper">✦ Решить с помощником</button><button class="btn out" data-action="sRetry">Решить ещё раз</button><button class="btn light" data-action="sHand">✋ Позвать учителя</button>`];
  return [`${head}<div class="s-body">${practiceTask(p, c, null)}<span class="muted" style="font-size:12px">${S.redo ? 'Дорешивание: можно решать, пока не получится' : `Попытка ${c.attempts + 1} из 2`}</span></div>`,
    `<button class="btn" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${extra}`];
}

function bonusScreen(i, unlock) {
  const b = S.bonus[i]; const tasks = bonusTasks(i); const hard = strong(i);
  const back = sim('simPractice', 'Класс решает');
  if (unlock) return [`${sTop('Урок 22', 'Бонус')}<div class="s-body" style="align-items:center;text-align:center;justify-content:center"><div style="font-size:44px">⭐</div><span class="new">✦ новое</span><b style="font-size:18px">Открыты бонусные задания!</b>
    <span class="muted">${hard ? 'Ты хорошо справился с практикой. Попробуй задания посложнее — их подобрал ИИ.' : 'Практика закончена. ИИ подобрал задания, похожие на те, где были ошибки, — закрепим.'}</span></div>`,
    `<button class="btn" data-action="sBonusOpen">Решать бонус</button>${back}`];
  const k = b.done.length;
  if (k >= tasks.length) return [`${sTop('Урок 22', 'Бонус')}<div class="s-body"><div class="banner"><b>Бонус пройден ⭐</b><div class="muted">${b.done.filter(Boolean).length} из ${tasks.length} верно</div></div></div>`, back];
  const t = tasks[k];
  return [`${sTop('Урок 22', `Бонус: ${dots(tasks.length, k, b.done.map(x => x ? 'ok' : 'bad'))}`)}<div class="s-body"><span class="tag lav" style="align-self:flex-start">✦ создано ИИ · ${t.why}</span><div class="s-task">${t.text}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${box('?')}</div></div>`,
    `<button class="btn" data-action="sBonus" data-ok="1">Ответить верно (${fmt(t.ans)})</button><button class="btn out" data-action="sBonus" data-ok="0">Ответить с ошибкой</button>${back}`];
}

// ---------- Plumbing ----------
function render() {
  const stage = document.getElementById('stage');
  stage.className = 'stage ' + ({ both: 'both', teacher: 'teacher-only', student: 'student-only' }[S.view]);
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  document.getElementById('teacher').innerHTML = teacher();
  document.getElementById('studentWrap').innerHTML = student();
}
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
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
