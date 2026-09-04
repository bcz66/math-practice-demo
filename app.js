'use strict';

const LS_KEY = 'mathdaily_v1';

// ---------- 基础工具函数 ----------

function $id(id) {
  return document.getElementById(id);
}

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return fmtDate(new Date());
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

function diffDays(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.floor((b - a) / 86400000);
}

function uniqId(prefix = 'q') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function topicName(t) {
  if (t === 'limit') return '极限';
  if (t === 'derivative') return '导数与微分';
  if (t === 'integral') return '积分';
  return t || '未知';
}

function topicShortName(t) {
  if (t === 'limit') return '极限';
  if (t === 'derivative') return '导数';
  if (t === 'integral') return '积分';
  return t || '未知';
}

// ---------- 本地题库：模板参数化 ----------

function makeLimitSinKX() {
  const k = randomInt(2, 5);
  const answer = String(k);
  return {
    topic: 'limit',
    tag: 'limit_sinx_over_x',
    question: `$$\\lim_{x \\to 0} \\frac{\\sin(${k}x)}{x}$$`,
    choices: shuffle(['0', answer, '1', String(k + 1)]),
    answer,
    explanation: `利用重要极限：当 u→0 时 sin(u)~u，这里 u=${k}x，因此极限为 ${k}。`,
  };
}

function makeLimitTanKX() {
  const k = randomInt(2, 5);
  const answer = String(k);
  return {
    topic: 'limit',
    tag: 'limit_tanx_over_x',
    question: `$$\\lim_{x \\to 0} \\frac{\\tan(${k}x)}{x}$$`,
    choices: shuffle([answer, '0', '1', String(-k)]),
    answer,
    explanation: `tan(kx) 在 x→0 时等价于 ${k}x，因此极限为 ${k}。`,
  };
}

function makeLimitRationalInf() {
  const k = randomInt(1, 5);
  const n = randomInt(1, 5);
  const answer = String(k / n);
  const b1 = randomInt(1, 9);
  const b2 = randomInt(1, 9);
  return {
    topic: 'limit',
    tag: 'limit_rational_infinity',
    question: `$$\\lim_{x \\to \\infty} \\frac{${k}x + ${b1}}{${n}x + ${b2}}$$`,
    choices: shuffle([answer, '0', '∞', String(k)]),
    answer,
    explanation: `当 x→∞ 时，只看最高次项系数：${k}/${n} = ${answer}。`,
  };
}

function makeLimitDiffSquare() {
  const a = randomInt(2, 4);
  const answer = String(2 * a);
  return {
    topic: 'limit',
    tag: 'limit_diff_square',
    question: `$$\\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x - ${a}}$$`,
    choices: shuffle([answer, String(a), String(a + 1), '0']),
    answer,
    explanation: `分子 x² - ${a * a} = (x - ${a})(x + ${a})，约分后代入 x=${a}，结果为 ${2 * a}。`,
  };
}

function makeDerivativeSinKx() {
  const k = randomInt(2, 5);
  const answer = `${k}\\cos(${k}x)`;
  return {
    topic: 'derivative',
    tag: 'derivative_sinkx',
    question: `$$\\frac{d}{dx} \\sin(${k}x) = ?$$`,
    choices: shuffle([answer, `\\cos(${k}x)`, `${-k}\\cos(${k}x)`, `${k}x\\cos(${k}x)`]),
    answer,
    explanation: `复合函数求导：外层先求导得到 cos(${k}x)，再乘内层导数 ${k}，所以结果是 ${k}cos(${k}x)。`,
  };
}

function makeDerivativePower() {
  const n = randomInt(2, 5);
  const answer = `${n}x^{${n - 1}}`;
  return {
    topic: 'derivative',
    tag: 'derivative_power',
    question: `$$\\frac{d}{dx} x^{${n}} = ?$$`,
    choices: shuffle([answer, `x^{${n - 1}}`, `${n - 1} x^{${n - 1}}`, `${n} x^{${n + 1}}`]),
    answer,
    explanation: `幂函数求导公式：x^n 的导数为 n·x^(n-1)。`,
  };
}

function makeDerivativeExp() {
  const k = randomInt(2, 5);
  const answer = `${k}e^{${k}x}`;
  return {
    topic: 'derivative',
    tag: 'derivative_exp',
    question: `$$\\frac{d}{dx} e^{${k}x} = ?$$`,
    choices: shuffle([answer, `e^{${k}x}`, `${k}e^{x}`, `e^{${k - 1}x}`]),
    answer,
    explanation: `指数复合函数求导：e^(${k}x) 的导数为 ${k}·e^(${k}x)。`,
  };
}

function makeIntegralLinear() {
  const k = randomInt(2, 6);
  const answer = String(k / 2);
  return {
    topic: 'integral',
    tag: 'integral_linear',
    question: `$$\\int_0^1 ${k}x \\, dx$$`,
    choices: shuffle([answer, String(k), String(k / 3), '2']),
    answer,
    explanation: `∫0¹ ${k}x dx，原函数为 ${k / 2}x²，代入上下限得到 ${answer}。`,
  };
}

function makeIntegralPower() {
  const n = randomInt(2, 4);
  const answer = (1 / (n + 1)).toFixed(2);
  return {
    topic: 'integral',
    tag: 'integral_power',
    question: `$$\\int_0^1 x^{${n}} \\, dx$$`,
    choices: shuffle([answer, (1 / n).toFixed(2), String(n), '1']),
    answer,
    explanation: `∫x^n dx = x^(n+1)/(n+1)，代入 0 和 1 得到 ${answer}。`,
  };
}

function makeIntegralExp() {
  const k = randomInt(2, 4);
  const answer = String(k);
  return {
    topic: 'integral',
    tag: 'integral_exp_scale',
    question: `$$\\int_0^1 \\left( ${k}x + 1 \\right) \\, dx$$`,
    choices: shuffle([answer, String(k + 1), '1', String(k + 2)]),
    answer,
    explanation: `∫0¹ (${k}x + 1)dx = (${k / 2}x² + x)|0¹ = ${k / 2} + 1 = ${answer}。`,
  };
}

const LOCAL_FACTORIES = {
  limit: [makeLimitSinKX, makeLimitTanKX, makeLimitRationalInf, makeLimitDiffSquare],
  derivative: [makeDerivativeSinKx, makeDerivativePower, makeDerivativeExp],
  integral: [makeIntegralLinear, makeIntegralPower, makeIntegralExp],
};

function makeLocalQuestion(topic) {
  const fns = LOCAL_FACTORIES[topic] || LOCAL_FACTORIES.limit;
  const q = pick(fns)();
  q.id = uniqId('local');
  q.reviewMode = false;
  return q;
}

function makeReviewQuestion(topic, tag) {
  const all = [
    ...LOCAL_FACTORIES.limit,
    ...LOCAL_FACTORIES.derivative,
    ...LOCAL_FACTORIES.integral,
  ];

  if (tag) {
    const fn = all.find((f) => f().tag === tag);
    if (fn) {
      const q = fn();
      q.id = uniqId('review');
      q.reviewMode = true;
      return q;
    }
  }

  const q = makeLocalQuestion(topic || 'limit');
  q.id = uniqId('review');
  q.reviewMode = true;
  return q;
}

// ---------- DeepSeek AI ----------

const AI_TIMEOUT = 4000;

async function callAIClient(prompt) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT);

  try {
    const res = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: ctrl.signal,
    });

    if (!res.ok) throw new Error('request failed');
    const data = await res.json();
    return data.reply || '';
  } catch (e) {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function extractJSONArray(text) {
  if (!text) return null;
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  try {
    const value = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(value) ? value : null;
  } catch (e) {
    return null;
  }
}

async function tryAIGenerateQuestions(count) {
  const prompt = `你是一个考研数学出题助手。请严格返回 JSON 数组，不要输出任何额外文字。
生成 ${count} 道考研高数基础单选题，覆盖极限、导数、积分。
每道题必须包含：
topic：limit 或 derivative 或 integral
tag：考点标签
question：KaTeX公式，例如 \\\\( \\\\lim_{x \\\\to 0} \\\\frac{\\\\sin(2x)}{x} \\\\)
choices：4个选项数组
answer：choices中正确选项的原字符串
explanation：中文解析
只能返回 JSON，例如：
[{"topic":"limit","tag":"limit_sinx","question":"...","choices":["0","1","2","3"],"answer":"2","explanation":"..."}]`;

  try {
    const text = await callAIClient(prompt);
    const data = extractJSONArray(text);
    if (!data) return [];

    const list = data.slice(0, count).filter((x) => {
      return x
        && Array.isArray(x.choices)
        && x.choices.length === 4
        && x.choices.includes(String(x.answer));
    });

    return list.map((x) => ({
      id: uniqId('ai'),
      topic: ['limit', 'derivative', 'integral'].includes(x.topic) ? x.topic : 'limit',
      tag: String(x.tag || 'ai_generated'),
      question: String(x.question || ''),
      choices: x.choices.map((v) => String(v)),
      answer: String(x.answer),
      explanation: String(x.explanation || 'AI 解析生成中。'),
      reviewMode: false,
      fromAI: true,
    }));
  } catch (e) {
    return [];
  }
}

// ---------- 全局状态 ----------

function defaultState() {
  return {
    version: 1,
    streakCount: 0,
    lastStreakDate: null,
    completedDays: [],
    diagnosed: false,
    latestDiagnose: null,
    records: [],
    review: {},
    log: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.version === 1) return data;
    }
  } catch (e) {
    // ignore
  }
  return defaultState();
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

function addLog(msg) {
  state.log.push({ time: new Date().toISOString(), message: msg });
  if (state.log.length > 200) state.log = state.log.slice(-200);
}

// ---------- 复习调度 ----------

function getTodayRecords() {
  const today = todayStr();
  return state.records.filter((r) => r.date === today && !r.diagnostic);
}

function getTodayStat() {
  const list = getTodayRecords();
  const correct = list.filter((r) => r.correct).length;
  const total = list.length;
  return {
    total,
    correct,
    percent: total ? Math.round((correct / total) * 100) : 0,
  };
}

const SESSION_TARGET = 9;

function isTodayCompleted() {
  return getTodayStat().total >= SESSION_TARGET;
}

function getTodayAnswerCount() {
  return getTodayRecords().length;
}

function addReviewFailure(tag) {
  const today = todayStr();
  const rec = state.review[tag] || {
    wrongCount: 0,
    consecutiveCorrect: 0,
    nextDue: null,
  };

  rec.consecutiveCorrect = 0;
  rec.wrongCount += 1;
  const days = rec.wrongCount === 1 ? 2 : 5;
  rec.nextDue = addDays(today, days);
  state.review[tag] = rec;
}

function addReviewSuccess(tag) {
  if (!state.review[tag]) return;

  const rec = state.review[tag];
  rec.consecutiveCorrect += 1;

  if (rec.consecutiveCorrect >= 3) {
    delete state.review[tag];
  } else {
    rec.nextDue = addDays(todayStr(), 1);
  }
}

function recordAnswer(questionObj, selectedText) {
  const isCorrect = String(selectedText) === String(questionObj.answer);

  state.records.push({
    id: uniqId('record'),
    date: todayStr(),
    topic: questionObj.topic,
    tag: questionObj.tag,
    correct: isCorrect,
    reviewMode: !!questionObj.reviewMode,
    fromAI: !!questionObj.fromAI,
    timestamp: Date.now(),
  });

  if (!isCorrect) {
    addReviewFailure(questionObj.tag);
  } else if (questionObj.reviewMode) {
    addReviewSuccess(questionObj.tag);
  }

  saveState();
  return isCorrect;
}

function getDueReviewTags() {
  const today = todayStr();
  return Object.entries(state.review)
    .filter(([tag, rec]) => {
      return rec && rec.nextDue && rec.nextDue <= today;
    })
    .map(([tag, rec]) => tag);
}

function findTopicByTag(tag) {
  if (!tag) return null;
  if (tag.startsWith('limit')) return 'limit';
  if (tag.startsWith('derivative')) return 'derivative';
  if (tag.startsWith('integral')) return 'integral';

  const all = [
    ...LOCAL_FACTORIES.limit,
    ...LOCAL_FACTORIES.derivative,
    ...LOCAL_FACTORIES.integral,
  ];
  const q = all.find((f) => f().tag === tag);
  return q ? q().topic : null;
}

// ---------- UI 渲染 ----------

function renderMath() {
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\\\(', right: '\\\\)', display: false },
        ],
        throwOnError: false,
      });
    } catch (e) {
      // ignore
    }
  }
}

// ---------- 页面切换 ----------

let activeTab = 'dashboard';

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', function () {
    switchTab(this.dataset.tab);
  });
});

function switchTab(tab) {
  activeTab = tab;

  document.querySelectorAll('.view-section').forEach((sec) => sec.classList.add('hidden'));

  const map = {
    dashboard: 'view-dashboard',
    diagnose: 'view-diagnose',
    practice: 'view-practice',
    records: 'view-records',
    stats: 'view-stats',
  };

  const target = $id(map[tab]);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((b) => {
    if (b.dataset.tab === tab) {
      b.classList.add('bg-slate-800', 'text-sky-200');
    } else {
      b.classList.remove('bg-slate-800', 'text-sky-200');
    }
  });

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'diagnose') renderDiagnose();
  if (tab === 'practice') renderPractice();
  if (tab === 'records') renderRecords();
  if (tab === 'stats') renderStats();

  renderMath();
}

// ---------- 首页 ----------

function renderDashboard() {
  const stat = getTodayStat();
  const dueCount = getDueReviewTags().length;
  const today = todayStr();

  let html = '';

  if (!state.diagnosed) {
    html += `
      <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
        <h2 class="text-lg font-semibold text-amber-200">尚未完成能力诊断</h2>
        <p class="mt-2 text-sm text-amber-100/70">完成 15 道快速诊断后，系统才会开始生成个人每日训练计划。</p>
        <button onclick="startDiagnosis()" class="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900">开始诊断 →</button>
      </div>
    `;
  }

  let doneTip = '';
  if (isTodayCompleted()) {
    doneTip = `
      <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✅ 今日任务已完成。明天继续回来，保持连续打卡记录。
      </div>`;
  } else if (stat.total > 0) {
    doneTip = `
      <div class="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
        今日练习仍在进行，继续加油。
      </div>`;
  }

  html += `
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">今日已完成</p>
        <p class="mt-2 text-3xl font-bold text-sky-300">${stat.total} <span class="text-sm text-slate-500">/ ${SESSION_TARGET}</span></p>
        <p class="mt-1 text-xs text-slate-500">正确率 ${stat.percent}%</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">连续打卡</p>
        <p class="mt-2 text-3xl font-bold text-emerald-300">${state.streakCount} 天</p>
        <p class="mt-1 text-xs text-slate-500">上次打卡：${state.lastStreakDate || '暂无'}</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">待复习考点</p>
        <p class="mt-2 text-3xl font-bold text-rose-300">${dueCount}</p>
        <p class="mt-1 text-xs text-slate-500">到期进入今日训练</p>
      </div>
    </div>
  `;

  html += doneTip;

  if (state.latestDiagnose) {
    html += `
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 class="font-semibold text-slate-200">最近诊断结果</h3>
        <p class="mt-2 text-sm text-slate-400">极限 ${state.latestDiagnose.limit}% · 导数 ${state.latestDiagnose.derivative}% · 积分 ${state.latestDiagnose.integral}%</p>
        <p class="mt-2 text-sm text-slate-400">总正确率：${state.latestDiagnose.total}%</p>
      </div>
    `;
  }

  $id('dashboard-main').innerHTML = html;
}

// ---------- 能力诊断 ----------

let diagnosing = false;
let diagQueue = [];
let diagIndex = 0;
let diagCorrectCount = 0;

function renderDiagnose() {
  if (diagnosing) return;

  if (!state.diagnosed) {
    $id('diagnose-main').innerHTML = `
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h2 class="text-xl font-semibold text-slate-200">能力诊断</h2>
        <p class="mt-2 text-sm text-slate-400">共 15 道基础计算题，覆盖极限、导数、积分。</p>
        <button onclick="startDiagnosis()" class="mt-6 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-900">开始诊断</button>
      </div>
    `;
    return;
  }

  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
      <h2 class="text-xl font-semibold text-slate-200">诊断已完成</h2>
      <p class="mt-2 text-sm text-slate-400">可随时重新测试，检验学习变化。</p>
      <button onclick="startDiagnosis()" class="mt-6 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-900">重新诊断</button>
    </div>
  `;
}

function startDiagnosis() {
  diagnosing = true;
  diagCorrectCount = 0;
  diagIndex = 0;
  diagQueue = [];

  const topics = [
    'limit', 'limit', 'limit', 'limit', 'limit',
    'derivative', 'derivative', 'derivative', 'derivative', 'derivative',
    'integral', 'integral', 'integral', 'integral', 'integral',
  ];

  topics.forEach(function (topic) {
    const q = makeLocalQuestion(topic);
    q.diagnostic = true;
    diagQueue.push(q);
  });

  renderDiagnosisQuestion();
}

function renderDiagnosisQuestion() {
  if (diagIndex >= diagQueue.length) {
    finishDiagnosis();
    return;
  }

  const q = diagQueue[diagIndex];

  const htmlChoices = q.choices.map(function (choice) {
    const escaped = JSON.stringify(choice).replace(/"/g, '&quot;');
    return `
      <button class="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:border-sky-400"
              onclick="answerDiagnosis('${escaped}')">
        ${choice}
      </button>
    `;
  }).join('');

  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div class="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>能力诊断 ${diagIndex + 1} / ${diagQueue.length}</span>
        <span>${topicName(q.topic)}</span>
      </div>
      <div class="question-html mb-5 min-h-[50px]">${q.question}</div>
      <div class="grid gap-2 sm:grid-cols-2">${htmlChoices}</div>
    </div>
  `;

  renderMath();
}

function answerDiagnosis(choiceText) {
  const q = diagQueue[diagIndex];
  const isCorrect = q.answer === choiceText;

  if (isCorrect) diagCorrectCount += 1;

  state.records.push({
    id: uniqId('diag'),
    date: todayStr(),
    topic: q.topic,
    tag: q.tag,
    correct: isCorrect,
    reviewMode: false,
    diagnostic: true,
    timestamp: Date.now(),
  });

  saveState();
  diagIndex += 1;
  renderDiagnosisQuestion();
}

function finishDiagnosis() {
  function rateOf(topic) {
    const list = state.records.filter(function (r) {
      return r.topic === topic && r.diagnostic;
    });
    if (!list.length) return 0;
    const correct = list.filter(function (r) { return r.correct; }).length;
    return Math.round((correct / list.length) * 100);
  }

  const limit = rateOf('limit');
  const derivative = rateOf('derivative');
  const integral = rateOf('integral');
  const total = Math.round((diagCorrectCount / diagQueue.length) * 100);

  state.diagnosed = true;
  state.latestDiagnose = {
    total: total,
    limit: limit,
    derivative: derivative,
    integral: integral,
    date: todayStr(),
  };

  saveState();
  addLog('完成能力诊断');
  diagnosing = false;

  let weak = '极限';
  if (derivative <= limit && derivative <= integral) weak = '导数';
  if (integral <= limit && integral <= derivative) weak = '积分';

  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
      <h2 class="text-xl font-semibold text-emerald-200">诊断完成</h2>
      <p class="mt-2 text-sm text-slate-300">总正确率：${total}%</p>
      <div class="mt-4 space-y-2 text-sm">
        <p>极限模块：${limit}%</p>
        <p>导数模块：${derivative}%</p>
        <p>积分模块：${integral}%</p>
      </div>
      <p class="mt-4 text-sm text-amber-300">当前最薄弱模块：${weak}</p>
      <button onclick="switchTab('practice')" class="mt-6 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900">前往每日训练</button>
    </div>
  `;
}

// ---------- 每日训练 ----------

let sessionQuestionQueue = [];
let sessionIndex = 0;

async function renderPractice() {
  if (!state.diagnosed) {
    $id('practice-main').innerHTML = `
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h2 class="text-lg font-semibold">请先完成能力诊断</h2>
        <button onclick="switchTab('diagnose')" class="mt-4 rounded-lg bg-sky-500 px-5 py-2 text-sm">前往诊断</button>
      </div>
    `;
    return;
  }

  if (isTodayCompleted()) {
    const stat = getTodayStat();
    $id('practice-main').innerHTML = `
      <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <h2 class="text-xl font-bold text-emerald-200">今日训练已完成 🎉</h2>
        <p class="mt-2 text-sm text-slate-400">已完成 ${stat.total} 题，正确 ${stat.correct} 题</p>
        <button onclick="resetTodayQuota()" class="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">模拟清空今日纪录</button>
      </div>
    `;
    return;
  }

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
      <p class="text-sm text-slate-400">正在准备今日题目...</p>
    </div>
  `;

  const questions = await buildSession();

  if (!questions || questions.length === 0) {
    $id('practice-main').innerHTML = `
      <div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <p class="font-semibold text-rose-300">题目生成失败，请刷新后重试。</p>
      </div>
    `;
    return;
  }

  sessionQuestionQueue = questions;
  sessionIndex = 0;
  renderCurrentSessionQuestion();
}

async function buildSession() {
  const dueTags = getDueReviewTags();
  const dueCount = Math.min(dueTags.length, 3);

  const topics = ['limit', 'derivative', 'integral'];
  const session = [];

  for (let i = 0; i < dueCount; i++) {
    const tag = dueTags[i];
    const topic = findTopicByTag(tag) || topics[i % topics.length];
    session.push(makeReviewQuestion(topic, tag));
  }

  const newNeeded = Math.max(SESSION_TARGET - session.length, 3);
  const aiQuestions = await tryAIGenerateQuestions(newNeeded);

  let aiValid = aiQuestions.filter(function (q) {
    return q && q.choices && q.choices.length >= 4;
  });

  if (aiValid.length >= 3) {
    for (let i = 0; i < newNeeded; i++) {
      session.push(aiValid[i % aiValid.length]);
    }
  } else {
    for (let i = 0; i < newNeeded; i++) {
      session.push(makeLocalQuestion(topics[i % topics.length]));
    }
  }

  return session;
}

function renderCurrentSessionQuestion() {
  if (sessionIndex >= sessionQuestionQueue.length) {
    handleSessionComplete();
    return;
  }

  const q = sessionQuestionQueue[sessionIndex];
  const total = sessionQuestionQueue.length;
  const stat = getTodayStat();

  const badgeColor = q.reviewMode ? 'rose' : 'sky';
  const badgeText = q.reviewMode ? '复习题' : '新题';

  const htmlChoices = q.choices.map(function (choice) {
    const escaped = JSON.stringify(choice).replace(/"/g, '&quot;');
    return `
      <button class="practice-choice rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:border-sky-400"
              onclick="answerPractice('${escaped}')">
        ${choice}
      </button>
    `;
  }).join('');

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div class="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>第 ${stat.total + 1} 题 / 本场 ${total} 题</span>
        <span class="rounded bg-${badgeColor}-500/10 px-2 py-1 text-${badgeColor}-300">${badgeText}</span>
      </div>
      <div class="question-html mb-6 min-h-[60px]">${q.question}</div>
      <div class="grid gap-2 sm:grid-cols-2">${htmlChoices}</div>
      <p class="mt-4 text-xs text-slate-600">回答后立即显示解析，并影响后续复习安排。</p>
    </div>
  `;

  renderMath();
}

function answerPractice(choiceText) {
  const q = sessionQuestionQueue[sessionIndex];
  const isCorrect = recordAnswer(q, choiceText);

  const resultHtml = isCorrect
    ? `<span class="text-emerald-300 font-semibold">✔ 回答正确</span>`
    : `<span class="text-rose-300 font-semibold">✘ 回答错误 · 已加入复习队列</span>`;

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div class="mb-3 text-lg">${resultHtml}</div>
      <div class="question-html mb-4">${q.question}</div>
      <div class="rounded-lg bg-slate-800/60 p-4 text-sm text-slate-300">
        <b>正确答案：</b> ${q.answer}<br/><br/>
        <b>解析：</b> ${q.explanation || '暂无解析'}
      </div>
      <button onclick="nextPracticeQuestion()" class="mt-6 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900">下一题 →</button>
    </div>
  `;

  renderMath();
}

function nextPracticeQuestion() {
  const today = todayStr();

  if (state.lastStreakDate !== today) {
    state.lastStreakDate = today;
    state.streakCount = state.streakCount ? state.streakCount + 1 : 1;
    saveState();
  }

  sessionIndex += 1;

  if (sessionIndex >= sessionQuestionQueue.length) {
    state.completedDays.push(today);
    saveState();
    sessionQuestionQueue = [];
    renderPractice();
    return;
  }

  renderCurrentSessionQuestion();
}

function handleSessionComplete() {
  const stat = getTodayStat();

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
      <h2 class="text-xl font-bold text-emerald-300">今日题目全部完成</h2>
      <p class="mt-2 text-sm text-slate-400">累计完成 ${stat.total} 题 · 正确 ${stat.correct} 题</p>
      <div class="mt-6 space-x-3">
        <button onclick="switchTab('records')" class="rounded-lg bg-slate-700 px-5 py-2 text-sm">查看复习队列</button>
        <button onclick="switchTab('stats')" class="rounded-lg bg-sky-500 px-5 py-2 text-sm text-slate-900">查看数据</button>
      </div>
    </div>
  `;
}

function resetTodayQuota() {
  const today = todayStr();
  state.records = state.records.filter(function (r) {
    return r.date !== today || r.diagnostic;
  });
  saveState();
  renderPractice();
}

// ---------- 错题与复习 ----------

function renderRecords() {
  const dueCount = getDueReviewTags().length;
  let html = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="font-semibold text-lg text-slate-200">错题与复习队列</h2>
      <p class="mt-1 text-sm text-slate-400">到期复习考点：${dueCount} 个</p>
      <p class="text-xs text-slate-500">连续答对 3 次后，自动移出高频复习池</p>
    </div>
  `;

  if (!state.diagnosed) {
    html += `<div class="rounded-xl bg-slate-900 p-6 text-center text-slate-400">先完成诊断后才会产生错题记录。</div>`;
    $id('records-main').innerHTML = html;
    return;
  }

  const reviewEntries = Object.entries(state.review);

  if (reviewEntries.length === 0) {
    html += `<div class="rounded-xl border border-emerald-500/20 bg-slate-900 p-6 text-slate-400">暂无待复习错题考点。</div>`;
  } else {
    html += `<div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">`;

    reviewEntries.forEach(function (entry) {
      const tag = entry[0];
      const rec = entry[1];
      html += `
        <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-200">${tag}</p>
            <p class="text-xs text-slate-500">连续答对：${rec.consecutiveCorrect || 0} / 3 · 错误次数：${rec.wrongCount || 0}</p>
          </div>
          <p class="text-xs text-slate-500">下次复习：${rec.nextDue || '--'}</p>
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="font-semibold text-sm text-slate-300">本地记录管理</h3>
      <p class="mt-2 text-xs text-slate-500">将清除全部记录与复习池，适合演示前重置。</p>
      <button onclick="clearAllData()" class="mt-4 rounded-lg border border-rose-500/40 px-4 py-1.5 text-xs text-rose-300">清空全部本地数据</button>
    </div>
  `;

  $id('records-main').innerHTML = html;
}

function clearAllData() {
  if (!confirm('确定清空全部本地数据吗？')) return;
  localStorage.removeItem(LS_KEY);
  state = defaultState();
  saveState();
  switchTab('dashboard');
}

// ---------- 数据仪表盘 ----------

function renderStats() {
  const records = state.records;
  const correct = records.filter(function (r) { return r.correct; }).length;
  const total = records.length;
  const totalRate = total ? Math.round((correct / total) * 100) : 0;

  const today = todayStr();
  const last7 = [];

  for (let i = 6; i >= 0; i--) {
    last7.push(addDays(today, -i));
  }

  const dailyRows = last7.map(function (d) {
    const list = records.filter(function (r) { return r.date === d; });
    const c = list.filter(function (r) { return r.correct; }).length;
    const rate = list.length ? Math.round((c / list.length) * 100) : 0;
    const color = rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-rose-400';
    return `
      <div class="text-center">
        <div class="text-xs text-slate-500">${d.slice(5)}</div>
        <div class="mt-1 text-sm font-semibold text-slate-200">${list.length}题</div>
        <div class="text-xs ${color}">${rate}%</div>
      </div>
    `;
  }).join('');

  const topicStats = ['limit', 'derivative', 'integral'].map(function (topic) {
    const lis = records.filter(function (r) { return r.topic === topic; });
    const c = lis.filter(function (r) { return r.correct; }).length;
    const rate = lis.length ? Math.round((c / lis.length) * 100) : 0;
    return { topic: topic, total: lis.length, rate: rate };
  });

  const weak = topicStats.slice().sort(function (a, b) { return a.rate - b.rate; })[0];

  $id('stats-main').innerHTML = `
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">累计答题</p>
        <p class="mt-2 text-3xl font-bold text-slate-100">${total}</p>
        <p class="text-xs text-slate-500">总正确率 ${totalRate}%</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">当前最弱模块</p>
        <p class="mt-2 text-xl font-bold text-rose-300">${weak ? topicShortName(weak.topic) : '暂无'}</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">连续打卡</p>
        <p class="mt-2 text-xl font-bold text-emerald-300">${state.streakCount} 天</p>
      </div>
    </div>
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="text-sm font-semibold text-slate-300">近 7 日答题趋势</h3>
      <div class="mt-4 grid grid-cols-7 gap-1">${dailyRows}</div>
    </div>
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="text-sm font-semibold text-slate-300">模块正确率</h3>
      <div class="mt-4 space-y-3">
        ${topicStats.map(function (s) {
          return `
            <div class="flex items-center justify-between text-sm">
              <span>${topicName(s.topic)}</span>
              <span>${s.rate}% · ${s.total} 题</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ---------- 启动 ----------

function start() {
  if (!state.completedDays) state.completedDays = [];
  saveState();
  switchTab('dashboard');
}

document.addEventListener('DOMContentLoaded', start);

// 暴露给 HTML onclick
window.startDiagnosis = startDiagnosis;
window.answerDiagnosis = answerDiagnosis;
window.answerPractice = answerPractice;
window.nextPracticeQuestion = nextPracticeQuestion;
window.switchTab = switchTab;
window.resetTodayQuota = resetTodayQuota;
window.clearAllData = clearAllData;