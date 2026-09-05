(() => {
  'use strict';

  const STORAGE_KEY = 'calcDaily.v1';

  const MODULES = {
    limit: {
      label: '极限',
      color: '#c96545'
    },
    derivative: {
      label: '导数',
      color: '#627a66'
    },
    integral: {
      label: '积分',
      color: '#88705c'
    }
  };

  const DEFAULT_STATE = {
    version: 1,

    profile: {
      diagnosed: false,
      diagnosisCompletedAt: null,

      levelByModule: {
        limit: 1,
        derivative: 1,
        integral: 1
      }
    },

    stats: {
      attempts: 0,
      correct: 0,

      byModule: {
        limit: {
          attempts: 0,
          correct: 0
        },

        derivative: {
          attempts: 0,
          correct: 0
        },

        integral: {
          attempts: 0,
          correct: 0
        }
      },

      byTopic: {}
    },

    reviews: [],

    history: [],

    checkins: [],

    activeSession: null,

    dailyMeta: {
      lastCompletedDate: null
    }
  };

  let state = loadState();

  let currentView = 'dashboard';

  let apiHealthy = null;

  const $ = (id) => document.getElementById(id);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return deepClone(DEFAULT_STATE);
      }

      const parsed =
        JSON.parse(raw);

      return {
        ...deepClone(DEFAULT_STATE),
        ...parsed,

        profile: {
          ...deepClone(DEFAULT_STATE.profile),
          ...(parsed.profile || {})
        },

        stats: {
          ...deepClone(DEFAULT_STATE.stats),
          ...(parsed.stats || {}),

          byModule: {
            ...deepClone(DEFAULT_STATE.stats.byModule),
            ...((parsed.stats || {}).byModule || {})
          },

          byTopic: {
            ...((parsed.stats || {}).byTopic || {})
          }
        }
      };

    } catch (error) {
      console.warn(
        'LocalStorage 数据损坏，已重置。',
        error
      );

      return deepClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  function todayISO() {
    const d = new Date();

    const y =
      d.getFullYear();

    const m =
      String(d.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(d.getDate())
        .padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  function addDaysISO(days) {
    const d = new Date();

    d.setHours(
      12,
      0,
      0,
      0
    );

    d.setDate(
      d.getDate() + days
    );

    const y =
      d.getFullYear();

    const m =
      String(d.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(d.getDate())
        .padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  function dateOffsetISO(offset) {
    const d = new Date();

    d.setHours(
      12,
      0,
      0,
      0
    );

    d.setDate(
      d.getDate() + offset
    );

    const y =
      d.getFullYear();

    const m =
      String(d.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(d.getDate())
        .padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  function formatDateCN(
    date = new Date()
  ) {
    return new Intl.DateTimeFormat(
      'zh-CN',
      {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }
    ).format(date);
  }

  function uid(
    prefix = 'q'
  ) {
    return (
      `${prefix}_` +
      `${Date.now().toString(36)}_` +
      `${Math.random().toString(36).slice(2, 8)}`
    );
  }

  function clamp(
    n,
    min,
    max
  ) {
    return Math.min(
      max,
      Math.max(
        min,
        n
      )
    );
  }

  function accuracy(
    correct,
    attempts
  ) {
    return attempts
      ? Math.round(
          (correct / attempts) * 100
        )
      : null;
  }

  function escapeHTML(
    value = ''
  ) {
    return String(value)
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      );
  }

  function moduleLabel(key) {
    return (
      MODULES[key]?.label ||
      key
    );
  }

  function topicKey(
    question
  ) {
    return (
      `${question.module}:` +
      `${question.topic || '综合基础'}`
    );
  }

  async function typesetMath(
    container = document.body
  ) {
    try {
      if (
        window.MathJax
          ?.typesetPromise
      ) {
        await window.MathJax
          .typesetPromise(
            [container]
          );
      }

    } catch (error) {
      console.warn(
        'MathJax 渲染失败',
        error
      );
    }
  }

  function toast(message) {
    const el =
      $('toast');

    el.textContent =
      message;

    el.classList.remove(
      'opacity-0',
      'translate-y-3'
    );

    el.classList.add(
      'opacity-100',
      'translate-y-0'
    );

    clearTimeout(
      toast._timer
    );

    toast._timer =
      setTimeout(
        () => {
          el.classList.add(
            'opacity-0',
            'translate-y-3'
          );

          el.classList.remove(
            'opacity-100',
            'translate-y-0'
          );
        },
        2200
      );
  }

  async function apiCall(
    action,
    payload = {}
  ) {
    const response =
      await fetch(
        '/api/deepseek',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              action,
              ...payload
            })
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (!response.ok) {
      throw new Error(
        data.error ||
        `AI 请求失败 (${response.status})`
      );
    }

    return data;
  }

  async function checkApiHealth() {
    try {
      const res =
        await fetch(
          '/api/deepseek?health=1',
          {
            cache: 'no-store'
          }
        );

      apiHealthy =
        res.ok;

    } catch {
      apiHealthy =
        false;
    }

    renderApiStatus();
  }

  function renderApiStatus() {
    const text =
      $('apiStatusText');

    const dot =
      $('apiStatusDot');

    if (
      !text ||
      !dot
    ) {
      return;
    }

    if (
      apiHealthy === true
    ) {
      text.textContent =
        'DeepSeek 已连接';

      dot.className =
        'h-2 w-2 rounded-full bg-emerald-500';

    } else if (
      apiHealthy === false
    ) {
      text.textContent =
        '未连接，使用本地备用题';

      dot.className =
        'h-2 w-2 rounded-full bg-amber-400';

    } else {
      text.textContent =
        '检测中';

      dot.className =
        'h-2 w-2 rounded-full bg-amber-400';
    }
  }

  const FALLBACK_BANK = [

    {
      module: 'limit',
      topic: '等价无穷小',
      difficulty: 1,

      prompt:
        '计算极限：\\(\\lim_{x\\to 0} \\frac{\\sin 3x}{x}\\)',

      answer:
        '3',

      solution:
        '利用 \\(\\sin u \\sim u\\)：\\(\\sin 3x \\sim 3x\\)，因此极限为 \\(3\\)。'
    },

    {
      module: 'limit',
      topic: '重要极限',
      difficulty: 2,

      prompt:
        '计算极限：\\(\\lim_{x\\to 0} \\frac{1-\\cos x}{x^2}\\)',

      answer:
        '1/2',

      solution:
        '利用 \\(1-\\cos x=2\\sin^2(x/2)\\)，得到极限 \\(\\frac12\\)。'
    },

    {
      module: 'limit',
      topic: '洛必达法则',
      difficulty: 2,

      prompt:
        '计算极限：\\(\\lim_{x\\to 0} \\frac{e^x-1-x}{x^2}\\)',

      answer:
        '1/2',

      solution:
        '可用泰勒展开 \\(e^x=1+x+\\frac{x^2}{2}+o(x^2)\\)，故极限为 \\(\\frac12\\)。'
    },

    {
      module: 'derivative',
      topic: '复合函数求导',
      difficulty: 1,

      prompt:
        '求导：\\(y=\\ln(1+x^2)\\)',

      answer:
        '2x/(1+x^2)',

      solution:
        '链式法则：\\(y\\prime=\\frac{1}{1+x^2}\\cdot2x=\\frac{2x}{1+x^2}\\)。'
    },

    {
      module: 'derivative',
      topic: '乘积法则',
      difficulty: 2,

      prompt:
        '求导：\\(y=x^2e^x\\)',

      answer:
        'e^x(x^2+2x)',

      solution:
        '乘积法则：\\(y\\prime=2xe^x+x^2e^x=e^x(x^2+2x)\\)。'
    },

    {
      module: 'derivative',
      topic: '隐函数求导',
      difficulty: 2,

      prompt:
        '已知 \\(x^2+y^2=1\\)，求 \\(\\frac{dy}{dx}\\)。',

      answer:
        '-x/y',

      solution:
        '两边对 \\(x\\) 求导：\\(2x+2yy\\prime=0\\)，故 \\(y\\prime=-x/y\\)。'
    },

    {
      module: 'integral',
      topic: '基本积分',
      difficulty: 1,

      prompt:
        '计算不定积分：\\(\\int (3x^2+2x)\\,dx\\)',

      answer:
        'x^3+x^2+C',

      solution:
        '逐项积分得到 \\(x^3+x^2+C\\)。'
    },

    {
      module: 'integral',
      topic: '换元积分',
      difficulty: 2,

      prompt:
        '计算不定积分：\\(\\int 2x\\cos(x^2)\\,dx\\)',

      answer:
        'sin(x^2)+C',

      solution:
        '令 \\(u=x^2\\)，则 \\(du=2x\\,dx\\)，积分为 \\(\\sin u+C=\\sin(x^2)+C\\)。'
    },

    {
      module: 'integral',
      topic: '分部积分',
      difficulty: 2,

      prompt:
        '计算不定积分：\\(\\int xe^x\\,dx\\)',

      answer:
        'e^x(x-1)+C',

      solution:
        '分部积分：取 \\(u=x,dv=e^x dx\\)，得 \\(xe^x-e^x+C=e^x(x-1)+C\\)。'
    }
  ];

  function buildFallbackQuestions({
    count = 9,
    modules = [
      'limit',
      'derivative',
      'integral'
    ],
    topics = []
  } = {}) {

    let pool =
      FALLBACK_BANK.filter(
        q =>
          modules.includes(
            q.module
          )
      );

    if (
      topics.length
    ) {
      const topicSet =
        new Set(topics);

      const matched =
        pool.filter(
          q =>
            topicSet.has(
              q.topic
            )
        );

      if (
        matched.length
      ) {
        pool =
          matched.concat(
            pool.filter(
              q =>
                !topicSet.has(
                  q.topic
                )
            )
          );
      }
    }

    const result = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const base =
        pool[
          i %
          pool.length
        ];

      result.push({
        ...base,

        id:
          uid('fallback'),

        source:
          'fallback'
      });
    }

    return result;
  }

  async function generateQuestions(
    options
  ) {
    try {
      const data =
        await apiCall(
          'generate',
          options
        );

      if (
        !Array.isArray(
          data.questions
        ) ||
        !data.questions.length
      ) {
        throw new Error(
          'AI 返回题目为空'
        );
      }

      apiHealthy =
        true;

      renderApiStatus();

      return data.questions
        .map(
          q => ({
            id:
              q.id ||
              uid('ai'),

            module:
              [
                'limit',
                'derivative',
                'integral'
              ].includes(
                q.module
              )
                ? q.module
                : 'limit',

            topic:
              q.topic ||
              '综合基础',

            difficulty:
              clamp(
                Number(
                  q.difficulty
                ) || 1,
                1,
                5
              ),

            prompt:
              q.prompt ||
              '',

            answer:
              q.answer ||
              '',

            solution:
              q.solution ||
              '',

            keySteps:
              Array.isArray(
                q.keySteps
              )
                ? q.keySteps
                : [],

            source:
              'ai'
          })
        );

    } catch (error) {
      console.warn(
        error
      );

      apiHealthy =
        false;

      renderApiStatus();

      toast(
        'AI 暂不可用，已切换到本地备用题'
      );

      return buildFallbackQuestions(
        options
      );
    }
  }

  function normalizeAnswer(
    value
  ) {
    return String(
      value ||
      ''
    )
      .toLowerCase()

      .replace(
        /\\left|\\right/g,
        ''
      )

      .replace(
        /\\,/g,
        ''
      )

      .replace(
        /\s+/g,
        ''
      )

      .replace(
        /[{}]/g,
        ''
      )

      .replace(
        /＋/g,
        '+'
      )

      .replace(
        /−/g,
        '-'
      )

      .replace(
        /×/g,
        '*'
      )

      .replace(
        /\\frac/g,
        'frac'
      )

      .replace(
        /\^\(?1\)?/g,
        ''
      )

      .replace(
        /\+c$/i,
        '+c'
      );
  }

  async function judgeAnswer(
    question,
    userAnswer
  ) {
    if (
      !String(
        userAnswer ||
        ''
      ).trim()
    ) {
      return {
        correct: false,
        feedback:
          '你还没有填写答案。'
      };
    }

    try {
      if (
        question.source ===
        'ai'
      ) {
        const data =
          await apiCall(
            'judge',
            {
              question: {
                module:
                  question.module,

                topic:
                  question.topic,

                prompt:
                  question.prompt,

                answer:
                  question.answer,

                solution:
                  question.solution
              },

              userAnswer
            }
          );

        apiHealthy =
          true;

        renderApiStatus();

        return {
          correct:
            Boolean(
              data.correct
            ),

          feedback:
            data.feedback ||
            ''
        };
      }

    } catch (error) {
      console.warn(
        'AI 判题失败，使用本地宽松比较',
        error
      );

      apiHealthy =
        false;

      renderApiStatus();
    }

    const a =
      normalizeAnswer(
        userAnswer
      );

    const b =
      normalizeAnswer(
        question.answer
      );

    const correct =
      a === b ||
      (
        b.includes(
          '+c'
        ) &&
        a.replace(
          '+c',
          ''
        ) ===
        b.replace(
          '+c',
          ''
        )
      );

    return {
      correct,

      feedback:
        correct
          ? '答案与参考答案一致。'
          : `本地判题未匹配。参考答案：${question.answer}`
    };
  }

  function recordAttempt(
    question,
    correct,
    mode,
    userAnswer
  ) {
    state.stats.attempts +=
      1;

    if (
      correct
    ) {
      state.stats.correct +=
        1;
    }

    const moduleStat =
      state.stats.byModule[
        question.module
      ] ||
      (
        state.stats.byModule[
          question.module
        ] = {
          attempts: 0,
          correct: 0
        }
      );

    moduleStat.attempts +=
      1;

    if (
      correct
    ) {
      moduleStat.correct +=
        1;
    }

    const key =
      topicKey(
        question
      );

    const topicStat =
      state.stats.byTopic[
        key
      ] ||
      (
        state.stats.byTopic[
          key
        ] = {
          module:
            question.module,

          topic:
            question.topic ||
            '综合基础',

          attempts:
            0,

          correct:
            0
        }
      );

    topicStat.attempts +=
      1;

    if (
      correct
    ) {
      topicStat.correct +=
        1;
    }

    state.history.unshift({
      id:
        uid('h'),

      at:
        new Date()
          .toISOString(),

      date:
        todayISO(),

      mode,

      module:
        question.module,

      topic:
        question.topic,

      prompt:
        question.prompt,

      correct,

      userAnswer
    });

    state.history =
      state.history.slice(
        0,
        150
      );
  }

  function findReviewForQuestion(
    question
  ) {
    const key =
      topicKey(
        question
      );

    return state.reviews
      .find(
        r =>
          r.key === key
      );
  }

  function handleWrongReviewScheduling(
    question,
    isReviewMode = false
  ) {
    const key =
      topicKey(
        question
      );

    let item =
      state.reviews.find(
        r =>
          r.key === key
      );

    if (
      !item
    ) {
      item = {
        id:
          uid('r'),

        key,

        module:
          question.module,

        topic:
          question.topic ||
          '综合基础',

        wrongCount:
          0,

        correctStreak:
          0,

        highFreq:
          true,

        dueAt:
          null,

        lastWrongAt:
          null,

        examplePrompts:
          []
      };

      state.reviews.push(
        item
      );
    }

    item.wrongCount +=
      1;

    item.correctStreak =
      0;

    item.highFreq =
      true;

    item.lastWrongAt =
      todayISO();

    item.examplePrompts = [
      question.prompt,

      ...(
        item.examplePrompts ||
        []
      )
    ].slice(
      0,
      5
    );

    /*
      规则：

      首次错误：
      2 天后复习。

      再次错误：
      5 天后复习。
    */

    item.dueAt =
      addDaysISO(
        item.wrongCount ===
        1
          ? 2
          : 5
      );
  }

  function handleCorrectReviewScheduling(
    question
  ) {
    const item =
      findReviewForQuestion(
        question
      );

    if (
      !item
    ) {
      return;
    }

    item.correctStreak =
      (
        item.correctStreak ||
        0
      ) + 1;

    if (
      item.correctStreak >=
      3
    ) {
      item.highFreq =
        false;

      item.dueAt =
        null;

    } else {

      /*
        为完成
        “连续答对 3 次”
        的验证，

        正确后仍安排
        2 天后的短间隔复习。
      */

      item.dueAt =
        addDaysISO(
          2
        );
    }
  }

  function dueReviews() {
    const today =
      todayISO();

    return state.reviews
      .filter(
        r =>
          r.highFreq &&
          r.dueAt &&
          r.dueAt <=
            today
      );
  }

  function computeStreak() {
    const set =
      new Set(
        state.checkins
      );

    let cursor =
      new Date();

    cursor.setHours(
      12,
      0,
      0,
      0
    );

    const today =
      todayISO();

    const yesterday =
      dateOffsetISO(
        -1
      );

    if (
      !set.has(today) &&
      !set.has(yesterday)
    ) {
      return 0;
    }

    if (
      !set.has(today)
    ) {
      cursor.setDate(
        cursor.getDate() -
        1
      );
    }

    let streak =
      0;

    while (
      true
    ) {
      const y =
        cursor.getFullYear();

      const m =
        String(
          cursor.getMonth() +
          1
        ).padStart(
          2,
          '0'
        );

      const d =
        String(
          cursor.getDate()
        ).padStart(
          2,
          '0'
        );

      const key =
        `${y}-${m}-${d}`;

      if (
        !set.has(
          key
        )
      ) {
        break;
      }

      streak +=
        1;

      cursor.setDate(
        cursor.getDate() -
        1
      );
    }

    return streak;
  }

  function todayDailyAttempts() {
    return state.history
      .filter(
        h =>
          h.date ===
            todayISO() &&
          h.mode ===
            'daily'
      )
      .length;
  }

  function switchView(
    view
  ) {
    currentView =
      view;

    $$('.view')
      .forEach(
        el =>
          el.classList.add(
            'hidden'
          )
      );

    $(
      `view-${view}`
    )?.classList.remove(
      'hidden'
    );

    $$('.nav-btn')
      .forEach(
        btn =>
          btn.classList.toggle(
            'active',
            btn.dataset.viewTarget ===
              view
          )
      );

    const meta = {

      dashboard: [
        'Overview',
        '今天也只做一点点。',
        '把极限、导数、积分拆成每天 8–12 道的小剂量训练。'
      ],

      diagnosis: [
        'Diagnosis',
        '先知道自己卡在哪里。',
        '摸底只决定起始难度，不给你贴“水平高低”的标签。'
      ],

      daily: [
        'Daily practice',
        '今天的任务已经准备好。',
        '少量、持续、针对薄弱点，比偶尔猛刷更有用。'
      ],

      review: [
        'Review',
        '错题不是收藏品。',
        '到期时做同考点变式题，让“会了”经得起换题。'
      ],

      checkin: [
        'Consistency',
        '把连续性看得比单日强度更重要。',
        '这里记录的是你真正完成整组每日训练的日期。'
      ]

    }[view];

    $('pageEyebrow')
      .textContent =
        meta[0];

    $('pageTitle')
      .textContent =
        meta[1];

    $('pageSubtitle')
      .textContent =
        meta[2];

    if (
      view ===
      'dashboard'
    ) {
      renderDashboard();
    }

    if (
      view ===
      'review'
    ) {
      renderReviewQueue();
    }

    if (
      view ===
      'checkin'
    ) {
      renderCheckin();
    }

    if (
      view ===
      'diagnosis'
    ) {
      renderDiagnosisIntro();
    }

    if (
      view ===
      'daily'
    ) {
      renderDailyIntro();
    }

    if (
      window.innerWidth <
      1024
    ) {
      $('sideNav')
        ?.classList.add(
          'hidden'
        );
    }
  }

  function renderDashboard() {
    $('todayDone')
      .textContent =
        todayDailyAttempts();

    const completedToday =
      state.checkins.includes(
        todayISO()
      );

    $('todayStatus')
      .textContent =
        completedToday
          ? '已打卡'
          : '未完成';

    $('todayStatus')
      .className =
        completedToday

          ? (
            'rounded-full ' +
            'bg-sageSoft ' +
            'px-2.5 py-1 ' +
            'text-[11px] ' +
            'font-medium ' +
            'text-sage'
          )

          : (
            'rounded-full ' +
            'bg-[#f1f0ec] ' +
            'px-2.5 py-1 ' +
            'text-[11px] ' +
            'text-muted'
          );

    $('streakCount')
      .textContent =
        computeStreak();

    $('dueReviewCount')
      .textContent =
        dueReviews()
          .length;

    $('overallAccuracy')
      .textContent =
        state.stats.attempts

          ? (
            `${accuracy(
              state.stats.correct,
              state.stats.attempts
            )}%`
          )

          : '—';

    const moduleWrap =
      $('moduleAccuracyList');

    moduleWrap.innerHTML =
      Object.entries(
        MODULES
      )
        .map(
          (
            [
              key,
              config
            ]
          ) => {

            const s =
              state.stats
                .byModule[
                  key
                ];

            const acc =
              accuracy(
                s.correct,
                s.attempts
              );

            const width =
              acc ??
              0;

            return `
              <div>

                <div
                  class="flex items-center
                         justify-between text-sm">

                  <div
                    class="flex items-center
                           gap-2">

                    <span
                      class="h-2 w-2 rounded-full"
                      style="background:${config.color}">
                    </span>

                    <span>
                      ${config.label}
                    </span>

                  </div>

                  <span
                    class="text-xs text-muted">

                    ${
                      acc === null
                        ? '暂无数据'
                        : `${acc}% · ${s.attempts}题`
                    }

                  </span>

                </div>

                <div
                  class="mt-2.5 h-1.5
                         overflow-hidden rounded-full
                         bg-[#efede8]">

                  <div
                    class="h-full rounded-full
                           transition-all"
                    style="
                      width:${width}%;
                      background:${config.color};
                    ">
                  </div>

                </div>

              </div>
            `;
          }
        )
        .join('');

    const weak =
      Object.values(
        state.stats.byTopic
      )
        .filter(
          t =>
            t.attempts >=
            1
        )
        .map(
          t => ({
            ...t,

            errorRate:
              1 -
              t.correct /
              t.attempts
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.errorRate -
              a.errorRate ||
            b.attempts -
              a.attempts
        )
        .slice(
          0,
          5
        );

    $('weakTopicList')
      .innerHTML =
        weak.length

          ? weak
            .map(
              (
                t,
                i
              ) => `
                <div
                  class="flex items-center gap-3
                         rounded-xl border border-line
                         px-3.5 py-3">

                  <span
                    class="grid h-7 w-7 shrink-0
                           place-items-center rounded-full
                           bg-[#f1f0ec]
                           text-xs text-muted">

                    ${i + 1}

                  </span>

                  <div
                    class="min-w-0 flex-1">

                    <div
                      class="truncate text-sm font-medium">

                      ${escapeHTML(
                        t.topic
                      )}

                    </div>

                    <div
                      class="mt-0.5 text-xs text-muted">

                      ${
                        moduleLabel(
                          t.module
                        )
                      }
                      ·
                      错误率
                      ${
                        Math.round(
                          t.errorRate *
                          100
                        )
                      }%
                      ·
                      ${t.attempts}
                      次

                    </div>

                  </div>

                </div>
              `
            )
            .join('')

          : emptyState(
              '还没有薄弱考点数据',
              '完成几道题后，这里会自动排序。'
            );

    const history =
      state.history
        .slice(
          0,
          6
        );

    $('recentHistory')
      .innerHTML =
        history.length

          ? history
            .map(
              h => `
                <div
                  class="flex items-start gap-3">

                  <span
                    class="mt-1.5 h-2 w-2
                           shrink-0 rounded-full
                           ${
                             h.correct
                               ? 'bg-emerald-500'
                               : 'bg-clay'
                           }">
                  </span>

                  <div
                    class="min-w-0 flex-1">

                    <div
                      class="truncate text-sm">

                      ${
                        escapeHTML(
                          h.topic ||
                          moduleLabel(
                            h.module
                          )
                        )
                      }

                    </div>

                    <div
                      class="mt-0.5 text-xs text-muted">

                      ${
                        h.correct
                          ? '答对'
                          : '答错'
                      }

                      ·

                      ${
                        modeLabel(
                          h.mode
                        )
                      }

                      ·

                      ${
                        new Date(
                          h.at
                        )
                          .toLocaleString(
                            'zh-CN',
                            {
                              month:
                                'numeric',

                              day:
                                'numeric',

                              hour:
                                '2-digit',

                              minute:
                                '2-digit'
                            }
                          )
                      }

                    </div>

                  </div>

                </div>
              `
            )
            .join('')

          : emptyState(
              '还没有做题记录',
              '第一次训练完成后会出现在这里。'
            );

    const due =
      dueReviews()
        .length;

    if (
      !state.profile
        .diagnosed
    ) {
      $('nextActionTitle')
        .textContent =
          '先做一次能力诊断';

      $('nextActionText')
        .textContent =
          '用 9 道基础题估算你在极限、导数、积分三个模块的起点。';

      $('nextActionBtn')
        .textContent =
          '开始诊断';

      $('nextActionBtn')
        .dataset.target =
          'diagnosis';

    } else if (
      due >
      0
    ) {
      $('nextActionTitle')
        .textContent =
          `${due} 个考点已经到期`;

      $('nextActionText')
        .textContent =
          '优先清掉到期复习，再开始今天的新题。';

      $('nextActionBtn')
        .textContent =
          '去复习';

      $('nextActionBtn')
        .dataset.target =
          'review';

    } else {
      $('nextActionTitle')
        .textContent =
          completedToday
            ? '今天已经完成'
            : '开始今日刷题';

      $('nextActionText')
        .textContent =
          completedToday
            ? '保持节奏即可，不需要为了打卡无限加题。'
            : '今天生成 9 道基础计算题，重点照顾近期薄弱模块。';

      $('nextActionBtn')
        .textContent =
          completedToday
            ? '查看统计'
            : '开始刷题';

      $('nextActionBtn')
        .dataset.target =
          completedToday
            ? 'checkin'
            : 'daily';
    }

    renderSidebarReviewBadge();

    typesetMath(
      $('view-dashboard')
    );
  }

  function emptyState(
    title,
    text
  ) {
    return `
      <div
        class="rounded-xl border border-dashed
               border-line bg-[#faf9f6]
               px-4 py-5 text-center">

        <div
          class="text-sm font-medium">
          ${title}
        </div>

        <div
          class="mt-1 text-xs text-muted">
          ${text}
        </div>

      </div>
    `;
  }

  function modeLabel(
    mode
  ) {
    return (
      {
        diagnosis:
          '诊断',

        daily:
          '每日',

        review:
          '复习'
      }[mode] ||
      mode
    );
  }

  function renderSidebarReviewBadge() {
    const count =
      dueReviews()
        .length;

    const badge =
      $('sidebarReviewCount');

    badge.textContent =
      count;

    badge.classList
      .toggle(
        'hidden',
        count === 0
      );
  }

  function renderDiagnosisIntro() {
    const summary =
      $('diagnosisSummary');

    if (
      state.profile
        .diagnosed
    ) {
      summary
        .classList
        .remove(
          'hidden'
        );

      summary.innerHTML = `
        <div class="font-medium">
          上次诊断已完成
        </div>

        <div
          class="mt-2 grid gap-2 sm:grid-cols-3">

          ${
            Object.entries(
              state.profile
                .levelByModule
            )
              .map(
                (
                  [
                    m,
                    level
                  ]
                ) => `
                  <div
                    class="rounded-lg bg-white
                           px-3 py-2 text-xs">

                    <span class="text-muted">
                      ${moduleLabel(m)}
                    </span>

                    <span
                      class="float-right font-medium">
                      Lv.${level}
                    </span>

                  </div>
                `
              )
              .join('')
          }

        </div>
      `;

      $('startDiagnosisBtn')
        .textContent =
          '重新诊断';

    } else {
      summary
        .classList
        .add(
          'hidden'
        );

      $('startDiagnosisBtn')
        .textContent =
          '开始能力诊断';
    }
  }

  function renderDailyIntro() {
    const levels =
      state.profile
        .levelByModule;

    $('dailyPlanHint')
      .textContent =
        state.profile
          .diagnosed

          ? (
            `当前难度：` +
            `极限 Lv.${levels.limit} · ` +
            `导数 Lv.${levels.derivative} · ` +
            `积分 Lv.${levels.integral}`
          )

          : (
            '尚未诊断，将以基础难度开始'
          );

    const active =
      state.activeSession;

    if (
      active?.mode ===
        'daily' &&
      active.date ===
        todayISO() &&
      active.index <
        active.questions.length
    ) {
      $('startDailyBtn')
        .textContent =
          `继续今日刷题 · ${active.index + 1}/${active.questions.length}`;

    } else if (
      state.checkins.includes(
        todayISO()
      )
    ) {
      $('startDailyBtn')
        .textContent =
          '今天已完成，再练一组';

    } else {
      $('startDailyBtn')
        .textContent =
          '开始今日刷题';
    }
  }

  function makeSession(
    mode,
    questions,
    reviewKeys = []
  ) {
    state.activeSession = {
      id:
        uid('s'),

      mode,

      date:
        todayISO(),

      questions,

      reviewKeys,

      index:
        0,

      results:
        [],

      startedAt:
        new Date()
          .toISOString(),

      completed:
        false
    };

    saveState();

    return state.activeSession;
  }

  async function startDiagnosis() {
    setButtonLoading(
      $('startDiagnosisBtn'),
      true,
      '生成诊断题…'
    );

    const questions =
      await generateQuestions({
        count:
          9,

        modules: [
          'limit',
          'derivative',
          'integral'
        ],

        distribution: {
          limit:
            3,

          derivative:
            3,

          integral:
            3
        },

        difficultyByModule: {
          limit:
            2,

          derivative:
            2,

          integral:
            2
        },

        purpose:
          'diagnosis'
      });

    setButtonLoading(
      $('startDiagnosisBtn'),
      false
    );

    makeSession(
      'diagnosis',
      questions
    );

    $('diagnosisIntro')
      .classList.add(
        'hidden'
      );

    $('diagnosisSession')
      .classList.remove(
        'hidden'
      );

    renderActiveSession(
      'diagnosisSession'
    );
  }

  function weakestModules() {
    return Object.keys(
      MODULES
    )
      .sort(
        (
          a,
          b
        ) => {

          const sa =
            state.stats
              .byModule[
                a
              ];

          const sb =
            state.stats
              .byModule[
                b
              ];

          const aa =
            sa.attempts
              ? (
                sa.correct /
                sa.attempts
              )
              : 0.5;

          const ab =
            sb.attempts
              ? (
                sb.correct /
                sb.attempts
              )
              : 0.5;

          return (
            aa -
            ab
          );
        }
      );
  }

  async function startDaily() {
    const active =
      state.activeSession;

    if (
      active?.mode ===
        'daily' &&
      active.date ===
        todayISO() &&
      active.index <
        active.questions.length
    ) {
      $('dailyIntro')
        .classList.add(
          'hidden'
        );

      $('dailySession')
        .classList.remove(
          'hidden'
        );

      renderActiveSession(
        'dailySession'
      );

      return;
    }

    setButtonLoading(
      $('startDailyBtn'),
      true,
      '生成今日题目…'
    );

    const weak =
      weakestModules();

    const weakTopics =
      Object.values(
        state.stats.byTopic
      )
        .filter(
          t =>
            t.attempts >
              0 &&
            t.correct /
              t.attempts <
              0.75
        )
        .sort(
          (
            a,
            b
          ) =>
            (
              a.correct /
              a.attempts
            ) -
            (
              b.correct /
              b.attempts
            )
        )
        .slice(
          0,
          5
        )
        .map(
          t =>
            t.topic
        );

    const questions =
      await generateQuestions({
        count:
          9,

        modules: [
          'limit',
          'derivative',
          'integral'
        ],

        focusModules:
          weak.slice(
            0,
            2
          ),

        topics:
          weakTopics,

        difficultyByModule:
          state.profile
            .levelByModule,

        purpose:
          'daily'
      });

    setButtonLoading(
      $('startDailyBtn'),
      false
    );

    makeSession(
      'daily',
      questions
    );

    $('dailyIntro')
      .classList.add(
        'hidden'
      );

    $('dailySession')
      .classList.remove(
        'hidden'
      );

    renderActiveSession(
      'dailySession'
    );
  }

  function renderReviewQueue() {
    const due =
      dueReviews();

    $('startReviewBtn')
      .disabled =
        due.length ===
        0;

    $('startReviewBtn')
      .classList.toggle(
        'opacity-40',
        due.length ===
          0
      );

    $('startReviewBtn')
      .textContent =
        due.length

          ? `开始复习 · ${due.length}`

          : '暂无到期复习';

    const active =
      state.activeSession;

    if (
      active?.mode ===
        'review' &&
      active.index <
        active.questions.length
    ) {
      $('reviewSession')
        .classList.remove(
          'hidden'
        );

      renderActiveSession(
        'reviewSession'
      );

    } else {
      $('reviewSession')
        .classList.add(
          'hidden'
        );
    }

    const sorted =
      state.reviews
        .filter(
          r =>
            r.highFreq
        )
        .sort(
          (
            a,
            b
          ) =>
            String(
              a.dueAt ||
              '9999'
            )
              .localeCompare(
                String(
                  b.dueAt ||
                  '9999'
                )
              )
        );

    $('reviewQueueList')
      .innerHTML =
        sorted.length

          ? sorted
            .map(
              r => {

                const isDue =
                  r.dueAt &&
                  r.dueAt <=
                    todayISO();

                return `
                  <article
                    class="
                      rounded-2xl border
                      ${
                        isDue
                          ? 'border-[#dfb09f] bg-[#fffaf7]'
                          : 'border-line bg-white'
                      }
                      p-4 shadow-soft
                    ">

                    <div
                      class="flex items-start
                             justify-between gap-3">

                      <div>

                        <div
                          class="text-xs text-muted">

                          ${
                            moduleLabel(
                              r.module
                            )
                          }

                        </div>

                        <div
                          class="mt-1 text-sm font-semibold">

                          ${
                            escapeHTML(
                              r.topic
                            )
                          }

                        </div>

                      </div>

                      <span
                        class="
                          rounded-full
                          px-2.5 py-1
                          text-[11px]
                          ${
                            isDue
                              ? 'bg-claySoft text-clay'
                              : 'bg-[#f1f0ec] text-muted'
                          }
                        ">

                        ${
                          isDue
                            ? '已到期'
                            : `复习于 ${r.dueAt || '—'}`
                        }

                      </span>

                    </div>

                    <div
                      class="mt-4 grid grid-cols-2
                             gap-2 text-xs text-muted">

                      <div
                        class="rounded-lg
                               bg-[#f7f6f2]
                               p-2.5">

                        累计做错

                        <strong
                          class="float-right text-ink">
                          ${r.wrongCount}
                        </strong>

                      </div>

                      <div
                        class="rounded-lg
                               bg-[#f7f6f2]
                               p-2.5">

                        连续答对

                        <strong
                          class="float-right text-ink">
                          ${r.correctStreak}/3
                        </strong>

                      </div>

                    </div>

                  </article>
                `;
              }
            )
            .join('')

          : emptyState(
              '高频复习队列是空的',
              '答错的考点会自动进入这里。'
            );

    renderSidebarReviewBadge();
  }

  async function startReview() {
    const due =
      dueReviews();

    if (
      !due.length
    ) {
      return;
    }

    setButtonLoading(
      $('startReviewBtn'),
      true,
      '生成变式题…'
    );

    const questions =
      [];

    for (
      const review
      of due
    ) {
      const generated =
        await generateQuestions({
          count:
            1,

          modules: [
            review.module
          ],

          topics: [
            review.topic
          ],

          avoidPrompts:
            review.examplePrompts ||
            [],

          difficultyByModule: {
            [review.module]:
              state.profile
                .levelByModule[
                  review.module
                ] ||
              2
          },

          purpose:
            'review-variant'
        });

      const q =
        generated[0];

      q.reviewKey =
        review.key;

      questions.push(
        q
      );
    }

    setButtonLoading(
      $('startReviewBtn'),
      false
    );

    makeSession(
      'review',
      questions,
      due.map(
        r =>
          r.key
      )
    );

    $('reviewSession')
      .classList.remove(
        'hidden'
      );

    renderActiveSession(
      'reviewSession'
    );
  }

  function renderActiveSession(
    containerId
  ) {
    const session =
      state.activeSession;

    const container =
      $(containerId);

    if (
      !session ||
      !container
    ) {
      return;
    }

    if (
      session.completed ||
      session.index >=
        session.questions.length
    ) {
      renderSessionComplete(
        container,
        session
      );

      return;
    }

    const q =
      session.questions[
        session.index
      ];

    const progress =
      Math.round(
        (
          session.index /
          session.questions.length
        ) *
        100
      );

    const review =
      q.reviewKey

        ? state.reviews.find(
            r =>
              r.key ===
              q.reviewKey
          )

        : null;

    container.innerHTML = `
      <div
        class="mx-auto max-w-3xl question-enter">

        <div
          class="mb-4 flex items-center
                 justify-between gap-3
                 text-xs text-muted">

          <span>
            ${modeLabel(session.mode)}
            ·
            ${session.index + 1}/${session.questions.length}
          </span>

          <span>
            ${moduleLabel(q.module)}
            ·
            ${escapeHTML(q.topic)}
            ·
            Lv.${q.difficulty}
          </span>

        </div>

        <div
          class="h-1 overflow-hidden
                 rounded-full bg-[#e9e6e0]">

          <div
            class="h-full rounded-full
                   bg-clay transition-all"
            style="width:${progress}%">
          </div>

        </div>

        <article
          class="mt-5 rounded-2xl
                 border border-line
                 bg-white p-6 shadow-soft
                 sm:p-8">

          ${
            review
              ? `
                <div
                  class="mb-5 inline-flex
                         rounded-full bg-claySoft
                         px-3 py-1
                         text-xs font-medium text-clay">

                  变式复习
                  ·
                  连续答对
                  ${review.correctStreak}/3

                </div>
              `
              : ''
          }

          <div
            class="text-xs font-medium uppercase
                   tracking-[.12em] text-muted">
            Question
          </div>

          <div
            class="mt-4 text-lg leading-9
                   sm:text-xl">

            ${q.prompt}

          </div>

          <label
            class="mt-8 block
                   text-xs font-medium text-muted"
            for="answerInput">

            你的答案

          </label>

          <textarea
            id="answerInput"
            rows="2"
            placeholder="可输入普通数学表达式，例如 1/2、2x/(1+x^2)、x^2+C"
            class="mt-2 w-full resize-none
                   rounded-xl border border-line
                   bg-[#fbfaf7]
                   px-4 py-3.5 text-base
                   transition
                   focus:border-[#b7afa5]
                   focus:bg-white">
          </textarea>

          <div
            class="mt-4 flex flex-wrap
                   items-center justify-between
                   gap-3">

            <div
              class="text-[11px] text-muted">

              AI 判题仅作辅助，
              必要时以教材/标准答案为准。

            </div>

            <button
              id="submitAnswerBtn"
              class="rounded-xl bg-ink
                     px-5 py-2.5
                     text-sm font-medium text-white
                     hover:opacity-90">

              提交答案

            </button>

          </div>

          <div
            id="answerFeedback"
            class="mt-6 hidden">
          </div>

        </article>

      </div>
    `;

    $('submitAnswerBtn')
      .addEventListener(
        'click',
        () =>
          submitCurrentAnswer(
            containerId
          )
      );

    $('answerInput')
      .addEventListener(
        'keydown',
        event => {

          if (
            (
              event.ctrlKey ||
              event.metaKey
            ) &&
            event.key ===
              'Enter'
          ) {
            submitCurrentAnswer(
              containerId
            );
          }
        }
      );

    typesetMath(
      container
    );
  }

  async function submitCurrentAnswer(
    containerId
  ) {
    const session =
      state.activeSession;

    if (
      !session ||
      session.completed
    ) {
      return;
    }

    const q =
      session.questions[
        session.index
      ];

    const input =
      $('answerInput');

    const userAnswer =
      input.value.trim();

    const button =
      $('submitAnswerBtn');

    if (
      !userAnswer
    ) {
      toast(
        '先写一个答案'
      );

      input.focus();

      return;
    }

    setButtonLoading(
      button,
      true,
      '判题中…'
    );

    input.disabled =
      true;

    const verdict =
      await judgeAnswer(
        q,
        userAnswer
      );

    setButtonLoading(
      button,
      false
    );

    recordAttempt(
      q,
      verdict.correct,
      session.mode,
      userAnswer
    );

    if (
      session.mode ===
      'review'
    ) {
      if (
        verdict.correct
      ) {
        handleCorrectReviewScheduling(
          q
        );

      } else {
        handleWrongReviewScheduling(
          q,
          true
        );
      }

    } else if (
      !verdict.correct
    ) {
      handleWrongReviewScheduling(
        q,
        false
      );
    }

    session.results.push({
      questionId:
        q.id,

      correct:
        verdict.correct,

      userAnswer,

      at:
        new Date()
          .toISOString()
    });

    saveState();

    const feedback =
      $('answerFeedback');

    feedback.classList
      .remove(
        'hidden'
      );

    feedback.innerHTML = `
      <div
        class="
          rounded-xl border p-4
          ${
            verdict.correct
              ? 'border-[#cddccf] bg-[#f6faf6]'
              : 'border-[#e7c4b7] bg-[#fff9f6]'
          }
        ">

        <div
          class="
            flex items-center gap-2
            text-sm font-semibold
            ${
              verdict.correct
                ? 'text-sage'
                : 'text-clay'
            }
          ">

          <span>
            ${
              verdict.correct
                ? '✓'
                : '×'
            }
          </span>

          <span>
            ${
              verdict.correct
                ? '答对了'
                : '这题需要再看一下'
            }
          </span>

        </div>

        <div
          class="mt-3 text-sm
                 leading-7 text-ink">

          <span class="text-muted">
            参考答案：
          </span>

          ${escapeHTML(q.answer)}

        </div>

        ${
          verdict.feedback
            ? `
              <div
                class="mt-2 text-sm
                       leading-6 text-muted">

                ${
                  escapeHTML(
                    verdict.feedback
                  )
                }

              </div>
            `
            : ''
        }

        <details
          class="mt-4 rounded-lg border
                 border-line bg-white
                 px-3.5 py-3">

          <summary
            class="cursor-pointer
                   text-sm font-medium">

            查看解析

          </summary>

          <div
            class="mt-3 text-sm
                   leading-7 text-muted">

            ${
              q.solution ||
              '暂无解析。'
            }

          </div>

        </details>

        <div
          class="mt-4 flex justify-end">

          <button
            id="nextQuestionBtn"
            class="rounded-xl bg-ink
                   px-4 py-2.5
                   text-sm font-medium text-white
                   hover:opacity-90">

            ${
              session.index + 1 >=
              session.questions.length

                ? '查看结果'

                : '下一题'
            }

          </button>

        </div>

      </div>
    `;

    button.classList.add(
      'hidden'
    );

    $('nextQuestionBtn')
      .addEventListener(
        'click',
        () => {

          session.index +=
            1;

          if (
            session.index >=
            session.questions.length
          ) {
            finishSession(
              session
            );
          }

          saveState();

          renderActiveSession(
            containerId
          );
        }
      );

    typesetMath(
      feedback
    );

    renderSidebarReviewBadge();
  }

  function finishSession(
    session
  ) {
    session.completed =
      true;

    session.completedAt =
      new Date()
        .toISOString();

    if (
      session.mode ===
      'diagnosis'
    ) {
      const byModule =
        {};

      session.questions
        .forEach(
          (
            q,
            idx
          ) => {

            const result =
              session.results[
                idx
              ];

            if (
              !byModule[
                q.module
              ]
            ) {
              byModule[
                q.module
              ] = {
                total: 0,
                correct: 0
              };
            }

            byModule[
              q.module
            ].total +=
              1;

            if (
              result?.correct
            ) {
              byModule[
                q.module
              ].correct +=
                1;
            }
          }
        );

      Object.keys(
        MODULES
      )
        .forEach(
          m => {

            const s =
              byModule[m] || {
                total: 0,
                correct: 0
              };

            const ratio =
              s.total
                ? (
                  s.correct /
                  s.total
                )
                : 0;

            state.profile
              .levelByModule[
                m
              ] =
                ratio >= 0.8
                  ? 3
                  : ratio >= 0.5
                    ? 2
                    : 1;
          }
        );

      state.profile.diagnosed =
        true;

      state.profile
        .diagnosisCompletedAt =
          new Date()
            .toISOString();
    }

    if (
      session.mode ===
      'daily'
    ) {
      if (
        !state.checkins
          .includes(
            todayISO()
          )
      ) {
        state.checkins.push(
          todayISO()
        );
      }

      state.dailyMeta
        .lastCompletedDate =
          todayISO();

      state.checkins.sort();
    }

    saveState();
  }

  function renderSessionComplete(
    container,
    session
  ) {
    const correctCount =
      session.results
        .filter(
          r =>
            r.correct
        )
        .length;

    const total =
      session.questions.length;

    const rate =
      total
        ? Math.round(
            correctCount /
            total *
            100
          )
        : 0;

    const mode =
      session.mode;

    let extra =
      '';

    if (
      mode ===
      'diagnosis'
    ) {
      extra = `
        <div
          class="mt-5 grid gap-2
                 sm:grid-cols-3">

          ${
            Object.entries(
              state.profile
                .levelByModule
            )
              .map(
                (
                  [
                    m,
                    l
                  ]
                ) => `
                  <div
                    class="rounded-xl
                           bg-[#f7f6f2]
                           p-3 text-sm">

                    <span class="text-muted">
                      ${moduleLabel(m)}
                    </span>

                    <span
                      class="float-right
                             font-semibold">
                      Lv.${l}
                    </span>

                  </div>
                `
              )
              .join('')
          }

        </div>
      `;

    } else if (
      mode ===
      'daily'
    ) {
      extra = `
        <div
          class="mt-5 rounded-xl
                 bg-sageSoft
                 px-4 py-3
                 text-sm text-sage">

          ✓ 今日打卡已记录。
          连续 ${computeStreak()} 天。

        </div>
      `;

    } else {
      const remaining =
        state.reviews
          .filter(
            r =>
              r.highFreq
          )
          .length;

      extra = `
        <div
          class="mt-5 rounded-xl
                 bg-[#f7f6f2]
                 px-4 py-3
                 text-sm text-muted">

          当前仍有
          ${remaining}
          个考点处于高频复习队列。

        </div>
      `;
    }

    container.innerHTML = `
      <div
        class="mx-auto max-w-2xl
               rounded-2xl border border-line
               bg-white p-7 text-center
               shadow-soft sm:p-9">

        <div
          class="
            mx-auto grid h-12 w-12
            place-items-center rounded-full
            ${
              rate >= 70
                ? 'bg-sageSoft text-sage'
                : 'bg-claySoft text-clay'
            }
            text-xl
          ">

          ${
            rate >= 70
              ? '✓'
              : '↗'
          }

        </div>

        <h2
          class="mt-5 text-2xl
                 font-semibold tracking-tight">

          这一组完成了。

        </h2>

        <p
          class="mt-2 text-sm text-muted">

          ${correctCount}/${total}
          正确 ·
          正确率 ${rate}%

        </p>

        ${extra}

        <div
          class="mt-7 flex flex-wrap
                 justify-center gap-2">

          <button
            class="rounded-xl border border-line
                   bg-white px-4 py-2.5
                   text-sm font-medium
                   hover:bg-[#faf9f6]"
            data-complete-target="dashboard">

            回到仪表盘

          </button>

          <button
            class="rounded-xl bg-ink
                   px-4 py-2.5
                   text-sm font-medium text-white
                   hover:opacity-90"
            data-complete-target="${
              mode === 'diagnosis'
                ? 'daily'
                : mode === 'daily'
                  ? 'review'
                  : 'dashboard'
            }">

            ${
              mode === 'diagnosis'
                ? '开始今日刷题'
                : mode === 'daily'
                  ? '查看错题复习'
                  : '完成'
            }

          </button>

        </div>

      </div>
    `;

    container
      .querySelectorAll(
        '[data-complete-target]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () => {

              state.activeSession =
                null;

              saveState();

              if (
                mode ===
                'diagnosis'
              ) {
                $('diagnosisSession')
                  .classList.add(
                    'hidden'
                  );

                $('diagnosisIntro')
                  .classList.remove(
                    'hidden'
                  );
              }

              if (
                mode ===
                'daily'
              ) {
                $('dailySession')
                  .classList.add(
                    'hidden'
                  );

                $('dailyIntro')
                  .classList.remove(
                    'hidden'
                  );
              }

              if (
                mode ===
                'review'
              ) {
                $('reviewSession')
                  .classList.add(
                    'hidden'
                  );
              }

              switchView(
                btn.dataset
                  .completeTarget
              );
            }
          )
      );

    renderDashboard();
  }

  function renderCheckin() {
    $('checkinStreak')
      .textContent =
        computeStreak();

    const dates =
      Array.from(
        {
          length: 28
        },
        (
          _,
          i
        ) =>
          dateOffsetISO(
            i -
            27
          )
      );

    const set =
      new Set(
        state.checkins
      );

    $('monthCheckinCount')
      .textContent =
        `${
          dates.filter(
            d =>
              set.has(d)
          ).length
        } 次打卡`;

    $('checkinGrid')
      .innerHTML =
        dates
          .map(
            d => {

              const hit =
                set.has(d);

              const date =
                new Date(
                  `${d}T12:00:00`
                );

              return `
                <div
                  title="${d}"
                  class="
                    aspect-square rounded-lg border
                    ${
                      hit
                        ? 'border-sage/20 bg-sage text-white'
                        : 'border-line bg-[#faf9f6] text-muted'
                    }
                    grid place-items-center
                    text-[11px]
                  ">

                  ${
                    date.getDate()
                  }

                </div>
              `;
            }
          )
          .join('');
  }

  function setButtonLoading(
    button,
    loading,
    label = '处理中…'
  ) {
    if (
      !button
    ) {
      return;
    }

    if (
      loading
    ) {
      button.dataset
        .originalText =
          button.textContent;

      button.textContent =
        label;

      button.disabled =
        true;

      button.classList.add(
        'opacity-60'
      );

    } else {
      button.textContent =
        button.dataset
          .originalText ||
        button.textContent;

      button.disabled =
        false;

      button.classList.remove(
        'opacity-60'
      );
    }
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      event => {

        const target =
          event.target.closest(
            '[data-view-target]'
          );

        if (
          target
        ) {
          switchView(
            target.dataset
              .viewTarget
          );
        }
      }
    );

    $('mobileMenuBtn')
      ?.addEventListener(
        'click',
        () =>
          $('sideNav')
            .classList.toggle(
              'hidden'
            )
      );

    $('startDiagnosisBtn')
      ?.addEventListener(
        'click',
        startDiagnosis
      );

    $('startDailyBtn')
      ?.addEventListener(
        'click',
        startDaily
      );

    $('startReviewBtn')
      ?.addEventListener(
        'click',
        startReview
      );

    $('nextActionBtn')
      ?.addEventListener(
        'click',
        () =>
          switchView(
            $('nextActionBtn')
              .dataset.target ||
            'daily'
          )
      );

    $('resetDataBtn')
      ?.addEventListener(
        'click',
        () => {

          if (
            !confirm(
              '确定清空本浏览器中的全部刷题记录吗？这个操作无法撤销。'
            )
          ) {
            return;
          }

          localStorage.removeItem(
            STORAGE_KEY
          );

          state =
            deepClone(
              DEFAULT_STATE
            );

          toast(
            '本地数据已重置'
          );

          switchView(
            'dashboard'
          );
        }
      );
  }

  function init() {
    $('todayLabel')
      .textContent =
        formatDateCN();

    bindEvents();

    renderApiStatus();

    switchView(
      'dashboard'
    );

    checkApiHealth();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {
    init();
  }

})();