// AI Math AZ — end-of-year prototype. Teacher app + student tablet in a floating window; the student types answers on the tablet.
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
// AI conclusion under the checklist: what is right, what went wrong, what to do — follows the teacher's marks.
const CHECK_OK = ['перебраны все три пары цен', 'каждая сумма сравнена с 925 манатами', 'выбрана подходящая пара — холодильник и микроволновка', 'найден остаток — 100 манатов'];
const CHECK_BAD = ['рассмотрены не все пары цен', 'суммы не сравнены с 925 манатами, поэтому выбор пары не обоснован', 'выбрана пара, которая не подходит по деньгам', 'не найдено, сколько денег останется'];
const CHECK_TIP = ['попросите выписать все три пары и сумму каждой', 'попросите поставить знак < или > между каждой суммой и 925', 'попросите найти пару, сумма которой не больше 925', 'попросите вычесть стоимость покупки из 925'];
const cap = t => t[0].toUpperCase() + t.slice(1);
function checkConclusion(m) {
  const ok = CHECK_OK.filter((_, k) => m[k]), bad = CHECK_BAD.filter((_, k) => !m[k]), first = m.findIndex(x => !x);
  if (!bad.length) return `Задача решена полностью: ${ok.join(', ')}. Решение записано по шагам — работу можно засчитать.`;
  if (!ok.length) return `Задача не решена: ${bad.join(', ')}. Похоже, ученик не понял, что нужно перебрать пары покупок, — ${CHECK_TIP[0]}.`;
  return `${cap(ok.join(', '))}. Не получилось: ${bad.join(', ')}. Совет: ${CHECK_TIP[first]}.`;
}

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
    view: 'mini', page: 'plan', me: 8,             // tablet window: 'mini' (picture) | 'open'
    lesson: { started: false, stageT0: 0, spent: [], stage: 0, stageStarted: false, task: 0, revealed: false, ended: false, hintVotes: {} },
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
    past: null, pastTab: 'mat', modOpen: {}, classTab: 'main', mapTab: 'topics',        // past lesson opened from the thematic plan
    inp: {},                                        // values typed into the tablet boxes, by box id
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
  nav(el) { S.page = el.dataset.p; if (S.page === 'myclass') S.classStudent = null; },
  reset() { S = freshState(); toast('Состояние сброшено'); },
  pick(el) { S.me = +el.value; S.studentPage = 'home'; S.redo = false; },
  demo(el) { if (el.value) { seed(el.value); el.value = ''; } },
  // teacher: lesson
  startLesson() { S.lesson.started = true; S.lesson.stageT0 = Date.now(); S.page = 'live'; },
  stage(el) { const st = +el.dataset.s, L = S.lesson; if (!L.started) return;
    L.spent[L.stage] = (L.spent[L.stage] || 0) + Date.now() - (L.stageT0 || Date.now());
    Object.assign(L, { stage: st, stageStarted: false, task: 0, revealed: false, stageT0: Date.now() }); },
  stageStart() { S.lesson.stageStarted = true; if (S.lesson.stage === 2) STUDENTS.forEach((_, i) => { if (S.practice[i][0].st === 'none') S.practice[i][0].st = 'solving'; }); },
  reveal() { S.lesson.revealed = true; },
  nextTask() {
    const list = FRONTAL[S.lesson.stage] || [];
    if (S.lesson.task < list.length - 1) { S.lesson.task++; S.lesson.revealed = false; }
    else A.stage({ dataset: { s: S.lesson.stage + 1 } });
  },
  openPast(el) { S.past = +el.dataset.no; S.pastTab = 'mat'; S.page = 'past'; },
  pastTab(el) { S.pastTab = el.dataset.t; },
  toggleMod(el) { const k = el.dataset.m; S.modOpen[k] = el.dataset.open !== '1'; },
  openDoc() { toast('В прототипе материалы не открываются — на платформе здесь файл или предпросмотр'); },
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
  classStudent(el) { S.classStudent = el.dataset.i === '' ? null : +el.dataset.i; },
  openStudent(el) { S.page = 'myclass'; S.classTab = 'main'; S.classStudent = +el.dataset.i; },
  classTab(el) { S.classTab = el.dataset.t; S.classStudent = null; },
  sMapTab(el) { S.mapTab = el.dataset.t; },
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
      const b = S.bonus[i];
      if (b.open && !b.seen) { if (rnd(0.75)) b.seen = true; }
      else if (b.seen && b.done.length < bonusTasks(i).length) b.done.push(rnd(strong(i) ? 0.6 : 0.75));
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
  S = freshState(); S.page = 'live'; const L = S.lesson; L.started = true; L.stageT0 = Date.now();
  if (['helper', 'bonus', 'hw', 'map'].includes(kind)) S.view = 'open';
  const others = (pWrong) => STUDENTS.forEach((_, i) => { if (i !== S.me) answers()[i] = rnd(pWrong) ? 'bad' : 'ok'; });
  if (kind === 'hint') { L.stage = 1; L.stageStarted = true; others(0.5); [0, 3, 5].forEach(i => answers()[i] = 'bad'); answers()[S.me] = 'bad'; }
  if (kind === 'helper' || kind === 'bonus' || kind === 'hw' || kind === 'map' || kind === 'skills') {
    L.stage = 1; L.stageStarted = true; L.revealed = true; others(0.5); answers()[S.me] = 'bad';
    L.stage = 2; A.stageStart(); A.simPractice(); A.simPractice();
  }
  if (kind === 'helper') { practiceAnswer(S.me, false); toast('Ученик ошибся — нажмите «✦ Решить с помощником» на планшете'); }
  if (kind === 'map') { practiceAnswer(S.me, true); practiceAnswer(S.me, false); practiceAnswer(S.me, false); practiceAnswer(S.me, true); }
  if (kind === 'bonus' || kind === 'hw' || kind === 'skills') {
    practiceAnswer(S.me, false); A.sHelper(); A.sHelperStep(); A.sHelperStep(); A.sHelperStep(); A.sHelperNext();
    let k = 0; while (!finishedPractice(S.me) && k < 20) practiceAnswer(S.me, k++ !== 2);
    for (let k = 0; k < 3; k++) A.simPractice();
  }
  if (kind === 'hw' || kind === 'map' || kind === 'skills') { A.endLesson(); }
  if (kind === 'hw') { A.hwConfirm(); S.studentPage = 'hw'; }
  if (kind === 'map') { A.hwConfirm(); S.studentPage = 'map'; }
  if (kind === 'skills') { A.hwConfirm(); S.page = 'myclass'; S.classStudent = S.me; }
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
const NAV = [['home', 'home', 'Главная'], ['plan', 'plan', 'Тематический план'], ['myclass', 'users', 'Мой класс'], ['review', 'check', 'На проверку'], ['audio', 'audio', 'Разбор урока']];
const LIVE_NAV = ['live', 'live', 'Урок 22 · идёт'];
const inLesson = () => S.page === 'live' && S.lesson.started && !S.lesson.ended;
function teacher() {
  const pending = S.review.confirmed.filter(c => !c).length;
  const mini = inLesson();
  const items = S.lesson.started && !S.lesson.ended ? [LIVE_NAV, ...NAV] : NAV;
  const nav = items.map(([p, icon, t]) => {
    const on = S.page === p || (S.page === 'past' && p === 'plan');
    const badge = p === 'review' && pending ? `<span class="cnt">${pending}</span>` : p === 'audio' ? '<span class="new sm">✦</span>' : '';
    if (mini) return `<button class="nav-ic ${on ? 'on' : ''}" data-action="nav" data-p="${p}" title="${t}">${p === 'live' ? ic('live') : ic(icon)}${p === 'live' ? '<i class="dot"></i>' : ''}</button>`;
    return `<button class="nav ${on ? 'on' : ''}" data-action="nav" data-p="${p}">${ic(icon)}<span>${t}</span>${p === 'live' ? '<i class="live-dot"></i>' : badge}</button>`;
  }).join('');
  const page = { home: tHome, plan: tPlan, live: tLive, past: tPast, myclass: tClass, review: tReview, audio: tAudio }[S.page]();
  const side = mini
    ? `<aside class="side mini"><span class="logo">A</span><div class="nav-col">${nav}</div><span class="ava sm">НМ</span></aside>`
    : `<aside class="side"><div class="side-head"><span class="logo">A</span><b>AI Math</b><span class="muted" style="margin-left:auto">‹</span></div><div class="nav-col">${nav}</div>
      <div class="side-foot"><div class="lbl">Группа</div><div class="fake-select">4-А <span class="muted">${CHEV}</span></div><div class="lang"><span class="on">RU</span><span>AZ</span></div>
      <div class="me"><span class="ava">НМ</span><b>Нармин Мамедова</b><span class="muted">⇥</span></div></div></aside>`;
  return `${side}<div class="main ${mini ? 'flush' : ''}">${page}</div><button class="chat-fab" aria-label="Поддержка">···</button>`;
}

function firedHints() {
  return Object.entries(S.frontal).map(([k, a]) => [FRONTAL[k[0]]?.[k[2]], Object.values(a).filter(v => v === 'bad').length, k]).filter(([t, bad, k]) => t && (bad >= 3 || S.frontal[k][S.me] === 'bad'));
}

function tHome() {
  const M = STUDENTS.map((_, i) => classMetrics(i)), last = pastStats(21);
  const today = S.bonus.some(b => b.open);
  // Students with gaps: low overall success or "needs help" on the last lesson; tag = their weakest lesson.
  const gaps = M.map((m, i) => [i, m]).filter(([i, m]) => m.overall < 60 || last.rows[i].st[0] === 'bad')
    .map(([i, m]) => [i, m.byLesson.reduce((a, l) => l[1] < a[1] ? l : a)]);
  const byLesson = PAST_NOS.map(no => [no, pastStats(no).avg]).sort((a, b) => b[1] - a[1]);
  const good = byLesson.slice(0, 2), weak = byLesson.slice(-2).reverse();
  const hints = firedHints(), pastHints = PAST_NOS.filter(no => PAST[no].hint);
  const bonusTile = today ? [`${S.bonus.filter(b => b.open).length} <small>/ 10</small>`, 'дошли до бонуса сегодня']
    : [`${last.bonusPct}%`, `решаемость бонуса на уроке 21 · открыли ${last.bonusOpened} из 10`];
  return `<h1>Добрый день, Нармин!</h1><div class="sub">Вторник, 20 октября · 4-А</div>
  <div class="hero"><div class="hero-ic">${ic('plan', 26)}</div><div style="flex:1"><div class="kicker">БЛИЖАЙШИЙ УРОК · СЕГОДНЯ</div><div class="hero-t">Урок 22 · Умножение четырёхзначного числа на однозначное (ч.2)</div>
  <div class="row" style="margin-top:8px;gap:6px"><span class="chip-w">Модуль · Умножение и деление</span><span class="chip-w">5 критериев освоения</span></div></div>
  <button class="btn white" data-action="nav" data-p="live">Подготовка к уроку ›</button></div>
  <div class="label-up">${today ? 'Класс сегодня' : 'Класс · по прошлым урокам'}</div>
  <div class="grid3">
    <div class="card kpi"><span class="kpi-ic">★</span><b>${bonusTile[0]}</b><span class="muted">${bonusTile[1]}</span></div>
    <div class="card kpi"><span class="kpi-ic">!</span><b>${gaps.length}</b><span class="muted">учеников с пробелами · по урокам 17–21</span></div>
    <div class="card kpi"><span class="kpi-ic">✓</span><b>${S.review.confirmed.filter(c => !c).length}</b><span class="muted">работ на проверке · ИИ отметил заранее</span></div>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div class="card"><div class="row between"><h3>Ученики с пробелами</h3><span class="new">✦ новое</span></div>
      <p class="muted xs" style="margin-top:4px">Общая успешность ниже 60% или не справились на прошлом уроке · указана самая слабая тема</p>
      ${gaps.length ? gaps.map(([i, [no, pct]]) => `<button class="li" style="width:100%;text-align:left" data-action="openStudent" data-i="${i}"><span class="ava xs">${initials(STUDENTS[i])}</span><span>${STUDENTS[i]}</span><span class="tag bad" style="margin-left:auto">${PAST[no]?.topic || planLesson(no)[1]} · ${pct}%</span></button>`).join('') : '<p class="muted" style="margin-top:10px">Пробелов нет</p>'}</div>
    <div class="card"><div class="row"><span class="spark">✦</span><h3>Свод прошлых уроков</h3></div>
      <div class="label-up">Получается хорошо</div>${good.map(([no, v]) => `<div class="li"><span class="tag ok">${v}%</span><span>${cap(PAST[no].topic)} <span class="muted xs">· урок ${no}</span></span></div>`).join('')}
      <div class="label-up">Получается хуже</div>${weak.map(([no, v]) => `<div class="li col-li"><span class="row" style="gap:8px"><span class="tag ${pctTone(v) === 'r' ? 'bad' : 'mid'}">${v}%</span><span>${cap(PAST[no].topic)} <span class="muted xs">· урок ${no}</span></span></span><span class="muted" style="font-size:12.5px">Типичная ошибка: ${PAST[no].hard[0][2]}</span></div>`).join('')}
      <p class="muted xs" style="margin-top:12px;line-height:1.5">✦ ИИ-подсказки по фронтальной работе сработали на ${pastHints.length} из ${PAST_NOS.length} уроков${hints.length ? ` и ${hints.length} раз сегодня` : ''}: когда класс массово ошибается, учитель сразу получает совет, как разобрать ошибку.</p></div>
  </div>`;
}

// Thematic plan: modules and lessons of the course; today's lesson opens the lesson screen.
const PLAN = [
  { module: 'Сложение и вычитание', lessons: [[17, 'Обобщающие задания', '1 окт', 82], [18, 'МСО-1', '6 окт', 74], [19, 'Работа над ошибками', '8 окт', 69]] },
  { module: 'Умножение и деление', lessons: [[20, 'Повторение (вспомните)', '13 окт', 77], [21, 'Умножение четырёхзначного числа на однозначное (ч.1)', '15 окт', 66], [22, 'Умножение четырёхзначного числа на однозначное (ч.2)', '20 окт', null],
    [23, 'Задачи и примеры', '22 окт'], [24, 'Умножение многозначного числа на однозначное (ч.1)', '27 окт'], [25, 'Умножение многозначного числа на однозначное (ч.2)', '29 окт'], [26, 'Деление на однозначное число', '3 ноя']] },
  { module: 'Величины', lessons: [[27, 'Единицы длины', '5 ноя'], [28, 'Единицы массы', '10 ноя'], [29, 'Единицы времени', '12 ноя']] },
];
function tPlan() {
  const L = S.lesson;
  const today = () => L.ended ? `<span class="tag ok">Проведён сегодня</span><button class="btn sm lav" data-action="nav" data-p="live">Итоги урока ›</button>`
    : L.started ? `<span class="tag ok"><i class="live-dot"></i>Идёт урок</span><button class="btn sm" data-action="nav" data-p="live">Вернуться к уроку ›</button>`
    : `<span class="tag lav">Сегодня</span><button class="btn sm lav" data-action="nav" data-p="live">Подготовка</button><button class="btn sm" data-action="startLesson">▶ Начать урок</button>`;
  const mods = PLAN.map((m, mi) => {
    const done = m.lessons.filter(l => l[3] != null || (l[0] === 22 && L.ended)).length;
    const closed = !(S.modOpen[mi] ?? done < m.lessons.length); // finished modules start collapsed
    const rows = m.lessons.map(([no, title, date, solv]) => {
      const cur = no === 22; const past = solv != null;
      const right = cur ? today() : past ? `<span class="muted">решаемость ${pastStats(no).avg}%</span><span class="tag ok">Проведён</span><span class="open-l">Открыть ›</span>` : '<button class="btn sm grey">Материалы</button>';
      return `<div class="prow ${cur ? 'cur' : ''} ${!past && !cur ? 'next' : ''} ${past ? 'click' : ''}" ${past ? `data-action="openPast" data-no="${no}"` : ''}><span class="pno">${no}</span><div style="flex:1;min-width:0"><b>${title}</b><div class="muted xs">${date}${cur ? ' · сегодня' : ''}</div></div><div class="row" style="gap:10px">${right}</div></div>`;
    }).join('');
    return `<div class="card pmod"><div class="row between mod-head" data-action="toggleMod" data-m="${mi}" data-open="${closed ? 0 : 1}"><div class="row"><span class="chev ${closed ? 'shut' : ''}">${CHEV}</span><div><h3>${m.module}</h3><div class="muted xs">${done} из ${m.lessons.length} уроков проведено</div></div></div>
      <div class="bar" style="width:160px"><div style="width:${done / m.lessons.length * 100}%;background:var(--p)"></div></div></div>${closed ? '' : `<div class="plist">${rows}</div>`}</div>`;
  }).join('');
  return `<h1>Тематический план</h1><div class="sub">4-А · Математика · 1 полугодие</div><div class="col">${mods}</div>`;
}

// Lesson materials tab: content of lesson 22 as it is in the course (passport, links, stages, tracks).
const LESSON_PASSPORT = {
  goal: 'Научить находить произведение многозначного числа на однозначное сложением неполных произведений, объяснить, почему множитель можно разложить на разрядные слагаемые и почему ответ при этом не меняется.',
  standards: [['4-1.2.2.', 'Выполняет умножение многозначного числа на однозначное, двузначное и трёхзначное число.'], ['4-1.2.5.', 'Использует свойства арифметических действий в вычислениях.']],
  links: ['Презентация', 'Методические указания', 'Рекомендации по назначению треков', 'Без планшетов. Презентация', 'Без планшетов. Методичка'],
  stages: [['Разминка', '3 задания'], ['Решаем вместе', '7 заданий'], ['Практика', '7 заданий · треки A/B/C'], ['Рефлексия', '2 задания'], ['Домашнее задание', '5 заданий', 'ДЗ']],
};
const DOC_IC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
function tMaterials(P = LESSON_PASSPORT, past = false) {
  return `<div class="card mat"><div class="label-up" style="margin-top:0">Паспорт урока</div>
    <p><b>Методическая установка:</b> ${P.goal}</p>
    ${P.standards ? `<p style="margin-top:12px"><b>Содержательные стандарты:</b></p>${P.standards.map(([c, t]) => `<p class="std"><b>${c}</b> ${t}</p>`).join('')}` : ''}
    ${past ? '' : '<p style="margin-top:12px"><b>Назначайте треки по рекомендациям из материалов урока.</b></p>'}</div>
  <div class="card mat"><div class="label-up" style="margin-top:0">Материалы урока</div><div class="links">${P.links.map(l => `<button class="doc" data-action="openDoc">${DOC_IC}<span>${l}</span></button>`).join('')}</div></div>
  <div class="card mat"><div class="label-up" style="margin-top:0">${past ? 'Задания урока' : 'Предпросмотр заданий'}</div><div class="plist">${P.stages.map(([n, c, tag], k) => `<div class="prow"><span class="pno">${k + 1}</span><div style="flex:1"><b>${n}</b>${tag ? ` <span class="tag lav">${tag}</span>` : ''}<div class="muted xs">${c}</div></div><button class="btn sm grey" data-action="openDoc">Просмотреть</button></div>`).join('')}</div></div>
  ${past ? '' : `<div class="card mat"><div class="label-up" style="margin-top:0">Треки</div><p class="muted">По умолчанию для урока сохраняются треки, назначенные на прошлом уроке. Если считаете, что кому-то из учеников нужен другой трек — переназначьте перед началом.</p>
    <div class="row" style="margin-top:12px;gap:8px"><span class="trk-chip">A · 10</span><span class="trk-chip">B · 0</span><span class="trk-chip">C · 0</span><button class="btn sm lav" style="margin-left:auto" data-action="openDoc">Назначить треки</button></div></div>`}`;
}

// Past lessons: opened from the thematic plan — materials, analytics, photo works, homework.
const LINKS_STD = ['Презентация', 'Методические указания', 'Без планшетов. Презентация', 'Без планшетов. Методичка'];
const STAGES_STD = n => [['Разминка', '3 задания'], ['Решаем вместе', `${Math.max(2, n - 9)} задания`], ['Практика', '6 заданий · треки A/B/C'], ['Рефлексия', '2 задания'], ['Домашнее задание', '5 заданий', 'ДЗ']];
const PAST = {
  17: { topic: 'составные задачи на сложение и вычитание', goal: 'Обобщить приёмы сложения и вычитания многозначных чисел: выбрать порядок действий в составной задаче и проверить ответ обратным действием.',
    hard: [['Практика · №4', '8 004 − 2 567', 'вычитание с переходом через несколько разрядов: 5 547 вместо 5 437'], ['Практика · №6', 'Задача о библиотеке', 'забыли вычесть выданные книги']],
    hint: 'Ошибки при вычитании с нулями в уменьшаемом',
    photo: { title: 'Задача о библиотеке', criteria: ['Учтены и привезённые, и выданные книги', 'Вычисления выполнены без ошибок', 'Получен ответ — 2 870 книг', 'Записан ответ с наименованием'],
      works: [[1, ['2 450 + 1 380 = 3 830', '3 830 − 960 = 2 870', 'Ответ: 2 870 книг.'], [1, 1, 1, 1]], [4, ['2 450 + 1 380 = 3 830', '3 830 − 960 = 2 970', 'Ответ: 2 970'], [1, 0, 0, 0]],
        [7, ['2 450 − 960 = 1 490', '1 490 + 1 380 = 2 870', 'Ответ: 2 870 книг.'], [1, 1, 1, 1]], [3, ['2 450 + 1 380 = 3 830', 'Ответ: 3 830 книг.'], [0, 1, 0, 1]]] } },
  18: { topic: 'сложение и вычитание многозначных чисел', mso: true, goal: 'Мониторинговая работа по модулю «Сложение и вычитание»: проверить, как ученики складывают и вычитают многозначные числа и решают составные задачи. Подсказки, помощник и бонус на МСО не работают.',
    stages: [['Мониторинговая работа', '16 заданий · без подсказок'], ['Задача с развёрнутым решением', 'фото из тетради']],
    hard: [['№9', '10 000 − 3 458', 'вычитание из круглого числа: 7 652 вместо 6 542'], ['№14', 'Задача про яблоки', 'нашли только второй день, без суммы']],
    photo: { title: 'Задача про яблоки', criteria: ['Найдено, сколько собрали во второй день — 1 625 кг', 'Найдено, сколько собрали за два дня', 'Вычисления выполнены без ошибок', 'Записан ответ с наименованием'],
      works: [[0, ['1 245 + 380 = 1 625 (кг)', '1 245 + 1 625 = 2 870 (кг)', 'Ответ: 2 870 кг.'], [1, 1, 1, 1]], [8, ['1 245 + 380 = 1 625', 'Ответ: 1 625 кг.'], [1, 0, 1, 1]],
        [5, ['1 245 − 380 = 865', '1 245 + 865 = 2 110', 'Ответ: 2 110 кг.'], [0, 1, 1, 1]], [9, ['1 245 + 380 = 1 625', '1 625 + 1 245 = 2 860'], [1, 1, 0, 0]]] } },
  19: { topic: 'вычитание с переходом через разряд', goal: 'Разобрать типичные ошибки МСО-1: вычитание из круглых чисел и составные задачи. Каждый ученик дорешивает свои ошибки.',
    hard: [['Практика · №3', '7 000 − 2 816', 'заём из разряда с нулём: 5 284 вместо 4 184'], ['Практика · №5', 'Задача про яблоки', 'путают «на … больше» и «в … раз больше»']],
    hint: 'Заём через несколько нулей',
    photo: { title: 'Задача про яблоки — исправление', criteria: ['Найдено, сколько собрали во второй день — 1 625 кг', 'Найдено, сколько собрали за два дня', 'Вычисления выполнены без ошибок', 'Записан ответ с наименованием'],
      works: [[8, ['1 245 + 380 = 1 625 (кг)', '1 245 + 1 625 = 2 870 (кг)', 'Ответ: 2 870 кг.'], [1, 1, 1, 1]], [5, ['1 245 + 380 = 1 625 (кг)', '1 625 + 1 245 = 2 870 (кг)', 'Ответ: 2 870 кг.'], [1, 1, 1, 1]],
        [9, ['1 245 + 380 = 1 625', '1 625 + 1 245 = 2 860', 'Ответ: 2 860 кг.'], [1, 1, 0, 1]]] } },
  20: { topic: 'табличное умножение и круглые числа', goal: 'Повторить таблицу умножения и умножение круглых чисел перед модулем «Умножение и деление».',
    hard: [['Разминка · №2', '7 · 8', '54 вместо 56'], ['Практика · №5', '400 · 6', 'потерян ноль: 240']],
    hint: 'Путаница в табличном умножении на 7 и 8',
    photo: { title: 'Ручки и тетради', criteria: ['Найдена стоимость ручек — 8 ман.', 'Найдена стоимость тетрадей — 3 ман.', 'Найдена общая стоимость — 11 ман.', 'Записан ответ с наименованием'],
      works: [[2, ['2 · 4 = 8 (ман.)', '1 · 3 = 3 (ман.)', '8 + 3 = 11 (ман.)', 'Ответ: 11 манатов.'], [1, 1, 1, 1]], [6, ['2 · 4 = 8', '8 + 3 = 11'], [1, 0, 1, 0]],
        [1, ['2 + 4 = 6', '6 + 3 = 9', 'Ответ: 9 ман.'], [0, 1, 0, 1]]] } },
  21: { topic: 'неполные произведения при умножении', goal: 'Ввести приём умножения четырёхзначного числа на однозначное: разложить множитель на разрядные слагаемые, найти неполные произведения и сложить их.', standards: LESSON_PASSPORT.standards,
    hard: [['Практика · №4', '3 241 · 2 = ?', 'потеряно неполное произведение 40 · 2'], ['Практика · №6', '1 221 · 4 = ?', 'разряды сложены со сдвигом: 4 884 → 4 844']],
    hint: 'Ошибки в неполных произведениях',
    photo: { title: 'Фабрика коробок', criteria: ['Множитель разложен на разрядные слагаемые', 'Найдены все неполные произведения', 'Неполные произведения сложены верно', 'Ответ — 3 639 коробок'],
      works: [[0, ['1 213 · 3 = (1 000 + 200 + 10 + 3) · 3', '3 000 + 600 + 30 + 9 = 3 639', 'Ответ: 3 639 коробок.'], [1, 1, 1, 1]], [3, ['1 213 · 3 = (1 000 + 200 + 13) · 3', '3 000 + 600 + 39 = 3 639', 'Ответ: 3 639'], [0, 1, 1, 1]],
        [9, ['1 000 · 3 = 3 000', '200 · 3 = 600', '3 000 + 600 = 3 600', 'Ответ: 3 600'], [1, 0, 0, 0]], [7, ['(1 000 + 200 + 10 + 3) · 3 =', '= 3 000 + 600 + 30 + 9 = 3 639', 'Ответ: 3 639 коробок.'], [1, 1, 1, 1]]] } },
};
// Deterministic pseudo-random in [0, 1): the same lesson always shows the same numbers.
const hash = (...a) => { let x = 2166136261; for (const v of a) x = Math.imul(x ^ v, 16777619) >>> 0; x ^= x >>> 13; x = Math.imul(x, 2246822507) >>> 0; x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const planLesson = no => PLAN.flatMap(m => m.lessons).find(l => l[0] === no);
function pastStats(no) {
  const [, , , target] = planLesson(no); const mso = PAST[no].mso; const total = MAP.flatMap(m => m.lessons).find(l => l[0] === no)[3];
  const rows = STUDENTS.map((n, i) => {
    const r = Math.max(0.15, Math.min(1, target / 100 + (hash(no, i, 1) - 0.5) * 0.7));
    const solved = Math.round(total * r);
    const first = Math.max(0, solved - Math.round(hash(no, i, 2) * 3));
    const helper = mso ? 0 : Math.round(hash(no, i, 3) * 2.4);
    // Bonus is extra: it is not part of the lesson solvability; students who did not open it have no data.
    const bonus = !mso && r >= 0.6 && hash(no, i, 6) < 0.85 ? { total: 3, ok: Math.round(3 * (0.35 + hash(no, i, 10) * 0.65)) } : null;
    const st = r >= 0.8 ? ['ok', 'освоил'] : r >= 0.5 ? ['mid', 'частично'] : ['bad', 'нужна помощь'];
    return { i, solved, first, helper, bonus, st, pct: Math.round(solved / total * 100) };
  });
  const avg = Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length);
  const bo = rows.filter(r => r.bonus);
  const bonusPct = bo.length ? Math.round(bo.reduce((a, r) => a + r.bonus.ok, 0) / bo.reduce((a, r) => a + r.bonus.total, 0) * 100) : null;
  return { rows, avg, total, mso, bonusOpened: bo.length, bonusPct };
}

function tPast() {
  const no = S.past, [, title, date] = planLesson(no), P = PAST[no];
  const tabs = [['mat', 'Материалы'], ['an', 'Аналитика'], ['photo', 'Фото'], ['hw', 'Домашка']].map(([t, l]) => `<button class="${S.pastTab === t ? 'on' : ''}" data-action="pastTab" data-t="${t}">${l}</button>`).join('');
  const body = { mat: () => tMaterials({ goal: P.goal, standards: P.standards, links: P.mso ? ['Мониторинговая работа', 'Ключ и критерии'] : LINKS_STD, stages: P.stages || STAGES_STD(pastStats(no).total) }, true), an: pastAnalytics, photo: pastPhoto, hw: pastHw }[S.pastTab](no);
  return `<button class="link-back" data-action="nav" data-p="plan">‹ Тематический план</button><h1>Урок ${no} · ${title}</h1><div class="sub">${date} · 4-А · <span class="tag ok">Проведён</span></div>
    <div class="seg-tabs">${tabs}</div>${body}`;
}
function pastAnalytics(no) {
  const st = pastStats(no), P = PAST[no];
  const help = st.rows.filter(r => r.st[0] === 'bad');
  const stages = st.mso ? [['Мониторинговая работа', st.avg]] : [['Разминка', Math.min(97, st.avg + 13)], ['Решаем вместе', Math.max(30, st.avg - 6)], ['Практика', st.avg]];
  const kpi3 = st.mso ? [st.rows.filter(r => r.st[0] === 'ok').length, 'учеников освоили модуль'] : [st.rows.filter(r => r.helper).length, 'решали с ✦ ИИ-помощником'];
  const head = `<tr><th>Ученик</th><th>Решено</th><th>С первой попытки</th>${st.mso ? '' : '<th>✦ Помощник</th><th>Бонус</th><th>Решаемость бонуса</th>'}<th>Итог</th></tr>`;
  const rows = st.rows.map(r => `<tr><td><span class="row" style="gap:8px"><span class="ava xs">${initials(STUDENTS[r.i])}</span>${STUDENTS[r.i]}</span></td><td><b>${r.solved}</b><span class="muted"> / ${st.total}</span></td><td>${r.first}</td>${st.mso ? '' : `<td>${r.helper ? `${r.helper} зад.` : '<span class="muted">—</span>'}</td><td>${r.bonus ? `${r.bonus.ok} из ${r.bonus.total}` : ''}</td><td>${r.bonus ? `<b class="${pctTone(r.bonus.ok / r.bonus.total * 100)}">${Math.round(r.bonus.ok / r.bonus.total * 100)}%</b>` : ''}</td>`}<td><span class="tag ${r.st[0]}">${r.st[1]}</span></td></tr>`).join('');
  return `<div class="grid3">
    <div class="card kpi"><span class="kpi-ic">%</span><b>${st.avg}%</b><span class="muted">решаемость урока</span></div>
    ${st.mso ? '<div class="card kpi"><span class="kpi-ic">✓</span><b>10 <small>/ 10</small></b><span class="muted">сдали работу</span></div>'
      : `<div class="card kpi"><span class="kpi-ic">★</span><b>${st.bonusPct}%</b><span class="muted">решаемость бонуса · открыли ${st.bonusOpened} из 10 · в решаемость урока не входит</span></div>`}
    <div class="card kpi"><span class="kpi-ic">${st.mso ? '★' : '✦'}</span><b>${kpi3[0]}</b><span class="muted">${kpi3[1]}</span></div></div>
  <div class="grid2" style="margin-top:14px">
    <div class="card"><h3>Решаемость по этапам</h3>${stages.map(([n, v]) => `<div class="stage-bar"><span>${n}</span><div class="bar"><div style="width:${v}%;background:var(--p)"></div></div><b>${v}%</b></div>`).join('')}
      <div class="label-up">Трудные задания</div>${P.hard.map(([w, t, e]) => `<div class="li col-li"><b>${w} · ${t}</b><span class="muted" style="font-size:12.5px">${e}</span></div>`).join('')}</div>
    <div class="card"><h3>Кто не справился · ${help.length}</h3>${help.length ? help.map(r => `<div class="li"><span class="ava xs">${initials(STUDENTS[r.i])}</span><span>${STUDENTS[r.i]}</span><span class="tag bad" style="margin-left:auto">${r.solved} из ${st.total}</span></div>`).join('') : '<p class="muted" style="margin-top:8px">Все справились</p>'}
      ${P.hint ? `<div class="label-up">✦ ИИ-подсказка на уроке</div><div class="li col-li"><b>${P.hint}</b><span class="muted" style="font-size:12.5px">показана во «Решаем вместе» · вы оценили 👍</span></div>` : ''}</div></div>
  <div class="card" style="margin-top:14px"><h3>Ученики</h3><table class="ptable">${head}${rows}</table></div>`;
}
function pastPhoto(no) {
  const ph = PAST[no].photo, sent = ph.works.map(w => w[0]);
  const status = s => s === 4 ? ['ok', 'Выполнено'] : s >= 2 ? ['mid', 'Частично'] : ['bad', 'Не выполнено'];
  const cards = ph.works.map(([i, lines, marks]) => {
    const sc = marks.filter(Boolean).length, [c, l] = status(sc);
    return `<div class="card"><div class="row between"><span class="row" style="gap:8px"><span class="ava xs">${initials(STUDENTS[i])}</span><b>${STUDENTS[i]}</b></span><span class="tag ${c}">${sc}/4 · ${l}</span></div>
      <div class="notebook">${lines.join('<br>')}</div>${ph.criteria.map((t, k) => `<div class="pcrit"><i class="${marks[k] ? 'g' : 'r'}">${marks[k] ? '✓' : '✕'}</i><span>${t}</span></div>`).join('')}</div>`;
  }).join('');
  const missing = STUDENTS.filter((_, i) => !sent.includes(i));
  return `<div class="card row between" style="margin-bottom:14px"><div><h3>Задача «${ph.title}»</h3><p class="muted">Прислали ${sent.length} из 10 · все работы проверены · <span class="new sm">✦ ИИ</span> отметил чеклист заранее, учитель подтвердил</p></div><button class="btn lav sm" data-action="openDoc">👁 Задание</button></div>
    <div class="works">${cards}</div>
    <p class="muted" style="margin-top:14px">Не прислали фото: ${missing.join(', ')}</p>`;
}
function pastHw(no) {
  const st = pastStats(no);
  const rows = st.rows.map(r => {
    const errs = Math.min(2, st.total - r.first), weak = r.st[0] === 'ok' ? 0 : r.st[0] === 'mid' ? 1 : 2, hard = r.st[0] === 'ok' ? 2 : 1;
    const kinds = [['err', errs], ['skill', weak], ['hard', hard], ['keep', Math.max(0, 5 - errs - weak - hard)]].filter(([, n]) => n);
    const doneHw = hash(no, r.i, 4) > 0.15, right = doneHw ? Math.max(2, Math.round(5 * (0.45 + hash(no, r.i, 5) * 0.55))) : 0;
    return `<div class="hw-row"><div class="row between"><span class="row" style="gap:8px"><span class="ava xs">${initials(STUDENTS[r.i])}</span><b>${STUDENTS[r.i]}</b></span>
      ${doneHw ? `<span class="row" style="gap:8px"><span class="muted">верно ${right} из 5</span><span class="tag ok">Сдано</span></span>` : '<span class="tag bad">Не сдано</span>'}</div>
      <div class="row wrap" style="gap:6px;margin-top:6px">${kinds.map(([k, n]) => `<span class="tag ${HW_LABEL[k][0]}">${HW_LABEL[k][1]}${n > 1 ? ` · ${n}` : ''}</span>`).join('')}</div></div>`;
  });
  const done = st.rows.filter(r => hash(no, r.i, 4) > 0.15).length;
  return `<div class="card"><div class="row between"><div><h3>Персональная домашка</h3><p class="muted" style="margin-top:4px">Собрана ИИ после урока и подтверждена учителем · сдали ${done} из 10</p></div><span class="new">✦ новое</span></div>
    <div class="hw-list">${rows.join('')}</div></div>`;
}

// Stage timer: the current stage counts down from its planned time, overtime shows as +mm:ss.
const STAGE_PLAN = [5, 12, 10, 4, 0].map(m => m * 60000);
const mmss = ms => { const t = Math.round(Math.abs(ms) / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
function stageTime(k) {
  const L = S.lesson;
  if (k !== L.stage) return L.spent[k] ? mmss(L.spent[k]) : STAGE_PLAN[k] ? mmss(STAGE_PLAN[k]) : '';
  const left = STAGE_PLAN[k] - (Date.now() - (L.stageT0 || Date.now()));
  return STAGE_PLAN[k] ? (left >= 0 ? mmss(left) : `+${mmss(left)}`) : mmss(Date.now() - L.stageT0);
}
setInterval(() => { const el = document.querySelector('[data-timer]'); if (el && inLesson()) { el.textContent = stageTime(S.lesson.stage); el.classList.toggle('over', el.textContent[0] === '+'); } }, 1000);
function tLive() {
  const L = S.lesson;
  if (L.ended) return `<div class="pad">${tEnd()}</div>`;
  if (!L.started) return `<button class="link-back" data-action="nav" data-p="plan">‹ Тематический план</button><h1>Подготовка к уроку</h1><div class="sub">Просмотрите материалы заранее и начните урок, когда класс готов</div>
    <div class="card row between"><div><div class="label-up" style="margin:0 0 4px">Сегодня · 4-А</div><h2>Умножение четырёхзначного числа на однозначное число (ч.2)</h2><span class="chip-l">Модуль · Умножение и деление</span></div><button class="btn" data-action="startLesson">▶ Начать урок</button></div>
    <div class="seg-tabs"><span class="on">Материалы</span><span>Аналитика</span><span class="off">Фото</span><span class="off">Домашка</span></div>
    ${tMaterials()}`;
  const stepper = STAGES.map((s, k) => k === L.stage
    ? `<button class="step on" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}<em data-timer>${stageTime(k)}</em></button>`
    : `<button class="step" data-action="stage" data-s="${k}"><i>${k + 1}</i>${s}${stageTime(k) ? `<span class="t">${stageTime(k)}</span>` : ''}</button>`).join('');
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
  const hint = bad >= 3 || a[S.me] === 'bad' ? `<div class="hint"><div class="row between"><b>✦ ${t.hintTitle}</b><span class="red-t">${bad} из ${n}</span></div>
    <p>${t.hint}</p><div class="row between" style="margin-top:10px"><span class="muted">Пример: <span class="pill-l">${STUDENTS[+ex[0]]} ›</span></span>
    <span class="row" style="gap:8px"><button data-action="hintVote" data-v="up" class="thumb ${vote === 'up' ? 'on' : ''}">👍</button><button data-action="hintVote" data-v="down" class="thumb ${vote === 'down' ? 'on' : ''}">👎</button></span></div></div>` : '';
  const res = `<div class="label-up">Как ответил класс</div><div class="row" style="gap:14px"><span>Верно: <b class="g">${ok}</b></span><span>Неверно: <b class="r">${bad}</b></span><div class="bar" style="flex:1"><div style="width:${n ? ok / n * 100 : 0}%;background:#7ACB8B"></div></div><b class="g">${n ? Math.round(ok / n * 100) : 0}%</b></div>
    ${bad === 0 && n ? '<div class="okbar">✓ Все ответили верно — можно двигаться дальше</div>' : ''}`;
  return `<div class="card mid-card"><div class="row between"><h3>${STAGES[L.stage]}</h3><button class="btn lav sm">👁 Посмотреть задание</button></div><div class="tabs">${tabs}</div><h2 style="margin:4px 0 14px">${t.text}</h2>
    ${L.revealed ? res : `<div class="answered"><b>${n}<small>/10</small></b><div class="muted">ответили · ждём остальных</div><button class="btn" style="margin-top:14px" data-action="reveal" ${n ? '' : 'disabled'}>Показать решение ученикам</button><div class="link">Показать отстающих · ${10 - n}</div></div>`}
    ${hint}${L.revealed ? `<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-action="nextTask">Дальше ›</button></div>` : ''}</div>`;
}

// Bonus cell: correct of answered bonus tasks; empty until the student opens the bonus.
function bonusCell(i) { const b = S.bonus[i]; if (!b.seen) return ''; return b.done.length ? `${b.done.filter(Boolean).length}/${b.done.length}` : '•••'; }
function bonusPctLive() { const d = S.bonus.flatMap(b => b.seen ? b.done : []); return d.length ? Math.round(d.filter(Boolean).length / d.length * 100) : null; }
function tPractice() {
  if (!S.lesson.stageStarted) return `<div class="card mid-card row between"><div><h3>Практика · самостоятельная работа</h3><p class="muted">Ученики решают задания на планшетах по трекам. После старта карта класса заполняется в реальном времени: кто решил, кто ошибается, кто поднял руку.</p></div><button class="btn" data-action="stageStart">▶ Старт</button></div>`;
  const legend = [['#DDF6D5', 'решено'], ['#FBEBB8', 'частично'], ['#E4E6F8', 'принято'], ['#FBDCD6', 'ошибается'], ['#EEF0FA', 'на проверке'], ['#FFF4D9', 'решает'], ['#F1F0F6', 'не дошёл']].map(([c, l]) => `<span class="lg"><i style="background:${c}"></i>${l}</span>`).join('');
  const head = `<tr><th class="th-name">Ученик</th>${PRACTICE.map((_, k) => `<th>${k + 1}</th>`).join('')}<th>Бонус</th><th>✓</th></tr>`;
  const rows = STUDENTS.map((n, i) => `<tr><td class="name"><span class="trk">A</span>${n}${S.hands.includes(i) ? ' <span class="hand">✋</span>' : ''}</td>${S.practice[i].map(c => {
    const cls = { ok: 'c-ok', bad: 'c-bad', solving: 'c-solving', none: '' }[c.st];
    const label = c.st === 'ok' ? c.attempts : c.st === 'bad' ? (c.attempts >= 2 ? '✕' : c.attempts) : c.st === 'solving' ? '•••' : '';
    return `<td class="${cls}">${label}${c.helper ? '<span class="helper-dot">✦</span>' : ''}</td>`;
  }).join('')}<td class="${S.bonus[i].seen ? 'c-bonus' : ''}">${bonusCell(i)}</td><td class="muted">${solvedCount(i)}/7</td></tr>`).join('');
  const reached = STUDENTS.map((n, i) => [n, i]).filter(([, i]) => S.bonus[i].open), opened = reached.filter(([, i]) => S.bonus[i].seen);
  return `<div class="grid2" style="grid-template-columns:1fr 270px">
    <div class="card"><div class="row between wrap" style="gap:8px"><h3>Live-карта класса</h3><div class="legend-row">${legend}</div></div>
      <div class="muted" style="font-size:12px;margin:6px 0 2px"><span class="new sm">✦ новое</span> ✦ в ячейке — решал с ИИ-помощником · Бонус — верно из решённых бонусных (в решаемость урока не входит)</div>
      <table class="map">${head}${rows}</table></div>
    <div class="col"><div class="card"><h3>✋ Подняли руку · ${S.hands.length}</h3><p class="muted" style="font-size:12px">по времени ожидания · закрываете вы</p>${S.hands.length ? S.hands.map(i => `<div class="queue-item"><span>${STUDENTS[i]}</span><button class="okbtn" data-action="cameOver" data-i="${i}">✓ Подошёл</button></div>`).join('') : '<p class="muted center" style="margin-top:12px">Очередь пуста</p>'}</div>
      <div class="card"><div class="row between"><h3>⭐ Бонус</h3><span class="new sm">✦</span></div><p class="muted" style="font-size:12px;margin-top:4px;line-height:1.45">Открывается каждому, кто закончил практику: 70%+ с первой попытки — посложнее, остальным — похожие на те, где ошибся.</p>
      <p style="margin-top:8px">Открыли: <b>${opened.length} из 10</b>${bonusPctLive() != null ? ` · решаемость <b>${bonusPctLive()}%</b>` : ''}</p>${reached.map(([n, i]) => `<div class="row between" style="margin-top:5px;gap:6px"><span>${n}</span><span class="row" style="gap:6px">${S.bonus[i].done.length ? `<b class="xs">${bonusCell(i)}</b>` : ''}<span class="tag ${strong(i) ? 'ok' : 'mid'}">${strong(i) ? 'посложнее' : 'по ошибкам'}</span></span></div>`).join('')}</div></div></div>`;
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

// My class: main metrics per student (as in platform analytics); skills go to a separate tab later.
const PAST_NOS = [17, 18, 19, 20, 21];
const avgOf = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const pctTone = v => v >= 80 ? 'g' : v >= 60 ? 'a' : 'r';
function classMetrics(i) {
  const ended = S.lesson.ended;
  const byLesson = PAST_NOS.map(no => [no, pastStats(no).rows[i].pct, pastStats(no).total - pastStats(no).rows[i].solved]);
  if (ended) byLesson.push([22, Math.round(lessonSolved(i) / LESSON_TASKS * 100), PRACTICE.length - solvedCount(i)]);
  const pcts = byLesson.map(l => l[1]);
  const lesson = avgOf(pcts);
  const missed = (hash(i, 7) < 0.3 ? 1 : 0) + (hash(i, 8) < 0.12 ? 1 : 0);
  const attend = Math.round((byLesson.length - missed) / byLesson.length * 100);
  const redo = byLesson.reduce((x, l) => x + l[2], 0);
  const hw = Math.max(30, Math.min(100, Math.round(lesson + (hash(i, 9) - 0.5) * 24)));
  const overall = Math.round((lesson + hw) / 2);
  const trend = avgOf(pcts.slice(3)) - avgOf(pcts.slice(0, 3));
  return { byLesson, lesson, attend, missed, redo, hw, overall, trend };
}
const delta = v => v ? `<span class="dchip ${v > 0 ? 'up' : 'down'}">${v > 0 ? '↑' : '↓'} ${Math.abs(v)} п.п.</span>` : '<span class="dchip">без изменений</span>';
const MT_IC = { lesson: '◎', attend: '✓', redo: '↺', overall: '♙' };
const mtile = (ic, label, val, foot) => `<div class="card mtile"><div class="mt-l"><span>${ic}</span>${label}</div><b>${val}</b>${foot}</div>`;
function classSummary(M) {
  const by = no => avgOf(STUDENTS.map((_, i) => pastStats(no).rows[i].pct));
  const low = PAST_NOS.reduce((a, no) => by(no) < by(a) ? no : a, PAST_NOS[0]);
  const weak = M.map((m, i) => [i, m]).filter(([, m]) => m.overall < 60);
  const absent = M.map((m, i) => [i, m]).filter(([, m]) => m.missed);
  const top = M.map((m, i) => [i, m]).sort((a, b) => b[1].redo - a[1].redo)[0];
  const lessonAvg = avgOf(M.map(m => m.lesson)), tr = avgOf(M.map(m => m.trend));
  return [`Решаемость класса на уроках — ${lessonAvg}%, за последние уроки ${tr > 0 ? `выросла на ${tr} п. п` : tr < 0 ? `снизилась на ${-tr} п. п` : 'не изменилась'}`,
    weak.length ? `Общая успешность ниже 60% у ${weak.length} учеников: ${weak.map(([i]) => STUDENTS[i]).join(', ')} — им стоит дать задания на дорешивание и подойти на практике первыми` : 'У всех учеников общая успешность выше 60%',
    `Самый трудный урок для класса — ${low} «${planLesson(low)[1]}» (${by(low)}%); больше всего заданий к дорешиванию — ${STUDENTS[top[0]]} (${top[1].redo})`,
    absent.length ? `Пропускали уроки: ${absent.map(([i, m]) => `${STUDENTS[i]} (${m.missed})`).join(', ')}` : ''].filter(Boolean).join('. ') + '.';
}
function tClass() {
  const tabs = `<div class="seg-tabs"><button class="${S.classTab === 'main' ? 'on' : ''}" data-action="classTab" data-t="main">Мой класс</button><button class="${S.classTab === 'skills' ? 'on' : ''}" data-action="classTab" data-t="skills">Навыки</button></div>`;
  if (S.classTab === 'skills') return `<h1>Мой класс · 4-А</h1><div class="sub">Математика · 4 класс</div>${tabs}
    <div class="card center" style="padding:40px 24px"><h3>Навыки класса</h3><p class="muted" style="margin-top:8px;line-height:1.5">Раздел в проектировании: навыки учеников будут разложены по графу знаний.</p></div>`;
  const M = STUDENTS.map((_, i) => classMetrics(i));
  if (S.classStudent !== null) return tStudentCard(S.classStudent, M[S.classStudent]);
  const avg = k => avgOf(M.map(m => m[k]));
  const rows = M.map((m, i) => `<button class="srow" data-action="classStudent" data-i="${i}"><span class="row" style="gap:10px"><span class="ava xs">${initials(STUDENTS[i])}</span><b>${STUDENTS[i]}</b></span>
    <span class="${pctTone(m.lesson)}">${m.lesson}%</span><span class="${pctTone(m.attend)}">${m.attend}%</span><span>${m.redo || '—'}</span><span class="${pctTone(m.overall)}">${m.overall}%</span><span class="go">›</span></button>`).join('');
  return `<h1>Мой класс · 4-А</h1><div class="sub">Математика · 4 класс · ${STUDENTS.length} учеников · уроки 17–${S.lesson.ended ? 22 : 21}</div>${tabs}
    <div class="ai-sum"><div class="row" style="gap:8px"><span class="spark">✦</span><b>ИИ-сводка по классу</b><span class="new sm">✦ новое</span></div><p>${classSummary(M)}</p></div>
    <div class="grid4">
      ${mtile(MT_IC.lesson, 'Решаемость на уроке', `${avg('lesson')}%`, delta(avg('trend')))}
      ${mtile(MT_IC.attend, 'Посещаемость', `${avg('attend')}%`, `<span class="muted xs">пропусков: ${M.reduce((x, m) => x + m.missed, 0)}</span>`)}
      ${mtile(MT_IC.redo, 'К дорешиванию', M.reduce((x, m) => x + m.redo, 0), `<span class="muted xs">заданий у ${M.filter(m => m.redo).length} учеников</span>`)}
      ${mtile(MT_IC.overall, 'Общая успешность', `${avg('overall')}%`, '<span class="muted xs">уроки и домашние задания</span>')}</div>
    <div class="card" style="margin-top:14px"><div class="srow head"><span>Ученик</span><span>На уроке</span><span>Посещаемость</span><span>К дорешиванию</span><span>Общая успешность</span><span></span></div>${rows}</div>`;
}
function tStudentCard(i, m) {
  const bars = m.byLesson.map(([no, pct, left]) => `<div class="lbar"><span><b>Урок ${no}</b> · ${planLesson(no)[1]}</span><div class="bar"><div style="width:${pct}%;background:var(--${pctTone(pct)}c)"></div></div><b class="${pctTone(pct)}">${pct}%</b></div>`).join('');
  const redo = m.byLesson.filter(l => l[2]).map(([no, , left]) => `<div class="li"><span class="pno">${no}</span><span>${planLesson(no)[1]}</span><span class="tag mid" style="margin-left:auto">${left} заданий</span></div>`).join('');
  return `<button class="link-back" data-action="classStudent" data-i="">‹ Мой класс</button>
    <div class="card row" style="gap:14px"><span class="ava lg">${initials(STUDENTS[i])}</span><div><h2>${STUDENTS[i]}</h2><div class="muted">4-А · ${m.lesson}% на уроках · ${m.hw}% дома</div></div></div>
    <div class="grid4" style="margin-top:14px">
      ${mtile(MT_IC.lesson, 'Решаемость на уроке', `<span class="${pctTone(m.lesson)}">${m.lesson}%</span>`, delta(m.trend))}
      ${mtile(MT_IC.attend, 'Посещаемость', `<span class="${pctTone(m.attend)}">${m.attend}%</span>`, `<span class="muted xs">${m.missed ? `пропущено уроков: ${m.missed}` : 'без пропусков'}</span>`)}
      ${mtile(MT_IC.redo, 'К дорешиванию', m.redo, '<span class="muted xs">заданий в карте знаний</span>')}
      ${mtile(MT_IC.overall, 'Общая успешность', `<span class="${pctTone(m.overall)}">${m.overall}%</span>`, `<span class="muted xs">ДЗ — ${m.hw}%</span>`)}</div>
    <div class="grid2" style="margin-top:14px;grid-template-columns:1.4fr 1fr">
      <div class="card"><h3>Решаемость по урокам</h3><p class="muted" style="margin-top:4px">Доля верно решённых заданий на каждом проведённом уроке</p>${bars}</div>
      <div class="card"><h3>Доступно к дорешиванию</h3><p class="muted" style="margin-top:4px">Ученик дорешивает их в карте знаний</p>${redo || '<p class="muted" style="margin-top:10px">Всё решено</p>'}</div></div>`;
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
    <div class="ai-concl"><div class="row" style="gap:6px"><span class="spark">✦</span><b>Заключение ИИ</b></div><p>${checkConclusion(m)}</p></div>
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

// ---------- Student input: answers typed into the boxes on the tablet ----------
const norm = v => String(v ?? '').replace(/\s/g, '');
const esc = v => String(v ?? '').replace(/[&"<>]/g, ch => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[ch]));
const PRACTICE_CELLS = p => [...p.parts.map((x, k) => [0, k, x]), ...p.prods.map((x, k) => [1, k, x]), [2, 0, p.ans]];
const filled = ids => ids.every(id => norm(S.inp[id]));
Object.assign(A, {
  sSubmit(el) {
    const i = S.me, kind = el.dataset.kind;
    if (kind === 'frontal') {
      const id = `f${i}-${key()}`; if (!filled([id])) return toast('Впиши ответ в окошко');
      answers()[i] = norm(S.inp[id]) === norm(frontalTask().right) ? 'ok' : 'bad'; return;
    }
    if (kind === 'practice') {
      const t = S.cur[i], p = PRACTICE[t], c = S.practice[i][t]; if (!c) return;
      const pre = `p${i}-${t}-a${c.attempts}`; const cells = PRACTICE_CELLS(p);
      if (!filled(cells.map(([g, k]) => `${pre}-${g}-${k}`))) return toast('Заполни все окошки');
      S.inp[`${pre}-sub`] = 1;
      practiceAnswer(i, cells.every(([g, k, x]) => norm(S.inp[`${pre}-${g}-${k}`]) === String(x))); return;
    }
    if (kind === 'bonus') {
      const k = S.bonus[i].done.length, t = bonusTasks(i)[k], id = `b${i}-${k}`;
      if (!filled([id])) return toast('Впиши ответ в окошко');
      S.bonus[i].done.push(norm(S.inp[id]) === String(t.ans)); return;
    }
    if (kind === 'hw') {
      const d = S.hwDone[i], t = hwTask(S.hw.plans[i][d], d), id = `h${i}-${d}`;
      if (!filled([id])) return toast('Впиши ответ в окошко');
      if (norm(S.inp[id]) === String(t.ans)) S.hwDone[i]++; else toast('Пока неверно — проверь вычисления');
    }
  },
  sHelperCheck() {
    const i = S.me, h = S.helper[i], p = PRACTICE[h.task];
    const cells = PRACTICE_CELLS(p).filter(([g]) => g === h.step);
    const ids = cells.map(([g, k]) => `p${i}-${h.task}-h-${g}-${k}`);
    if (!filled(ids)) return toast('Заполни подсвеченные окошки');
    if (cells.every(([, , x], n) => norm(S.inp[ids[n]]) === String(x))) A.sHelperStep();
    else toast('Пока не так — посмотри на подсказку ✦');
  },
});

// ---------- Render: student tablet (floating window over the teacher app) ----------
function student() {
  const i = S.me;
  const [screen, ctrls] = studentScreen(i);
  const tablet = `<div class="tablet"><div class="scaler"><div class="screen">${screen}</div></div></div>`;
  if (S.view === 'mini') return `<div class="tab-mini" data-action="view" data-v="open" data-drag role="button" title="Нажмите, чтобы развернуть">${tablet}<div class="mini-cap"><span>Планшет · ${STUDENTS[i]}</span><span class="up">⤢</span></div></div>`;
  return `<div class="win"><div class="win-head" data-drag><span class="win-t">Планшет ученика</span>
    <select data-change="pick">${STUDENTS.map((n, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <span class="win-btns"><button data-action="view" data-v="mini" title="Свернуть">—</button></span></div>
    ${tablet}${ctrls ? `<div class="controls"><span class="lbl">Быстро, без ввода:</span>${ctrls}</div>` : ''}</div>`;
}
const initials = n => n.split(' ').map(x => x[0]).join('');
function sTop(title, right = '', back = '') { return `<div class="s-top">${back ? `<button class="s-back" data-action="sPage" data-p="${back}">←</button>` : ''}<span class="s-title">${title}</span><span class="s-right">${right}</span></div>`; }
function dots(label, n, curIdx, states) { return `<span class="dl">${label}</span><span class="pill-dots">${Array.from({ length: n }, (_, k) => `<i class="${states?.[k] === 'ok' ? 'ok' : states?.[k] === 'bad' ? 'bad' : k === curIdx ? 'on' : k > curIdx ? 'lock' : ''}">${k > curIdx && !states?.[k] ? '🔒' : k + 1}</i>`).join('')}</span>`; }
const box = (v, cls = '') => `<span class="ans ${cls}">${esc(v)}</span>`;
const inp = (id, cls = '') => `<input class="ans ${cls}" data-box="${id}" value="${esc(S.inp[id])}" inputmode="numeric" autocomplete="off" aria-label="Ответ">`;
const sim = (act, label) => `<button class="btn sim" data-action="${act}">👥 ${label}</button>`;
const ansBtns = (extra = '') => `<button class="btn sm" data-action="sAnswer" data-ok="1">Ответить верно</button><button class="btn sm out" data-action="sAnswer" data-ok="0">Ответить с ошибкой</button>${extra}`;
const sBottom = html => `<div class="s-bottom">${html}</div>`;
const submitBtn = kind => `<button class="btn wide" data-action="sSubmit" data-kind="${kind}" data-submit>Отправить</button>`;
const LESSON_T = 'Умножение четырёхзначного числа на однозначное число (ч.2)';

function practiceTask(p, c, h, i, t) {
  const exp = (g, k) => [p.parts, p.prods, [p.ans]][g][k];
  const cur = `p${i}-${t}-a${c.attempts}`, prev = `p${i}-${t}-a${c.attempts - 1}`, hid = `p${i}-${t}-h`;
  const typedPrev = S.inp[`${prev}-sub`];
  const cell = (g, k) => {
    const e = fmt(exp(g, k));
    if (c.st === 'ok' || (h && (h.done || h.step > g))) return box(e, 'ok');
    if (h) return h.step === g ? inp(`${hid}-${g}-${k}`, 'hl') : box('', 'off');
    if (c.st === 'bad') {
      // Answer given with the quick buttons: show a typical slip in the final sum.
      if (!typedPrev) return g === 2 ? box(fmt(p.ans - 10), 'bad') : box(e, 'ok');
      const v = S.inp[`${prev}-${g}-${k}`] || '';
      return box(v, norm(v) === norm(e) ? 'ok' : 'bad');
    }
    return inp(`${cur}-${g}-${k}`);
  };
  const l1 = `${p.a} · ${fmt(p.n)} = ${p.a} · (${p.parts.map((_, k) => cell(0, k)).join(' + ')})`;
  const l2 = `= ${p.prods.map((_, k) => cell(1, k)).join(' + ')}`;
  const tips = [`Разложи ${fmt(p.n)} на разрядные слагаемые`, `Умножь каждое слагаемое на ${p.a}`, 'Сложи неполные произведения'];
  const tip = h && !h.done ? `<div class="chip-hint">✦ ${tips[h.step]}</div>` : h?.done ? `<div class="chip-hint ok">✓ Ты решил сам — ответ засчитан</div>` : '';
  return `<div class="s-task">Вставь пропущенные числа и найди произведение.</div><div class="expr steps"><div>${l1}</div><div>${l2}</div><div>= ${cell(2, 0)}</div></div>${tip}`;
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
      const mtabs = `<div class="seg-tabs s-tabs"><button class="${S.mapTab === 'topics' ? 'on' : ''}" data-action="sMapTab" data-t="topics">По темам</button><button class="${S.mapTab === 'skills' ? 'on' : ''}" data-action="sMapTab" data-t="skills">По навыкам</button></div>`;
      const body = S.mapTab === 'skills' ? '<div class="s-soon"><b>Навыки</b><span class="muted">Скоро здесь появятся твои навыки по графу знаний</span></div>' : mods;
      return [`${sTop('Карта знаний', '', 'home')}<div class="s-body home"><h2 class="s-h2">Карта знаний</h2><div class="muted xs" style="margin-top:-8px">Пройденные и текущие темы · Математика 4 класс</div>${mtabs}${body}</div>`, ''];
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
      return [`${sTop('Домашнее задание', dots('Домашка:', plan.length, d), 'home')}<div class="s-body"><span class="why">✦ ${t.why}</span><div class="s-task">${t.text || 'Найди произведение.'}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${inp(`h${i}-${d}`)}</div></div>${sBottom(submitBtn('hw'))}`,
        `<button class="btn sm" data-action="sHw">Ответить верно (${fmt(t.ans)})</button>`];
    }
    const plan = S.hw?.confirmed ? S.hw.plans[i] : null;
    const photoK = PHOTO_WORKS.findIndex(w => w.student === i);
    const photo = photoK >= 0 && S.review.confirmed[photoK];
    const left = L.ended ? S.practice[i].filter(c => c.st !== 'ok').length : 0;
    const lessonState = L.ended ? '<span class="st-pill">Урок завершён</span>' : '<span class="st-pill"><i></i>Урок еще не начался — ждем учителя</span>';
    return [`${head}<div class="s-body home"><h2 class="s-h2 center">Привет, ${name}! 👋</h2>
      <div class="sec">Классная работа</div><div class="s-card"><span class="ill">▦</span><div><div class="muted xs">Сегодняшний урок</div><b>Урок 22</b><div>${lessonState}</div></div></div>
      <div class="sec">Домашняя работа</div><div class="s-card"><span class="ill y">✎</span><div style="flex:1"><b>${plan ? `Твоя домашка · ${plan.length} заданий` : 'Домашнее задание'}</b> ${plan ? '<span class="new sm">✦</span>' : ''}<div class="muted xs">${plan ? 'Подобрано по твоим ошибкам и навыкам' : L.ended ? 'Учитель подтверждает домашку…' : 'Сдать до 25 октября'}</div></div>${plan ? `<button class="btn" data-action="sPage" data-p="hw">${S.hwDone[i] ? 'Продолжить' : 'Начать'}</button>` : ''}</div>
      ${photo ? `<div class="s-card ok-card"><span class="ill g">✓</span><div style="flex:1"><b>Работа в тетради проверена</b><div class="muted xs">Результат по критериям</div></div><button class="btn lav" data-action="sPage" data-p="photo">Открыть</button></div>` : ''}
      <div class="sec">Мои достижения</div><button class="s-card" data-action="sPage" data-p="map"><span class="ill b">⌖</span><div style="flex:1;text-align:left"><b>Карта знаний</b><div class="muted xs">${left ? `Можно дорешать: ${left}` : 'Пройденные и текущие темы'}</div></div><span class="pct">50% ›</span></button></div>`, ''];
  }
  if (L.stage <= 1) {
    const list = FRONTAL[L.stage]; const t = list[L.task];
    if (!L.stageStarted) return [watch(), ''];
    const my = answers()[i]; const fid = `f${i}-${key()}`;
    const myVal = S.inp[fid] || (my === 'ok' ? t.right : t.wrong);
    const top = sTop(LESSON_T, dots(`${STAGES[L.stage]}:`, list.length, L.task));
    if (L.revealed) return [`${top}<div class="s-body"><div class="s-task">${t.text}</div><div class="expr">${t.expr.replace('?', box(my ? myVal : '—', my === 'ok' ? 'ok' : 'bad'))}</div></div>
      <div class="s-result"><span class="res ${my === 'ok' ? 'ok' : 'bad'}">${my === 'ok' ? '✓ Верно! Молодец.' : '✕ Не совсем так.'}</span><div class="cls"><span class="lbl">Как ответил класс:</span><div class="row" style="gap:10px">Верно: <b>${Object.values(answers()).filter(v => v === 'ok').length}</b> Неверно: <b>${Object.values(answers()).filter(v => v === 'bad').length}</b></div></div></div>`, ''];
    return [`${top}<div class="s-body"><div class="s-task">${t.text}</div><div class="expr">${t.expr.replace('?', my ? box(myVal, 'sent') : inp(fid))}</div></div>${sBottom(my ? '<button class="btn wide disabled-look">Ответ отправлен — ждём остальных</button>' : submitBtn('frontal'))}`,
      my ? sim('simFrontal', 'Ответы класса') : ansBtns(sim('simFrontal', 'Ответы класса'))];
  }
  if (L.stage === 2) {
    if (!L.stageStarted) return [watch(), ''];
    const b = S.bonus[i];
    if (b.open) return bonusScreen(i, !b.seen);
    return practiceScreen(i, false);
  }
  if (L.stage === 3) return [`${sTop(LESSON_T, 'Рефлексия')}<div class="s-body center"><div class="s-task">Как тебе урок?</div><div class="row" style="font-size:52px;gap:26px">${['😀', '🙂', '🤔'].map(e => `<button data-action="sReflect" data-v="${e}" style="opacity:${S.reflection[i] === e ? 1 : .45}">${e}</button>`).join('')}</div></div>`, sim('simReflect', 'Ответы класса')];
  return [watch('Учитель завершает урок'), ''];
}
function watch(text = 'Смотрим на учителя') { return `${sTop(LESSON_T)}<div class="s-body center"><div class="eyes">👀</div><b style="font-size:20px">${text}</b><span class="muted">Внимательно слушай объяснение, чтобы лучше усвоить материал.</span></div>`; }

function practiceScreen(i, redo) {
  const t = S.cur[i];
  const top = (tt) => sTop(LESSON_T, dots('Практика:', 7, tt, S.practice[i].map(x => x.st === 'solving' ? null : x.st)), redo ? 'map' : '');
  if (t >= PRACTICE.length) return [`${top(7)}<div class="s-body center"><div class="big-ok">✓</div><b>Практика выполнена</b><span class="muted">Решено ${solvedCount(i)} из 7</span></div>`, sim('simPractice', 'Класс решает')];
  const p = PRACTICE[t], c = S.practice[i][t], h = S.helper[i];
  if (h) return [`${top(t)}<div class="s-body">${practiceTask(p, c, h, i, t)}</div>${sBottom(h.done ? '<button class="btn wide" data-action="sHelperNext">Решать дальше</button>' : `<button class="btn wide" data-action="sHelperCheck" data-submit>Проверить шаг ${h.step + 1} из 3</button>`)}`,
    h.done ? '' : `<button class="btn sm" data-action="sHelperStep">Заполнить шаг верно</button>`];
  if (c.st === 'bad') return [`${top(t)}<div class="s-body">${practiceTask(p, c, null, i, t)}</div><div class="s-attempt">${redo ? '' : 'Попытка 1/2'}</div>
    ${sBottom(`<button class="btn lav" data-action="sHand">✋ Позвать учителя</button><button class="btn ai" data-action="sHelper">✦ Решить с помощником</button><button class="btn wide" data-action="sRetry">↻ Решить еще раз</button>`)}`, redo ? '' : sim('simPractice', 'Класс решает')];
  return [`${top(t)}<div class="s-body">${practiceTask(p, c, null, i, t)}</div><div class="s-attempt">${redo ? 'Дорешивание' : `Попытка ${Math.min(2, c.attempts + 1)}/2`}</div>${sBottom(`<button class="btn lav" data-action="sHand" title="Позвать учителя">✋</button>${submitBtn('practice')}`)}`,
    ansBtns(redo ? '' : sim('simPractice', 'Класс решает'))];
}

function bonusScreen(i, unlock) {
  const b = S.bonus[i]; const tasks = bonusTasks(i); const hard = strong(i);
  if (unlock) return [`${sTop(LESSON_T, 'Бонус')}<div class="s-body center"><div style="font-size:60px">⭐</div><span class="new">✦ новое</span><b style="font-size:22px">Открыты бонусные задания!</b>
    <span class="muted" style="max-width:460px">${hard ? 'Ты хорошо справился с практикой. Попробуй задания посложнее — их подобрал ИИ.' : 'Практика закончена. ИИ подобрал задания, похожие на те, где были ошибки, — закрепим.'}</span></div>${sBottom('<button class="btn wide" data-action="sBonusOpen">Решать бонус</button>')}`,
    sim('simPractice', 'Класс решает')];
  const k = b.done.length;
  if (k >= tasks.length) return [`${sTop(LESSON_T, 'Бонус')}<div class="s-body center"><div style="font-size:56px">⭐</div><b>Бонус пройден</b><span class="muted">${b.done.filter(Boolean).length} из ${tasks.length} верно</span></div>`, sim('simPractice', 'Класс решает')];
  const t = tasks[k];
  return [`${sTop(LESSON_T, dots('Бонус:', tasks.length, k, b.done.map(x => x ? 'ok' : 'bad')))}<div class="s-body"><span class="why">✦ создано ИИ · ${t.why}</span><div class="s-task">${t.text}</div><div class="expr">${t.a} · ${fmt(t.n)} = ${inp(`b${i}-${k}`)}</div></div>${sBottom(submitBtn('bonus'))}`,
    `<button class="btn sm" data-action="sBonus" data-ok="1">Ответить верно (${fmt(t.ans)})</button><button class="btn sm out" data-action="sBonus" data-ok="0">Ответить с ошибкой</button>${sim('simPractice', 'Класс решает')}`];
}

// ---------- Plumbing ----------
const winPos = { mini: null, open: null }; // dragged positions of the tablet, per state
let justDragged = false;
function placeWin() {
  const w = document.getElementById('studentWrap');
  const s = S.view === 'mini' ? 0.27 : Math.max(0.5, Math.min(0.92, (innerWidth - 80) / 828, (innerHeight - 170) / 528));
  w.style.setProperty('--s', s.toFixed(3));
  const pos = winPos[S.view];
  w.style.left = w.style.top = w.style.right = w.style.bottom = '';
  if (!pos) return;
  const r = w.getBoundingClientRect();
  w.style.left = Math.max(0, Math.min(innerWidth - r.width, pos.x)) + 'px';
  w.style.top = Math.max(0, Math.min(innerHeight - r.height, pos.y)) + 'px';
  w.style.right = w.style.bottom = 'auto';
}
function render() {
  document.getElementById('teacher').innerHTML = teacher();
  document.getElementById('studentWrap').innerHTML = student();
  placeWin();
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
document.addEventListener('input', e => { const b = e.target.closest('[data-box]'); if (b) S.inp[b.dataset.box] = b.value; });
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.closest('[data-box]')) return;
  document.querySelector('#studentWrap [data-submit]')?.click();
});
document.addEventListener('pointerdown', e => {
  const head = e.target.closest('[data-drag]');
  if (!head || e.target.closest('button,select,input')) return;
  const w = document.getElementById('studentWrap'); const r = w.getBoundingClientRect();
  const x0 = e.clientX, y0 = e.clientY, view = S.view; let moved = false;
  const move = ev => {
    if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
    moved = true; winPos[view] = { x: r.left + ev.clientX - x0, y: r.top + ev.clientY - y0 }; placeWin();
  };
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); if (moved) { justDragged = true; setTimeout(() => { justDragged = false; }, 0); } };
  addEventListener('pointermove', move); addEventListener('pointerup', up);
});
// A drag of the tablet picture must not count as a click that opens it.
document.addEventListener('click', e => { if (justDragged && e.target.closest('[data-drag]')) e.stopImmediatePropagation(); }, true);
addEventListener('resize', placeWin);
S = freshState();
render();
