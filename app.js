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
  if (kind === 'helper') { practiceAnswer(S.me, false); toast('Ученик ошибся — нажмите «✦ С помощником» на планшете'); }
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

// ---------- Render: icons ----------
const ICON = {
  home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>',
  plan: '<path d="M12 4 3 8.5l9 4.5 9-4.5zM3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9" r="2.6"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5zM14.5 19c.2-2-.5-3.6-1.6-4.7 3.5-.7 7.1 1 7.1 4.7z"/>',
  check: '<path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="m8.5 13 2.3 2.3 4.7-4.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  live: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z" fill="#fff"/>',
  audio: '<path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4" fill="none" stroke="currentColor" stroke-width="2"/>',
};
const CHEV = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const ic = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- Render: teacher ----------
const NAV = [['home', 'home', 'Главная'], ['live', 'plan', 'Тематический план'], ['myclass', 'users', 'Мой класс'], ['review', 'check', 'На проверку'], ['audio', 'audio', 'Разбор урока']];
const inLesson = () => S.page === 'live' && S.lesson.started && !S.lesson.ended;
function teacher() {
  const pending = S.review.confirmed.filter(c => !c).length;
  const mini = inLesson();
  const nav = NAV.map(([p, icon, t]) => {
    const on = S.page === p;
    const badge = p === 'review' && pending ? `<span class="cnt">${pending}</span>` : p === 'audio' ? '<span class="new sm">✦</span>' : '';
    if (mini) return `<button class="nav-ic ${on ? 'on' : ''}" data-action="nav" data-p="${p}" title="${t}">${p === 'live' ? ic('live') : ic(icon)}${p === 'live' ? '<i class="dot"></i>' : ''}</button>`;
    return `<button class="nav ${on ? 'on' : ''}" data-action="nav" data-p="${p}">${ic(icon)}<span>${t}</span>${badge}</button>`;
  }).join('');
  const page = { home: tHome, live: tLive, myclass: tClass, review: tReview, audio: tAudio }[S.page]();
  const side = mini
    ? `<aside class="side mini"><span class="logo">A</span><div class="nav-col">${nav}</div><span class="ava sm">НМ</span></aside>`
    : `<aside class="side"><div class="side-head"><span class="logo">A</span><b>AI Math</b><span class="muted" style="margin-left:auto">‹</span></div><div class="nav-col">${nav}</div>
      <div class="side-foot"><div class="lbl">Группа</div><div class="fake-select">4-А <span class="muted">${CHEV}</span></div><div class="lang"><span class="on">RU</span><span>AZ</span></div>
      <div class="me"><span class="ava">НМ</span><b>Нармин Мамедова</b><span class="muted">⇥</span></div></div></aside>`;
  return `${side}<div class="main ${mini ? 'flush' : ''}">${page}</div><button class="chat-fab" aria-label="Поддержка">···</button>`;
}

function firedHints() {
  return Object.entries(S.frontal).map(([k, a]) => [FRONTAL[k[0]]?.[k[2]], Object.values(a).filter(v => v === 'bad').length, k]).filter(([t, bad]) => t && bad >= 3);
}

function tHome() {
  const gaps = STUDENTS.map((n, i) => [n, studentSkill(i)]).filter(([, sk]) => sk.includes('gap'));
  const hints = firedHints();
  return `<h1>Добрый день, Нармин!</h1><div class="sub">Вторник, 20 октября · 4-А</div>
  <div class="hero"><div class="hero-ic">${ic('plan', 26)}</div><div style="flex:1"><div class="kicker">БЛИЖАЙШИЙ УРОК · СЕГОДНЯ</div><div class="hero-t">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div>
  <div class="row" style="margin-top:8px;gap:6px"><span class="chip-w">Модуль · Умножение и деление</span><span class="chip-w">5 критериев освоения</span></div></div>
  <button class="btn white" data-action="nav" data-p="live">Подготовка к уроку ›</button></div>
  <div class="label-up">Класс сегодня</div>
  <div class="grid3">
    <div class="card kpi"><span class="kpi-ic">⭐</span><b>${S.bonus.filter(b => b.open).length} <small>/ 10</small></b><span class="muted">дошли до бонуса</span></div>
    <div class="card kpi"><span class="kpi-ic">!</span><b>${gaps.length}</b><span class="muted">учеников с пробелом в навыках</span></div>
    <div class="card kpi"><span class="kpi-ic">✓</span><b>${S.review.confirmed.filter(c => !c).length}</b><span class="muted">работ на проверке · ИИ отметил заранее</span></div>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div class="card"><div class="row between"><h3>Ученики с пробелами</h3><span class="new">✦ новое</span></div>
      ${gaps.length ? gaps.slice(0, 5).map(([n, sk]) => `<div class="li"><span class="ava xs">${n.split(' ').map(x => x[0]).join('')}</span><span>${n}</span><span class="tag bad" style="margin-left:auto">${sk.map((v, s) => v === 'gap' ? SKILL_SHORT[s] : null).filter(Boolean).join(', ')}</span></div>`).join('') : '<p class="muted" style="margin-top:10px">Появятся после урока</p>'}</div>
    <div class="card"><div class="row"><span class="spark">✦</span><h3>ИИ-подсказки по фронтальной работе</h3></div>
      ${hints.length ? hints.map(([t, bad]) => `<div class="li col-li"><b>${t.hintTitle}</b><span class="muted" style="font-size:12.5px">ошиблись ${bad} — подсказка показана на уроке</span></div>`).join('')
        : '<p class="muted" style="margin-top:8px;line-height:1.5">Когда трое и больше учеников ошибаются во фронтальном задании, учитель сразу получает совет, как разобрать ошибку.</p>'}</div>
  </div>`;
}

const STAGE_TIME = ['04:48', '11:12', '09:48', '03:12', ''];
function tLive() {
  const L = S.lesson;
  if (L.ended) return `<div class="pad">${tEnd()}</div>`;
  if (!L.started) return `<h1>Подготовка к уроку</h1><div class="sub">Просмотрите материалы заранее и начните урок, когда класс готов</div>
    <div class="card row between"><div><div class="label-up" style="margin:0 0 4px">Сегодня · 4-А</div><h2>Умножение четырёхзначного числа на однозначное число (ч.2)</h2><span class="chip-l">Модуль · Умножение и деление</span></div><button class="btn" data-action="startLesson">▶ Начать урок</button></div>
    <div class="seg-tabs"><span class="on">Материалы</span><span>Аналитика</span><span class="off">Фото</span><span class="off">Домашка</span></div>
    <div class="card"><div class="label-up" style="margin-top:0">Что нового в уроке к концу года</div><ul class="ul">
    <li>ИИ-подсказка учителю во фронтальной работе, когда класс ошибся</li><li><span class="new sm">✦</span> ИИ-помощник ведёт ученика по шагам прямо в задании</li>
    <li><span class="new sm">✦</span> Бонус всем, кто закончил практику: посложнее или по своим ошибкам</li><li><span class="new sm">✦</span> Персональная домашка: свои ошибки и слабые навыки каждого</li></ul>
    <p class="muted" style="margin-top:12px;font-size:12.5px">Быстро перейти к любой функции — меню «Показать функцию» сверху.</p></div>`;
  const stepper = STAGES.map((s, k) => k === L.stage
    ? `<button class="step on" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}${STAGE_TIME[k] ? `<em>${STAGE_TIME[k]}</em>` : ''}</button>`
    : `<button class="step" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}${STAGE_TIME[k] ? `<span class="t">${STAGE_TIME[k]}</span>` : ''}</button>`).join('');
  let body = '';
  if (L.stage <= 1) body = tFrontal();
  else if (L.stage === 2) body = tPractice();
  else if (L.stage === 3) body = `<div class="card mid-card"><h3>Рефлексия</h3><p class="muted">Ответили: ${Object.keys(S.reflection).length} из 10</p><div class="row" style="margin-top:10px;font-size:26px">${Object.values(S.reflection).join(' ')}</div></div>`;
  else body = `<div class="card mid-card row between"><div><h3>Домашнее задание</h3><p class="muted">После завершения ИИ соберёт каждому свой набор</p></div><button class="btn" data-action="endLesson">Завершить урок</button></div>`;
  return `<div class="live-head"><div class="row between"><b class="lt">Умножение четырёхзначного числа на однозначное число (ч.2)</b><div class="row" style="gap:10px"><span class="tablets"><i></i>Планшеты активны</span><button class="btn grey sm">Заблокировать</button><button class="btn grey sm" data-action="endLesson">Завершить урок</button></div></div>
  <div class="stepper" style="margin-top:12px">${stepper}</div></div>
  <div class="pad">${body}</div>`;
}

function tFrontal() {
  const L = S.lesson, list = FRONTAL[L.stage], t = list[L.task];
  if (!L.stageStarted) return `<div class="card mid-card row between"><div><h3>${STAGES[L.stage]}</h3><p class="muted">${list.length} задания · все ученики решают одно и то же · нажмите «Старт»</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const a = answers(); const n = Object.keys(a).length; const bad = Object.values(a).filter(v => v === 'bad').length; const ok = n - bad;
  const tabs = list.map((_, k) => `<span class="${k === L.task ? 'on' : ''}">№${k + 1}</span>`).join('');
  const vote = L.hintVotes[key()];
  const ex = Object.entries(a).find(([, v]) => v === 'bad');
  const hint = bad >= 3 ? `<div class="hint"><div class="row between"><b>✦ ${t.hintTitle}</b><span class="red-t">${bad} из ${n}</span></div>
    <p>${t.hint}</p><div class="row between" style="margin-top:10px"><span class="muted">Пример: <span class="pill-l">${STUDENTS[+ex[0]]} ›</span></span>
    <span class="row" style="gap:8px"><button data-action="hintVote" data-v="up" class="thumb ${vote === 'up' ? 'on' : ''}">👍</button><button data-action="hintVote" data-v="down" class="thumb ${vote === 'down' ? 'on' : ''}">👎</button></span></div></div>` : '';
  const res = `<div class="label-up">Как ответил класс</div><div class="row" style="gap:14px"><span>Верно: <b class="g">${ok}</b></span><span>Неверно: <b class="r">${bad}</b></span><div class="bar" style="flex:1"><div style="width:${n ? ok / n * 100 : 0}%;background:#7ACB8B"></div></div><b class="g">${n ? Math.round(ok / n * 100) : 0}%</b></div>
    ${bad === 0 && n ? '<div class="okbar">✓ Все ответили верно — можно двигаться дальше</div>' : ''}`;
  return `<div class="card mid-card"><div class="row between"><h3>${STAGES[L.stage]}</h3><button class="btn lav sm">👁 Посмотреть задание</button></div><div class="tabs">${tabs}</div><h2 style="margin:4px 0 14px">${t.text}</h2>
    ${L.revealed ? res : `<div class="answered"><b>${n}<small>/10</small></b><div class="muted">ответили · ждём остальных</div><button class="btn" style="margin-top:14px" data-action="reveal" ${n ? '' : 'disabled'}>Показать решение ученикам</button><div class="link">Показать отстающих · ${10 - n}</div></div>`}
    ${hint}${L.revealed ? `<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-action="nextTask">Дальше ›</button></div>` : ''}</div>`;
}

function tPractice() {
  if (!S.lesson.stageStarted) return `<div class="card mid-card row between"><div><h3>Практика · самостоятельная работа</h3><p class="muted">Ученики решают задания на планшетах по трекам. После старта карта класса заполняется в реальном времени: кто решил, кто ошибается, кто поднял руку.</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const legend = [['#DDF6D5', 'решено'], ['#FBEBB8', 'частично'], ['#E4E6F8', 'принято'], ['#FBDCD6', 'ошибается'], ['#EEF0FA', 'на проверке'], ['#FFF4D9', 'решает'], ['#F1F0F6', 'не дошёл']].map(([c, l]) => `<span class="lg"><i style="background:${c}"></i>${l}</span>`).join('');
  const head = `<tr><th class="th-name">Ученик</th>${PRACTICE.map((_, k) => `<th>${k + 1}</th>`).join('')}<th>⭐</th><th>✓</th></tr>`;
  const rows = STUDENTS.map((n, i) => `<tr><td class="name"><span class="trk">A</span>${n}${S.hands.includes(i) ? ' <span class="hand">✋</span>' : ''}</td>${S.practice[i].map(c => {
    const cls = { ok: 'c-ok', bad: 'c-bad', solving: 'c-solving', none: '' }[c.st];
    const label = c.st === 'ok' ? c.attempts : c.st === 'bad' ? (c.attempts >= 2 ? '✕' : c.attempts) : c.st === 'solving' ? '•••' : '';
    return `<td class="${cls}">${label}${c.helper ? '<span class="helper-dot">✦</span>' : ''}</td>`;
  }).join('')}<td>${S.bonus[i].open ? '⭐' : ''}</td><td class="muted">${solvedCount(i)}/7</td></tr>`).join('');
  const reached = STUDENTS.map((n, i) => [n, i]).filter(([, i]) => S.bonus[i].open);
  return `<div class="grid2" style="grid-template-columns:1fr 270px">
    <div class="card"><div class="row between wrap" style="gap:8px"><h3>Live-карта класса</h3><div class="legend-row">${legend}</div></div>
      <div class="muted" style="font-size:12px;margin:6px 0 2px"><span class="new sm">✦ новое</span> ✦ в ячейке — решал с ИИ-помощником · ⭐ — в бонусе</div>
      <table class="map">${head}${rows}</table></div>
    <div class="col"><div class="card"><h3>✋ Подняли руку · ${S.hands.length}</h3><p class="muted" style="font-size:12px">по времени ожидания · закрываете вы</p>${S.hands.length ? S.hands.map(i => `<div class="queue-item"><span>${STUDENTS[i]}</span><button class="okbtn" data-action="cameOver" data-i="${i}">✓ Подошёл</button></div>`).join('') : '<p class="muted center" style="margin-top:12px">Очередь пуста</p>'}</div>
      <div class="card"><div class="row between"><h3>⭐ Бонус</h3><span class="new sm">✦</span></div><p class="muted" style="font-size:12px;margin-top:4px;line-height:1.45">Открывается каждому, кто закончил практику: 70%+ с первой попытки — посложнее, остальным — похожие на те, где ошибся.</p>
      <p style="margin-top:8px">В бонусе: <b>${reached.length} из 10</b></p>${reached.map(([n, i]) => `<div class="row between" style="margin-top:5px"><span>${n}</span><span class="tag ${strong(i) ? 'ok' : 'mid'}">${strong(i) ? 'посложнее' : 'по ошибкам'}</span></div>`).join('')}</div></div></div>`;
}

const HW_LABEL = { err: ['bad', 'ошибки урока'], skill: ['mid', 'слабый навык'], keep: ['lav', 'закрепление'], hard: ['ok', 'посложнее'] };
function tEnd() {
  const P = S.hw.plans;
  const rowFor = (n, i, edit) => `<div class="hw-row"><div class="row between"><span class="row" style="gap:8px"><span class="ava xs">${n.split(' ').map(x => x[0]).join('')}</span><b>${n}</b></span><span class="muted">${P[i].length} заданий</span></div>
    <div class="row wrap" style="gap:6px;margin-top:6px">${P[i].map((it, k) => { const t = hwTask(it, k); return `<span class="tag ${HW_LABEL[it.kind][0]}">${t.why}${edit ? ` <button data-action="hwDrop" data-i="${i}" data-k="${k}">✕</button>` : ''}</span>`; }).join('')}</div></div>`;
  const editor = S.hw.editing ? `<div class="modal-bg"><div class="modal"><div class="row between"><h2>Изменить домашку</h2><button data-action="hwClose">✕</button></div>
    <p class="muted" style="margin:6px 0">Уберите лишние задания у конкретного ученика</p>${STUDENTS.map((n, i) => rowFor(n, i, true)).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-action="hwClose">Готово</button></div></div></div>` : '';
  return `<div class="card" style="max-width:760px;margin:10px auto"><div class="row"><span class="done-ic">✓</span><div><h2>Урок завершён</h2><p class="muted">Умножение четырёхзначного числа на однозначное число (ч.2)</p></div></div>
    <div class="soft" style="margin-top:16px"><div class="row between"><b>Персональная домашка собрана для каждого ученика</b><span class="new">✦ новое</span></div>
    <p class="muted" style="margin:4px 0 8px">По ошибкам этого урока, по слабым навыкам ученика и задачи посложнее для тех, кто всё освоил</p>
    <div class="row wrap" style="gap:6px">${Object.values(HW_LABEL).map(([c, l]) => `<span class="tag ${c}">${l}</span>`).join('')}</div>
    <div class="hw-list">${STUDENTS.map((n, i) => rowFor(n, i, false)).join('')}</div></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn lav" data-action="hwEdit" ${S.hw.confirmed ? 'disabled' : ''}>Изменить</button><button class="btn" data-action="hwConfirm" ${S.hw.confirmed ? 'disabled' : ''}>${S.hw.confirmed ? 'Отправлено ✓' : 'Подтвердить'}</button></div></div>${editor}`;
}

const SK_CELL = { ok: ['c-ok', '✓', 'освоено'], prog: ['c-solving', '~', 'в процессе'], gap: ['c-bad', '!', 'пробел'], none: ['', '·', 'нет данных'] };
function tClass() {
  const sel = S.classStudent;
  const head = `<tr><th class="th-name">Ученик</th>${SKILL_SHORT.map(s => `<th>${s}</th>`).join('')}</tr>`;
  const rows = STUDENTS.map((n, i) => { const sk = studentSkill(i); return `<tr class="${sel === i ? 'sel' : ''}"><td class="name"><button data-action="classStudent" data-i="${i}" class="row" style="gap:8px"><span class="ava xs">${n.split(' ').map(x => x[0]).join('')}</span>${n}</button></td>${sk.map(v => `<td class="${SK_CELL[v][0]}">${SK_CELL[v][1]}</td>`).join('')}</tr>`; }).join('');
  let side = `<div class="card" style="flex:1 1 260px"><h3>Выберите ученика</h3><p class="muted" style="margin-top:6px;line-height:1.5">Навыки считаются по ответам каждого ученика: на уроке, в практике и дома.</p></div>`;
  if (sel !== null) {
    const sk = studentSkill(sel); const plan = S.hw?.plans?.[sel];
    side = `<div class="card" style="flex:1 1 260px"><div class="row" style="gap:10px"><span class="ava">${STUDENTS[sel].split(' ').map(x => x[0]).join('')}</span><h3>${STUDENTS[sel]}</h3></div>${SKILLS.map((s, k) => `<div class="skill"><span>${s}</span><span class="tag ${{ ok: 'ok', prog: 'mid', gap: 'bad', none: 'lav' }[sk[k]]}">${SK_CELL[sk[k]][2]}</span></div>`).join('')}
      ${plan ? `<div class="label-up">В домашке</div><div class="row wrap" style="gap:6px">${plan.map((it, k) => `<span class="tag ${HW_LABEL[it.kind][0]}">${hwTask(it, k).why}</span>`).join('')}</div>` : ''}</div>`;
  }
  return `<h1>Мой класс · 4-А</h1><div class="sub">Навыки модуля «Умножение и деление» — по каждому ученику <span class="new sm">✦ новое</span></div>
  <div class="flexwrap"><div class="card" style="flex:1 1 560px"><table class="map skills">${head}${rows}</table>
  <p class="muted" style="font-size:12px;margin-top:8px">✓ освоено · ~ в процессе · ! пробел · · нет данных</p></div>${side}</div>`;
}

function tReview() {
  const r = S.review, w = PHOTO_WORKS[r.idx], m = r.marks[r.idx];
  const done = r.confirmed.filter(Boolean).length; const score = m.filter(Boolean).length;
  const status = score === 4 ? ['g', 'Выполнено'] : score >= 2 ? ['a', 'Частично выполнено'] : ['r', 'Задание не выполнено'];
  return `<div class="link-back">‹ К очереди</div><h1>Задача «Покупка»</h1><button class="btn" style="margin:10px 0 14px">👁 Показать задание</button>
  <div class="row between" style="margin-bottom:10px"><b>Работа ${r.idx + 1} из ${PHOTO_WORKS.length}</b><span class="muted">${done} из ${PHOTO_WORKS.length} проверено</span></div>
  <div class="grid2" style="grid-template-columns:340px 1fr">
   <div class="card col"><div><h3>Чеклист проверки</h3><div class="row" style="margin-top:6px;gap:6px"><span class="new sm">✦ ИИ</span><span class="muted" style="font-size:12.5px">отметил предварительно — проверьте</span></div></div>
    <div class="row" style="gap:8px"><button class="btn grey sm" style="flex:1">Сбросить</button><button class="btn grey sm" style="flex:1">Отметить все</button></div>
    ${CHECKLIST.map((c, k) => `<button class="check ${m[k] ? 'on' : ''}" data-action="mark" data-k="${k}"><span class="box">${m[k] ? '✓' : ''}</span><span>${c}</span>${w.ai[k] && m[k] ? '<span class="ai-mark">ИИ</span>' : ''}</button>`).join('')}
    <div class="score ${status[0]}"><b>${score}/4</b> ${status[1]}</div>
    <div class="row"><button class="btn grey" data-action="prevWork" ${r.idx ? '' : 'disabled'}>‹ Назад</button><button class="btn" style="flex:1" data-action="confirmWork" ${r.confirmed[r.idx] ? 'disabled' : ''}>${r.confirmed[r.idx] ? 'Подтверждено ✓' : 'Подтвердить и далее ›'}</button></div></div>
   <div class="card"><div class="row" style="gap:10px"><span class="ava">${STUDENTS[w.student].split(' ').map(x => x[0]).join('')}</span><b>${STUDENTS[w.student]}</b></div><div class="row between" style="margin:12px 0 8px"><b style="font-size:13px">Фото из тетради</b><span class="muted" style="font-size:12px">1 фото</span></div><div class="notebook">${w.lines.join('<br>')}</div></div></div>`;
}

function tAudio() {
  const body = S.audio === 'none' ? `<div class="card row between"><div><h3>Запись урока 22</h3><p class="muted">Учитель загружает запись урока — платформа не ведёт непрерывную запись</p></div><button class="btn" data-action="upload">Загрузить запись урока</button></div>`
    : S.audio === 'processing' ? `<div class="card"><h3>ИИ анализирует запись…</h3><div class="bar" style="margin-top:10px"><div style="width:65%;background:var(--p)"></div></div></div>`
    : `<div class="grid2"><div class="card"><h3>Кто говорил на уроке</h3><div class="bar" style="height:20px;margin-top:12px;display:flex"><div style="width:64%;background:var(--p);border-radius:0"></div><div style="width:36%;background:#BDB0FA;border-radius:0"></div></div>
       <div class="row between" style="margin-top:6px"><span>Учитель — 64%</span><span>Ученики — 36%</span></div>
       <div class="grid2" style="margin-top:14px"><div class="soft"><b style="font-size:22px">7</b><div class="muted">открытых вопросов классу</div></div><div class="soft"><b style="font-size:22px">3 с</b><div class="muted">среднее ожидание ответа</div></div></div></div>
       <div class="card"><div class="row"><span class="spark">✦</span><h3>Рекомендации к следующему уроку</h3></div><ol class="ul" style="list-style:decimal">
       <li>Сократите объяснение в «Решаем вместе» — дайте ученикам проговорить шаги самим.</li><li>После вопроса подождите 5–7 секунд, прежде чем вызвать ученика.</li><li>Хорошо: вы разобрали типичную ошибку на примере ответа ученика.</li></ol></div></div>`;
  return `<h1>Разбор урока</h1><div class="sub">ИИ-аудиокоуч · <span class="new sm">✦ новое</span></div>${body}`;
}

// ---------- Render: student tablet ----------
function student() {
  const i = S.me;
  const picker = `<div class="picker">Планшет ученика: <select data-change="pick">${STUDENTS.map((n, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
  const [screen, ctrls] = studentScreen(i);
  return `${picker}<div class="tablet"><div class="screen">${screen}</div></div>${ctrls ? `<div class="controls"><h4>Ввод ученика и класс (симуляция)</h4><div class="row">${ctrls}</div></div>` : ''}`;
}
const initials = n => n.split(' ').map(x => x[0]).join('');
function sTop(title, right = '', back = '') { return `<div class="s-top">${back ? `<button class="s-back" data-action="sPage" data-p="${back}">←</button>` : ''}<span class="s-title">${title}</span><span class="s-right">${right}</span></div>`; }
function dots(label, n, curIdx, states) { return `<span class="dl">${label}</span><span class="pill-dots">${Array.from({ length: n }, (_, k) => `<i class="${states?.[k] === 'ok' ? 'ok' : states?.[k] === 'bad' ? 'bad' : k === curIdx ? 'on' : k > curIdx ? 'lock' : ''}">${k > curIdx && !states?.[k] ? '🔒' : k + 1}</i>`).join('')}</span>`; }
const box = (v, cls = '') => `<span class="ans ${cls}">${v ?? ''}</span>`;
const sim = (act, label) => `<button class="btn sim" data-action="${act}">👥 ${label}</button>`;
const ansBtns = (extra = '') => `<button class="btn" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${extra}`;
const sBottom = html => `<div class="s-bottom">${html}</div>`;
const LESSON_T = 'Умножение четырёхзначного числа на однозначное число (ч.2)';

function practiceTask(p, c, h) {
  const step = h ? h.step : -1;
  const fill = g => (h && (step > g || h.done)) || c.st === 'ok';
  const cls = g => h ? (step === g && !h.done ? 'hl' : fill(g) ? 'ok' : '') : c.st === 'ok' ? 'ok' : '';
  const errShown = c.st === 'bad' && !h;
  const ansCls = h ? cls(2) : c.st === 'bad' ? 'bad' : c.st === 'ok' ? 'ok' : '';
  const ansVal = (h ? fill(2) : c.st === 'ok') ? fmt(p.ans) : errShown ? fmt(p.ans - 10) : '';
  const l1 = `${p.a} · ${fmt(p.n)} = ${p.a} · (${p.parts.map(x => box(fill(0) || errShown ? fmt(x) : '', errShown ? 'ok' : cls(0))).join(' + ')})`;
  const l2 = `= ${p.prods.map(x => box(fill(1) || errShown ? fmt(x) : '', errShown ? 'ok' : cls(1))).join(' + ')}`;
  const tips = [`Разложи ${fmt(p.n)} на разрядные слагаемые`, `Умножь каждое слагаемое на ${p.a}`, 'Сложи неполные произведения'];
  const tip = h && !h.done ? `<div class="chip-hint">✦ ${tips[h.step]}</div>` : h?.done ? `<div class="chip-hint ok">✓ Ты решил сам — ответ засчитан</div>` : '';
  return `<div class="s-task">Вставь пропущенные числа и найди произведение.</div><div class="expr steps"><div>${l1}</div><div>${l2}</div><div>= ${box(ansVal, ansCls)}</div></div>${tip}`;
}

function studentScreen(i) {
  const L = S.lesson; const name = STUDENTS[i].split(' ')[0];
  const head = sTop(`<span class="ava xs b">${initials(STUDENTS[i])}</span> ${STUDENTS[i]} <span class="muted">4-А</span>`, '<span class="exit">Выйти</span>');
  if (L.ended || !L.started) {
    if (S.studentPage === 'map') {
      const solved22 = lessonSolved(i);
      const mods = MAP.map(m => {
        const rows = m.lessons.map(([no, title, done, total]) => {
          const d = done ?? solved22; const pct = total ? d / total : 0;
          if (total === 0) return `<div class="lrow locked"><span class="ring lock">🔒</span><div><b>${title}</b></div></div>`;
          const act = no === 22 && L.ended && S.practice[i].some(c => c.st !== 'ok') ? '<button class="pill-btn" data-action="sRedo">Решать</button>' : d < total ? `<span class="cnt-t">${d}/${total}</span>` : '<span class="ok-t">✓</span>';
          return `<div class="lrow ${no === 22 ? 'cur' : ''}"><span class="ring" style="--pc:${pct * 100}%">${no}</span><div style="flex:1"><b>${title}</b><div class="muted xs">${d}/${total} заданий</div></div>${act}</div>`;
        }).join('');
        return `<div class="mod"><div class="mod-h"><span class="chev">${CHEV}</span><div style="flex:1"><b>${m.module}</b>${m.here ? ' <span class="here">ТЫ ЗДЕСЬ</span>' : ''}<div class="muted xs">${m.lessons.filter(l => (l[2] ?? solved22) >= l[3] && l[3]).length} из ${m.lessons.length} уроков выполнено</div></div><span class="stars">★<span>★★</span></span></div>${rows}</div>`;
      }).join('');
      return [`${sTop('Карта знаний', '', 'home')}<div class="s-body home"><h2 class="s-h2">Карта знаний</h2><div class="muted xs" style="margin-top:-8px">Пройденные и текущие темы · Математика 4 класс</div>${mods}</div>`, ''];
    }
    if (S.studentPage === 'redo') {
      const t = S.cur[i];
      if (t >= PRACTICE.length) return [`${sTop(LESSON_T, '', 'map')}<div class="s-body center"><div class="big-ok">✓</div><b>Все задания урока решены</b><span class="muted">Решено ${lessonSolved(i)} из ${LESSON_TASKS}</span></div>${sBottom('<button class="btn wide" data-action="sPage" data-p="map">К карте знаний</button>')}`, ''];
      return practiceScreen(i, true);
    }
    if (S.studentPage === 'photo') {
      const k = PHOTO_WORKS.findIndex(w => w.student === i); const m = S.review.marks[k];
      return [`${sTop('Домашнее задание · задача в тетради', '', 'home')}<div class="s-body"><b>Работа проверена</b><span class="score a" style="align-self:flex-start"><b>${m.filter(Boolean).length}/4</b></span>${CHECKLIST.map((c, j) => `<div class="crit ${m[j] ? 'ok' : 'bad'}">${m[j] ? '✓' : '✕'} ${c}</div>`).join('')}</div>`, ''];
    }
    if (S.studentPage === 'hw' && S.hw?.confirmed) {
      const plan = S.hw.plans[i]; const d = S.hwDone[i];
      if (d >= plan.length) return [`${sTop('Домашнее задание', '', 'home')}<div class="s-body center"><div class="big-ok">✓</div><b>Домашка выполнена</b></div>`, ''];
      const t = hwTask(plan[d], d);
      return [`${sTop('Домашнее задание', dots('Домашка:', plan.length, d), 'home')}<div class="s-body"><span class="why">✦ ${t.why}</span><div class="s-task">${t.text || 'Найди произведение.'}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${box('')}</div></div>${sBottom('<button class="btn wide disabled-look">Отправить</button>')}`,
        `<button class="btn" data-action="sHw">Ответить верно (${fmt(t.ans)})</button>`];
    }
    const plan = S.hw?.confirmed ? S.hw.plans[i] : null;
    const photoK = PHOTO_WORKS.findIndex(w => w.student === i);
    const photo = photoK >= 0 && S.review.confirmed[photoK];
    const left = L.ended ? S.practice[i].filter(c => c.st !== 'ok').length : 0;
    const lessonState = L.ended ? '<span class="st-pill">Урок завершён</span>' : '<span class="st-pill"><i></i>Урок еще не начался — ждем учителя</span>';
    return [`${head}<div class="s-body home"><h2 class="s-h2 center">Привет, ${name}! 👋</h2>
      <div class="sec">Классная работа</div><div class="s-card"><span class="ill">▦</span><div><div class="muted xs">Сегодняшний урок</div><b>Урок 22</b><div>${lessonState}</div></div></div>
      <div class="sec">Домашняя работа</div><div class="s-card"><span class="ill y">✎</span><div style="flex:1"><b>${plan ? `Твоя домашка · ${plan.length} заданий` : 'Домашнее задание'}</b> ${plan ? '<span class="new sm">✦</span>' : ''}<div class="muted xs">${plan ? 'Подобрано по твоим ошибкам и навыкам' : L.ended ? 'Учитель подтверждает домашку…' : 'Сдать до 25 октября'}</div></div>${plan ? `<button class="btn sm" data-action="sPage" data-p="hw">${S.hwDone[i] ? 'Продолжить' : 'Начать'}</button>` : ''}</div>
      ${photo ? `<div class="s-card ok-card"><span class="ill g">✓</span><div style="flex:1"><b>Работа в тетради проверена</b><div class="muted xs">Результат по критериям</div></div><button class="btn sm lav" data-action="sPage" data-p="photo">Открыть</button></div>` : ''}
      <div class="sec">Мои достижения</div><button class="s-card" data-action="sPage" data-p="map"><span class="ill b">⌖</span><div style="flex:1;text-align:left"><b>Карта знаний</b><div class="muted xs">${left ? `Можно дорешать: ${left}` : 'Пройденные и текущие темы'}</div></div><span class="pct">50% ›</span></button></div>`, ''];
  }
  if (L.stage <= 1) {
    const list = FRONTAL[L.stage]; const t = list[L.task];
    if (!L.stageStarted) return [watch(), ''];
    const my = answers()[i];
    const top = sTop(LESSON_T, dots(`${STAGES[L.stage]}:`, list.length, L.task));
    if (L.revealed) return [`${top}<div class="s-body"><div class="s-task">${t.text}</div><div class="expr">${t.expr.replace('?', box(my === 'ok' ? t.right : my === 'bad' ? t.wrong : '—', my === 'ok' ? 'ok' : 'bad'))}</div></div>
      <div class="s-result"><span class="res ${my === 'ok' ? 'ok' : 'bad'}">${my === 'ok' ? '✓ Верно! Молодец.' : '✕ Не совсем так.'}</span><div class="cls"><span class="lbl">Как ответил класс:</span><div class="row" style="gap:10px;font-size:12px">Верно: <b>${Object.values(answers()).filter(v => v === 'ok').length}</b> Неверно: <b>${Object.values(answers()).filter(v => v === 'bad').length}</b></div></div></div>`, ''];
    return [`${top}<div class="s-body"><div class="s-task">${t.text}</div><div class="expr">${t.expr.replace('?', box(my ? (my === 'ok' ? t.right : t.wrong) : ''))}</div></div>${sBottom(`<button class="btn wide ${my ? 'disabled-look' : 'disabled-look'}">${my ? 'Ответ отправлен' : 'Отправить'}</button>`)}`,
      my ? sim('simFrontal', 'Ответы класса') : ansBtns(sim('simFrontal', 'Ответы класса'))];
  }
  if (L.stage === 2) {
    if (!L.stageStarted) return [watch(), ''];
    const b = S.bonus[i];
    if (b.open) return bonusScreen(i, !b.seen);
    return practiceScreen(i, false);
  }
  if (L.stage === 3) return [`${sTop(LESSON_T, 'Рефлексия')}<div class="s-body center"><div class="s-task">Как тебе урок?</div><div class="row" style="font-size:38px;gap:18px">${['😀', '🙂', '🤔'].map(e => `<button data-action="sReflect" data-v="${e}" style="opacity:${S.reflection[i] === e ? 1 : .45}">${e}</button>`).join('')}</div></div>`, sim('simReflect', 'Ответы класса')];
  return [watch('Учитель завершает урок'), ''];
}
function watch(text = 'Смотрим на учителя') { return `${sTop(LESSON_T)}<div class="s-body center"><div class="eyes">👀</div><b style="font-size:17px">${text}</b><span class="muted xs">Внимательно слушай объяснение, чтобы лучше усвоить материал.</span></div>`; }

function practiceScreen(i, redo) {
  const t = S.cur[i];
  const top = (tt) => sTop(LESSON_T, dots('Практика:', 7, tt, S.practice[i].map(x => x.st === 'solving' ? null : x.st)), redo ? 'map' : '');
  if (t >= PRACTICE.length) return [`${top(7)}<div class="s-body center"><div class="big-ok">✓</div><b>Практика выполнена</b><span class="muted">Решено ${solvedCount(i)} из 7</span></div>`, sim('simPractice', 'Класс решает')];
  const p = PRACTICE[t], c = S.practice[i][t], h = S.helper[i];
  if (h) return [`${top(t)}<div class="s-body">${practiceTask(p, c, h)}</div>${sBottom(h.done ? '<button class="btn wide" data-action="sHelperNext">Решать дальше</button>' : `<button class="btn wide" data-action="sHelperStep">Заполнить шаг ${h.step + 1} из 3</button>`)}`, ''];
  if (c.st === 'bad') return [`${top(t)}<div class="s-body">${practiceTask(p, c, null)}</div><div class="s-attempt">${redo ? '' : 'Попытка 1/2'}</div>
    ${sBottom(`<button class="btn lav" data-action="sHand">✋ Позвать учителя</button><button class="btn ai" data-action="sHelper">✦ С помощником</button><button class="btn" style="flex:1" data-action="sRetry">↻ Решить еще раз</button>`)}`, redo ? '' : sim('simPractice', 'Класс решает')];
  return [`${top(t)}<div class="s-body">${practiceTask(p, c, null)}</div><div class="s-attempt">${redo ? 'Дорешивание' : `Попытка ${Math.min(2, c.attempts + 1)}/2`}</div>${sBottom(`<button class="btn lav" data-action="sHand">✋</button><button class="btn wide disabled-look">Отправить</button>`)}`,
    ansBtns(redo ? '' : sim('simPractice', 'Класс решает'))];
}

function bonusScreen(i, unlock) {
  const b = S.bonus[i]; const tasks = bonusTasks(i); const hard = strong(i);
  if (unlock) return [`${sTop(LESSON_T, 'Бонус')}<div class="s-body center"><div style="font-size:48px">⭐</div><span class="new">✦ новое</span><b style="font-size:19px">Открыты бонусные задания!</b>
    <span class="muted" style="max-width:340px">${hard ? 'Ты хорошо справился с практикой. Попробуй задания посложнее — их подобрал ИИ.' : 'Практика закончена. ИИ подобрал задания, похожие на те, где были ошибки, — закрепим.'}</span></div>${sBottom('<button class="btn wide" data-action="sBonusOpen">Решать бонус</button>')}`,
    sim('simPractice', 'Класс решает')];
  const k = b.done.length;
  if (k >= tasks.length) return [`${sTop(LESSON_T, 'Бонус')}<div class="s-body center"><div style="font-size:44px">⭐</div><b>Бонус пройден</b><span class="muted">${b.done.filter(Boolean).length} из ${tasks.length} верно</span></div>`, sim('simPractice', 'Класс решает')];
  const t = tasks[k];
  return [`${sTop(LESSON_T, dots('Бонус:', tasks.length, k, b.done.map(x => x ? 'ok' : 'bad')))}<div class="s-body"><span class="why">✦ создано ИИ · ${t.why}</span><div class="s-task">${t.text}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${box('')}</div></div>${sBottom('<button class="btn wide disabled-look">Отправить</button>')}`,
    `<button class="btn" data-action="sBonus" data-ok="1">Ответить верно (${fmt(t.ans)})</button><button class="btn out" data-action="sBonus" data-ok="0">Ответить с ошибкой</button>${sim('simPractice', 'Класс решает')}`];
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
