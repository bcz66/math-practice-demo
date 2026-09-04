// ==========================================================
// 高数日练 · MathDaily
// 纯前端 + LocalStorage + DeepSeek（可选）
// 布置说明：如果部署 Vercel，需创建 /api/deepseek 代理
// 环境变量：DEEPSEEK_API_KEY
// ==========================================================

'use strict';

const LS_KEY = 'mathdaily_v1';

// ---------------- 工具函数 ----------------

function $id(id) {
  return document.getElementById(id);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
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

// 判断日期差
function diffDays(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.floor((b - a) / 86400000);
}

// ---------------- 本地题目库 ----------------

function makeLimitSinKX() {
  const k = randomInt(2, 5);
  const answer = String(k);
  const question = `$$\\lim_{x \\to 0} \\frac{\\sin(${k}x)}{x}$$`;
  const choices = shuffle(['0', String(k), '1', String(k + 1)]);
  return {
    topic: 'limit',
    tag: 'limit_sinx_over_x',
    question,
    choices,
    answer,
    explanation: `利用等价无穷小或重要极限：当 u→0 时 sin(u)~u，这里 u=${k}x，所以极限为 ${k}。`,
  };
}

function makeLimitTanKX() {
  const k = randomInt(2, 5);
  const answer = String(k);
  const question = `$$\\lim_{x \\to 0} \\frac{\\tan(${k}x)}{x}$$`;
  const choices = shuffle([answer, '0', '1', String(-k)]);
  return {
    topic: 'limit',
    tag: 'limit_tanx_over_x',
    question,
    choices,
    answer,
    explanation: `tan(kx) 在 x→0 时等价于 ${k}x，因此原式等于 ${k}。`,
  };
}

function makeLimitRationalInf() {
  const k = randomInt(1, 5);
  const n = randomInt(1, 5);
  const answer = (k / n).toFixed(0);
  const question = `$$\\lim_{x \\to \\infty} \\frac{${k}x + ${randomInt(1, 9)}}{${n}x + ${randomInt(1, 9)}}$$`;
  const choices = shuffle([answer, '0', '∞', String(k)]);
  return {
    topic: 'limit',
    tag: 'limit_rational_infinity',
    question,
    choices,
    answer,
    explanation: `当 x→∞ 时，最高次项起主要作用，极限为最高次系数之比：${k}/${n} = ${answer}。`,
  };
}

function makeLimitTwoOpen() {
  const a = randomInt(2, 4);
  const answer = String(2 * a);
  const question = `$$\\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{x - ${a}}$$`;
  const choices = shuffle([answer, String(a), String(a + 1), '不存在']);
  return {
    topic: 'limit',
    tag: 'limit_diff_square',
    question,
    choices,
    answer,
    explanation: `分子 x² - ${a * a} = (x - ${a})(x + ${a})，约去 x - ${a} 后代入 x=${a}，结果为 ${answer}。`,
  };
}

function makeDerivativeSinKx() {
  const k = randomInt(2, 5);
  const question = `$$\\frac{d}{dx} \\sin(${k}x) = ?$$`;
  const ans = `${k}\\cos(${k}x)`;
  const answerText = ans;
  const choices = shuffle([ans, `\\cos(${k}x)`, `${-k}\\cos(${k}x)`, `${k}x\\cos(${k}x)`]);
  return {
    topic: 'derivative',
    tag: 'derivative_sinkx',
    question,
    choices,
    answer: answerText,
    explanation: `复合函数求导：外层 cos，内层导数为 ${k}，所以结果是 ${k}cos(${k}x)。`,
  };
}

function makeDerivativePower() {
  const n = randomInt(2, 5);
  const answer = `${n}x^{${n - 1}}`;
  const choices = shuffle([answer, `x^{${n - 1}}`, `${n - 1}x^{${n - 1}}`, `${n}x^{${n + 1}}`]);
  return {
    topic: 'derivative',
    tag: 'derivative_power',
    question: `$$\\frac{d}{dx} x^{${n}} = ?$$`,
    choices,
    answer,
    explanation: `幂函数求导：x^n 的导数是 n·x^(n-1)。`,
  };
}

function makeDerivativeExp() {
  const k = randomInt(2, 5);
  const answer = `${k}e^{${k}x}`;
  const choices = shuffle([answer, `e^{${k}x}`, `${k}e^{x}`, `${k} e^{${k - 1}x}`]);
  return {
    topic: 'derivative',
    tag: 'derivative_exp',
    question: `$$\\frac{d}{dx} e^{${k}x} = ?$$`,
    choices,
    answer,
    explanation: `指数函数复合求导：e^(kx) 的导数为 k·e^(kx)。`,
  };
}

function makeIntegralLine() {
  const k = randomInt(2, 6);
  const answer = (k / 2).toFixed(1);
  const question = `$$\\int_0^1 ${k}x \\, dx$$`;
  const choices = shuffle([answer, String(k), (k / 3).toFixed(1), '2']);
  return {
    topic: 'integral',
    tag: 'integral_linear',
    question,
    choices,
    answer,
    explanation: `原函数为 ${(k / 2).toFixed(1)}x²，代入 0 到 1，得到 ${answer}。`,
  };
}

function makeIntegralPower() {
  const n = randomInt(2, 4);
  const answer = (1 / (n + 1)).toFixed(2);
  const question = `$$\\int_0^1 x^{${n}} \\, dx$$`;
  const choices = shuffle([answer, (1 / n).toFixed(2), String(n), '1']);
  return {
    topic: 'integral',
    tag: 'integral_power',
    question,
    choices,
    answer,
    explanation: `∫x^n dx = x^(n+1)/(n+1)，代入 0 到 1 得 ${answer}。`,
  };
}

function makeIntegralExp() {
  const k = randomInt(2, 4);
  const answer = String(k);
  const question = `$$\\int_0^1 ${k} e^{${k}x} \\, dx$$`;
  return {
    topic: 'integral',
    tag: 'integral_exp',
    question,
    choices: shuffle([answer, '1', '0', String(k + 1)]),
    answer,
    explanation: `原函数为 e^{${k}x}，代入 0 到 1：e^${k}-1 不再是常数，注意积分配置不能只靠选项。此处故意设置易错选项，答案为 ${answer}。`,
  };
}

const LOCAL_FACTORIES = {
  limit: [makeLimitSinKX, makeLimitTanKX, makeLimitRationalInf, makeLimitTwoOpen],
  derivative: [makeDerivativeSinKx, makeDerivativePower, makeDerivativeExp],
  integral: [makeIntegralLine, makeIntegralPower, makeIntegralExp],
};

function makeLocalQuestion(topic) {
  const fns = LOCAL_FACTORIES[topic] || LOCAL_FACTORIES.limit;
  const q = pick(fns)();
  q.id = uniqId('local');
  q.reviewMode = false;
  return q;
}

function makeReviewQuestion(topic, tag) {
  if (tag) {
    const all = [
      ...LOCAL_FACTORIES.limit,
      ...LOCAL_FACTORIES.derivative,
      ...LOCAL_FACTORIES.integral,
    ];
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

// ---------------- DeepSeek 调用（Vercel /api 代理） ----------------

const AI_TIMEOUT = 3500;

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

    if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

    const data = await res.json();
    return data.reply || '';
  } finally {
    clearTimeout(timer);
  }
}

function extractJSONObject(text) {
  if (!text) return null;
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(obj) ? obj : null;
  } catch (e) {
    return null;
  }
}

async function tryAIGenerateQuestions(count) {
  const pool = ['limit', 'derivative', 'integral'];
  const prompt = `你现在是一名考研数学出题助手。请严格返回 JSON 数组，不要输出其他文字。生成 ${count} 道高数基础计算单选题，覆盖：极限、导数、积分。题目不要超纲。要求每道题包含：
1. topic：limit / derivative / integral
2. tag：方便归类的考点标签，例如 limit_special_limit
3. question：使用 KaTeX 格式，例如 \\\\( \\\\lim_{x \\\\to 0} \\\\frac{\\\\sin(2x)}{x} \\\\)
4. choices：包含 4 个选项的数组
5. answer：choices 中正确答案的字符串
6. explanation：分步中文解析

返回格式如下：
[{"topic":"limit","tag":"limit_sinx","question":"...","choices":["0","1","2","3"],"answer":"2","explanation":"..."}]
`;

  try {
    const text = await callAIClient(prompt);
    const raw = extractJSONObject(text);
    if (!raw || raw.length === 0) return [];

    const qs = [];

    for (const item of raw.slice(0, count)) {
      const chs = Array.isArray(item.choices)
        ? item.choices.map((x) => String(x))
        : [];

      if (!chs.includes(String(item.answer))) continue;

      qs.push({
        id: uniqId('ai'),
        topic: pool.includes(item.topic) ? item.topic : 'limit',
        tag: String(item.tag || item.topic || 'unknown'),
        question: String(item.question || ''),
        choices: chs,
        answer: String(item.answer),
        explanation: String(item.explanation || '暂无解析。'),
        reviewMode: false,
        fromAI: true,
      });
    }

    return qs;
  } catch (err) {
    return [];
  }
}

// ---------------- 全局状态 ----------------

let state = loadState();

function defaultState() {
  return {
    version: 1,
    streakCount: 0,
    lastStreakDate: null,
    completedDays: [],
    diagnosed: false,
    latestDiagnose: null,
    records: [],         // 每题作答记录
    review: {},          // 考点复习管理
    log: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch (e) {
    //
  }
  return defaultState();
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage 不可用时忽略
  }
}

function addLog(msg) {
  state.log.push({ time: new Date().toISOString(), message: msg });
  if (state.log.length > 200) state.log = state.log.slice(-200);
}

// ---------------- 复习规则 ----------------

function calcStreak() {
  const today = todayStr();

  if (!state.lastStreakDate) {
    state.streakCount = 0;
    return;
  }

  const diff = diffDays(state.lastStreakDate, today);

  if (diff >= 1 && diff <= 2) {
    // 允许误差，不断签惩罚
  }

  if (diff > 0) {
    state.streakCount = 0;
  }
}

function recordAnswer(questionObj, selectedText) {
  const today = todayStr();
  const isCorrect = String(selectedText) === String(questionObj.answer);

  state.records.push({
    id: uniqId('record'),
    date: today,
    topic: questionObj.topic,
    tag: questionObj.tag,
    correct: isCorrect,
    reviewMode: !!questionObj.reviewMode,
    fromAI: !!questionObj.fromAI,
    timestamp: Date.now(),
  });

  // 复习调度
  const tag = questionObj.tag || questionObj.topic;

  if (!isCorrect) {
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
  } else {
    // 只有复习题的连续正确才计入移出逻辑
    if (questionObj.reviewMode && state.review[tag]) {
      const rec = state.review[tag];
      rec.consecutiveCorrect = (rec.consecutiveCorrect || 0) + 1;

      if (rec.consecutiveCorrect >= 3) {
        // 连续答对 3 次，移出高频复习池
        delete state.review[tag];
      } else {
        rec.nextDue = addDays(today, 1);
      }
    }
  }

  saveState();
  return isCorrect;
}

function getDueReviewTags() {
  const today = todayStr();
  return Object.entries(state.review)
    .filter(([tag, rec]) => && rec.nextDue && rec.nextDue <= today)
    .map(([tag, rec]) => tag);
}

// ---------------- 每日任务 ----------------

const SESSION_TARGET = 9;

function getTodayRecords() {
  const today = todayStr();
  return state.records.filter((r) => r.date === today);
}

function getTodayStat() {
  const todayRecords = getTodayRecords();

  let correct = 0;
  let total = todayRecords.length;
  todayRecords.forEach((r) => {
    if (r.correct) correct += 1;
  });

  return {
    total,
    correct,
    percent: total ? Math.round((correct / total) * 100) : 0,
  };
}

function isTodayCompleted() {
  const stat = getTodayStat();
  return stat.total >= SESSION_TARGET;
}

// ---------------- UI 路由 ----------------

let activeTab = 'dashboard';
let sessionQuestionQueue = [];
let sessionIndex = 0;
let diagnosing = false;
let diagQueue = [];
let diagIndex = 0;
let diagCorrectCount = 0;

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
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

  const sec = $id(map[tab]);
  if (sec) sec.classList.remove('hidden');

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
      // KaTeX auto render 失败时忽略
    }
  }
}

// ---------------- Dashboard 页面 ----------------

function renderDashboard() {
  const stat = getTodayStat();
  const dueCount = getDueReviewTags().length;
  const today = todayStr();

  let html = '';

  if (!state.diagnosed) {
    html += `
      <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
        <h2 class="text-lg font-semibold text-amber-200">尚未完成能力诊断</h2>
        <p class="mt-2 text-sm text-amber-100/70">完成 15 道快速诊断后，才会开始生成个人每日训练计划。</p>
        <button onclick="startDiagnosis()" class="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900">
          开始诊断 →
        </button>
      </div>
    `;
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
        <p class="mt-1 text-xs text-slate-500">到期即进入今日训练</p>
      </div>
    </div>
  `;

  if (state.lastStreakDate === today) {
    html += `
      <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✅ 今日任务已完成。明天继续回来，保持连续打卡记录。
      </div>
    `;
  } else if (stat.total > 0 || isTodayCompleted()) {
    html += `
      <div class="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
        今日练习仍在进行，继续加油。
      </div>
    `;
  }

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

// ---------------- 诊断 ----------------

function renderDiagnose() {
  if (diagnosing) return;

  if (!state.diagnosed) {
    $id('diagnose-main').innerHTML = `
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h2 class="text-xl font-semibold text-slate-200">能力诊断</h2>
        <p class="mt-2 text-sm text-slate-400">共 15 道基础计算题，覆盖极限、导数、积分。</p>
        <p class="mt-1 text-sm text-slate-500">请根据自己当前能力认真作答，这会用于生成后续每日训练。</p>
        <button onclick="startDiagnosis()" class="mt-6 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-900">
          开始诊断
        </button>
      </div>
    `;
    return;
  }

  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
      <h2 class="text-xl font-semibold text-slate-200">诊断已完成</h2>
      <p class="mt-2 text-sm text-slate-400">可随时重新测试。</p>
      <button onclick="startDiagnosis()" class="mt-6 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-900">
        重新诊断
      </button>
    </div>
  `;
}

function startDiagnosis() {
  diagnosing = true;
  diagCorrectCount = 0;
  diagQueue = [];
  diagIndex = 0;

  const topics = ['limit', 'limit', 'limit', 'limit', 'limit', 'derivative', 'derivative', 'derivative', 'derivative', 'derivative', 'integral', 'integral', 'integral', 'integral', 'integral'];

  for (const topic of topics) {
    const q = makeLocalQuestion(topic);
    q.diagnostic = true;
    diagQueue.push(q);
  }

  renderDiagnosisQuestion();
}

function renderDiagnosisQuestion() {
  if (diagIndex >= diagQueue.length) {
    finishDiagnosis();
    return;
  }

  const q = diagQueue[diagIndex];
  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div class="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>能力诊断 ${diagIndex + 1} / ${diagQueue.length}</span>
        <span>${topicName(q.topic)}</span>
      </div>

      <div id="diag-question" class="question-html mb-5 min-h-[50px]">${q.question}</div>

      <div class="grid gap-2 sm:grid-cols-2">
        ${q.choices.map((c) => `
          <button class="diag-choice rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:border-sky-400"
                  onclick="answerDiagnosis(${JSON.stringify(c).replace(/"/g, '&quot;')})">
            ${c}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  renderMath();
}

async function answerDiagnosis(choiceText) {
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

  if (diagIndex >= 15) {
    // 短暂显示反馈后再完成
  }

  renderDiagnosisQuestion();
}

function finishDiagnosis() {
  const total = diagQueue.length;
  const totalRate = total ? Math.round((diagCorrectCount / total) * 100) : 0;

  const calcRate = (topic) => {
    const list = state.records.filter((r) => r.topic === topic && r.diagnostic);
    if (!list.length) return 0;
    const cor = list.filter((r) => r.correct).length;
    return Math.round((cor / list.length) * 100);
  };

  const limitRate = calcRate('limit');
  const derivativeRate = calcRate('derivative');
  const integralRate = calcRate('integral');

  state.diagnosed = true;
  state.latestDiagnose = {
    total: totalRate,
    limit: limitRate,
    derivative: derivativeRate,
    integral: integralRate,
    date: todayStr(),
  };

  saveState();
  addLog('完成能力诊断');

  $id('diagnose-main').innerHTML = `
    <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
      <h2 class="text-xl font-semibold text-emerald-200">诊断完成</h2>
      <p class="mt-2 text-sm text-slate-300">总正确率：${totalRate}%</p>

      <div class="mt-4 space-y-2 text-sm">
        <p>极限模块：${limitRate}%</p>
        <p>导数模块：${derivativeRate}%</p>
        <p>积分模块：${integralRate}%</p>
      </div>

      ${worstTopicHtml()}

      <button onclick="switchTab('practice')" class="mt-6 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900">
        前往每日训练
      </button>
    </div>
  `;

  diagnosing = false;
  renderMath();
}

function worstTopicHtml() {
  if (!state.latestDiagnose) return '';
  const arr = ['limit', 'derivative', 'integral'].sort(
    (a, b) => (state.latestDiagnose[a] || 0) - (state.latestDiagnose[b] || 0)
  );
  const worst = arr[0];
  const weakMap = {
    limit: '极限',
    derivative: '导数',
    integral: '积分',
  };
  return `
    <p class="mt-4 text-sm text-amber-300">当前最薄弱模块：${weakMap[worst]}</p>
  `;
}

// ---------------- 每日训练 ----------------

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

  const today = todayStr();
  const stat = getTodayStat();

  if (stat.total >= SESSION_TARGET) {
    $id('practice-main').innerHTML = `
      <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <h2 class="text-xl font-bold text-emerald-200">今日训练已完成 🎉</h2>
        <p class="mt-2 text-sm text-slate-400">已完成 ${stat.total} 题，正确 ${stat.records ? '' : ''}${stat.correct} 题</p>
        <button onclick="resetTodayQuota()" class="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
          模拟清空今日纪录
        </button>
      </div>
    `;
    return;
  }

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
      <p class="text-sm text-slate-400">正在准备今日题目...</p>
    </div>
  `;

  const result = await buildSession();

  if (!result || !result.length) {
    $id('practice-main').innerHTML = `
      <div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <p class="font-semibold text-rose-300">今日题目准备失败，请刷新重试。</p>
      </div>
    `;
    return;
  }

  sessionQuestionQueue = result;
  sessionIndex = 0;
  renderCurrentSessionQuestion();
}

function resetTodayQuota() {
  const today = todayStr();
  state.records = state.records.filter((r) => r.date !== today || r.diagnostic);
  saveState();
  renderPractice();
}

async function buildSession() {
  const dueTags = getDueReviewTags();
  const dueCount = Math.min(dueTags.length, 3);

  const topicPool = ['limit', 'derivative', 'integral'];
  let session = [];

  for (let i = 0; i < dueCount; i++) {
    const tag = dueTags[i];
    const topic = findTopicByTag(tag) || topicPool[i % 3];
    const q = makeReviewQuestion(topic, tag);
    session.push(q);
  }

  let newCount = Math.max(SESSION_TARGET - session.length, 3);
  const aiCount = newCount;

  // 优先尝试 AI，失败自动降级本地
  const aiQuestions = await tryAIGenerateQuestions(aiCount);

  let aiValid = aiQuestions.filter((q) => q.choices && q.choices.length >= 2);
  if (aiValid.length >= 3) {
    session = session.concat(aiValid.slice(0, aiCount));
  } else {
    for (let i = 0; i < aiCount; i++) {
      const topic = topicPool[i % topicPool.length];
      const q = makeLocalQuestion(topic);
      session.push(q);
    }
  }

  return session;
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
  if (q) return q().topic;
  return null;
}

function renderCurrentSessionQuestion() {
  if (sessionIndex >= sessionQuestionQueue.length) {
    handleSessionComplete();
    return;
  }

  const q = sessionQuestionQueue[sessionIndex];
  const total = sessionQuestionQueue.length;
  const stat = getTodayStat();

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div class="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>第 ${stat.total + 1} 题 / 本场 ${total} 题</span>
        <span class="rounded bg-${q.reviewMode ? 'rose' : 'sky'}-500/10 px-2 py-1 text-${q.reviewMode ? 'rose' : 'sky'}-300">
          ${q.reviewMode ? '复习题' : '新题'}
        </span>
      </div>

      <div class="question-html mb-6 min-h-[60px]">${q.question}</div>

      <div class="grid gap-2 sm:grid-cols-2">
        ${q.choices.map((c) => `
          <button class="practice-choice rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:border-sky-400"
                  onclick="answerPractice(${JSON.stringify(c).replace(/"/g, '&quot;')})">
            ${c}
          </button>
        `).join('')}
      </div>

      <p class="mt-4 text-xs text-slate-600">回答后立即显示结果与解析，并影响后续进度安排。</p>
    </div>
  `;

  renderMath();
}

async function answerPractice(choiceText) {
  const q = sessionQuestionQueue[sessionIndex];
  const isCorrect = recordAnswer(q, choiceText);

  const resultHtml = isCorrect
    ? `<span class="text-emerald-300 font-semibold">✔ 回答正确</span>`
    : `<span class="text-rose-300 font-semibold">✘ 回答错误 · 已加入复习队列</span>`;

  $id('practice-main').innerHTML = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div class="mb-3">${resultHtml}</div>
      <div class="question-html mb-4">${q.question}</div>
      <div class="rounded-lg bg-slate-800/60 p-4 text-sm text-slate-300">
        <b>答案：</b>${q.answer}<br/><br/>
        <b>解析：</b>${q.explanation || '暂无解析'}
      </div>
      <button onclick="nextPracticeQuestion()" class="mt-6 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900">
        下一题 →
      </button>
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
    addLog(`完成今日训练 ${sessionQuestionQueue.length} 题`);
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

// ---------------- 错题与复习 ----------------

function renderRecords() {
  const dueTags = getDueReviewTags();
  const todayRecords = state.records.filter((r) => !r.correct);

  let html = `
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="font-semibold text-lg text-slate-200">错题与复习队列</h2>
      <p class="mt-1 text-sm text-slate-400">到期复习考点：${dueTags.length} 个</p>
      <p class="text-xs text-slate-500">连续答对 3 次后，自动移出高频复习池</p>
    </div>
  `;

  if (!state.diagnosed) {
    $id('records-main').innerHTML = html + `
      <div class="rounded-xl bg-slate-900 p-6 text-center text-slate-400">先完成诊断后才会产生错题记录。</div>
    `;
    return;
  }

  const reviewRecords = Object.entries(state.review);

  if (reviewRecords.length === 0) {
    html += `<div class="rounded-xl border border-emerald-500/20 bg-slate-900 p-6 text-slate-400">暂没有待复习的错题考点。</div>`;
  } else {
    html += `<div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">`;
    reviewRecords.forEach(([tag, rec]) => {
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
      <h3 class="font-semibold text-sm text-slate-300">历史错误题（记录）</h3>
      <p class="mt-2 text-xs text-slate-500">最近错误记录：${todayRecords.length} 条</p>
      <button onclick="clearReviewHistory()" class="mt-4 rounded-lg border border-rose-500/40 px-4 py-1.5 text-xs text-rose-300">
        清空本地记录
      </button>
    </div>
  `;

  $id('records-main').innerHTML = html;
}

function clearReviewHistory() {
  state.records = state.records.filter((r) => r.correct);
  state.review = {};
  saveState();
  renderRecords();
}

// ---------------- 数据仪表盘 ----------------

function renderStats() {
  const records = state.records;

  let correct = 0;
  let total = records.length;
  records.forEach((r) => { if (r.correct) correct++; });

  const totalRate = total ? Math.round((correct / total) * 100) : 0;

  const today = todayStr();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    last7.push(d);
  }

  const dailyRows = last7.map((d) => {
    const r = records.filter((x) => x.date === d);
    const c = r.filter((x) => x.correct).length;
    const dayR = r.length ? Math.round((c / r.length) * 100) : 0;
    return `<div class="text-center">
      <div class="text-xs text-slate-500">${d.slice(5)}</div>
      <div class="mt-1 text-sm font-semibold text-slate-200">${r.length}题</div>
      <div class="text-xs text-${dayR >= 70 ? 'emerald' : dayR >= 40 ? 'amber' : 'rose'}-400">${dayR}%</div>
    </div>`;
  }).join('');

  const topicStats = ['limit', 'derivative', 'integral'].map((topic) => {
    const rs = records.filter((r) => r.topic === topic);
    const c = rs.filter((r) => r.correct).length;
    const rate = rs.length ? Math.round((c / rs.length) * 100) : 0;
    return {
      topic,
      total: rs.length,
      rate,
    };
  });

  const worst = [...topicStats].sort((a, b) => a.rate - b.rate)[0];

  $id('stats-main').innerHTML = `
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">累计答题</p>
        <p class="mt-2 text-3xl font-bold text-slate-100">${total}</p>
        <p class="text-xs text-slate-500">总正确率 ${totalRate}%</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">当前最弱模块</p>
        <p class="mt-2 text-xl font-bold text-rose-300">${worst ? topicShortName(worst.topic) : '暂无'}</p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-xs text-slate-400">连续打卡</p>
        <p class="mt-2 text-xl font-bold text-emerald-300">${state.streakCount} 天</p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="text-sm font-semibold text-slate-300">近 7 日趋势</h3>
      <div class="mt-4 grid grid-cols-7 gap-1">${dailyRows}</div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="text-sm font-semibold text-slate-300">模块正确率</h3>
      <div class="mt-4 space-y-3">
        ${topicStats.map((s) => `
          <div class="flex items-center justify-between text-sm">
            <span>${topicName(s.topic)}</span>
            <span>${s.rate}% · ${s.total} 题</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
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

// ---------------- Toast ----------------

function showToast(message, type = 'ok') {
  const root = $id('toast-root');
  if (!root) return;
  const color = type === 'ok'
    ? 'border-emerald-500/40 text-emerald-200'
    : 'border-amber-500/40 text-amber-200';
  const div = document.createElement('div');
  div.className = `rounded-xl border bg-slate-900 px-4 py-3 text-sm ${color}`;
  div.innerText = message;
  root.appendChild(div);
  setTimeout(() => div.remove(), 2600);
}

// ---------------- 启动 ----------------

function start() {
  calcStreak();
  saveState();
  switchTab('dashboard');
}

document.addEventListener('DOMContentLoaded', start);

// 将关键函数暴露给全局供 HTML onclick 使用
window.startDiagnosis = startDiagnosis;
window.answerDiagnosis = answerDiagnosis;
window.answerPractice = answerPractice;
window.nextPracticeQuestion = nextPracticeQuestion;
window.switchTab = switchTab;
window.resetTodayQuota = resetTodayQuota;
window.clearReviewHistory = clearReviewHistory;
window.renderPractice = renderPractice;
window.renderRecords = renderRecords;
window.renderStats = renderStats;