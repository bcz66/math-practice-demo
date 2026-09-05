module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // =========================
  // Health check
  // =========================
  if (
    req.method === 'GET' &&
    req.query?.health === '1'
  ) {
    const configured =
      Boolean(process.env.DEEPSEEK_API_KEY);

    return res
      .status(configured ? 200 : 503)
      .json({
        ok: configured,
        service: 'deepseek'
      });
  }

  // =========================
  // Only allow POST
  // =========================
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({
        error: 'Method not allowed'
      });
  }

  const apiKey =
    process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        error:
          'DEEPSEEK_API_KEY is not configured.'
      });
  }

  const body =
    req.body || {};

  const action =
    body.action;

  try {
    if (action === 'generate') {
      const result =
        await generateQuestions(
          apiKey,
          body
        );

      return res
        .status(200)
        .json(result);
    }

    if (action === 'judge') {
      const result =
        await judgeAnswer(
          apiKey,
          body
        );

      return res
        .status(200)
        .json(result);
    }

    return res
      .status(400)
      .json({
        error: 'Unknown action'
      });

  } catch (error) {
    console.error(
      'DeepSeek API error:',
      error
    );

    return res
      .status(500)
      .json({
        error:
          error.message ||
          'DeepSeek request failed'
      });
  }
};


// =======================================================
// DeepSeek request
// =======================================================

async function callDeepSeek(
  apiKey,
  messages,
  maxTokens = 5000
) {
  const response =
    await fetch(
      'https://api.deepseek.com/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${apiKey}`
        },

        body:
          JSON.stringify({
            model:
              'deepseek-v4-flash',

            messages,

            response_format: {
              type:
                'json_object'
            },

            temperature:
              0.5,

            max_tokens:
              maxTokens
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `DeepSeek HTTP ${response.status}`
    );
  }

  const content =
    data?.choices?.[0]
      ?.message?.content;

  if (!content) {
    throw new Error(
      'DeepSeek returned empty content.'
    );
  }

  try {
    return JSON.parse(content);

  } catch {
    const cleaned =
      content
        .replace(
          /^```json\s*/i,
          ''
        )
        .replace(
          /```$/i,
          ''
        )
        .trim();

    return JSON.parse(cleaned);
  }
}


// =======================================================
// Generate questions
// =======================================================

async function generateQuestions(
  apiKey,
  body
) {
  const {
    count = 9,

    modules = [
      'limit',
      'derivative',
      'integral'
    ],

    distribution = {},

    focusModules = [],

    topics = [],

    avoidPrompts = [],

    difficultyByModule = {},

    purpose = 'daily'

  } = body;

  const prompt = `
你是一名中国考研数学高等数学基础训练出题器。

请生成 ${count} 道基础计算题。

只允许以下模块：

limit = 极限
derivative = 导数
integral = 积分

本次允许模块：
${JSON.stringify(modules)}

训练用途：
${purpose}

模块数量要求：
${JSON.stringify(distribution)}

优先训练模块：
${JSON.stringify(focusModules)}

薄弱考点：
${JSON.stringify(topics)}

当前模块难度：
${JSON.stringify(difficultyByModule)}

请避免与以下题目重复：
${JSON.stringify(avoidPrompts.slice(0, 10))}

要求：

1. 只训练考研高数基础计算能力。
2. 不出现线性代数、概率论、证明题和大型综合题。
3. 难度范围为 1 到 5。
4. 每道题必须具有明确标准答案。
5. 错题复习时必须生成同考点变式题，而不是重复原题。
6. 数学表达式使用 LaTeX。
7. 不定积分必须考虑积分常数 C。
8. solution 必须简洁解释关键步骤。
9. 不要输出 Markdown。
10. 严格输出 JSON。

JSON 格式：

{
  "questions": [
    {
      "id": "optional",
      "module": "limit",
      "topic": "等价无穷小",
      "difficulty": 2,
      "prompt": "题目",
      "answer": "标准答案",
      "solution": "解析",
      "keySteps": [
        "步骤1",
        "步骤2"
      ]
    }
  ]
}
`;

  const result =
    await callDeepSeek(
      apiKey,

      [
        {
          role: 'system',

          content:
            '你负责生成可靠、可核验的中国考研高数基础计算题。必须严格返回 JSON。'
        },

        {
          role: 'user',

          content:
            prompt
        }
      ],

      7000
    );

  if (
    !Array.isArray(
      result.questions
    )
  ) {
    throw new Error(
      'Invalid questions returned by DeepSeek.'
    );
  }

  return {
    questions:
      result.questions.slice(
        0,
        count
      )
  };
}


// =======================================================
// Judge answer
// =======================================================

async function judgeAnswer(
  apiKey,
  body
) {
  const {
    question,
    userAnswer
  } = body;

  if (
    !question ||
    typeof userAnswer !==
      'string'
  ) {
    throw new Error(
      'Missing question or user answer.'
    );
  }

  const prompt = `
你是一名考研数学答案等价性判题器。

你的任务不是比较字符串，
而是判断学生答案和标准答案在数学意义上是否等价。

题目：

${question.prompt}

模块：

${question.module}

考点：

${question.topic}

标准答案：

${question.answer}

参考解析：

${question.solution}

学生答案：

${userAnswer}

判题规则：

1. 必须按照数学意义判断，不能因为字符串不同判错。

例如：

1/2
0.5
二分之一
50%

在相应数学语境下应视为等价。

2. 必须忽略：

- 普通空格
- 全角空格
- 括号格式差异
- LaTeX 与普通文本差异

例如：

2x/(1+x^2)

和

2x / (1 + x^2)

完全等价。

3. 必须识别代数等价。

例如：

2x/(1+x^2)

和

2x/(x^2+1)

应判为正确。

4. 必须识别等价因式分解形式。

例如：

e^x(x^2+2x)

和

x e^x(x+2)

数学上等价，应判正确。

5. 不定积分：

如果学生答案与标准答案仅相差积分常数，
应视为正确。

6. 如果学生使用中文表达一个明确数学值，
也应该根据数学意义判断。

例如：

二分之一 = 1/2

7. 不允许仅通过字符串完全匹配进行判断。

8. 若无法可靠确认数学等价，
不要猜测。

严格返回：

{
  "correct": true,
  "feedback": "简短说明"
}

或：

{
  "correct": false,
  "feedback": "简短说明错误原因"
}
`;

  const result =
    await callDeepSeek(
      apiKey,

      [
        {
          role: 'system',

          content:
            '你是严谨的高等数学答案等价性判题器。你的任务是判断数学等价关系，而不是字符串匹配。严格返回 JSON。'
        },

        {
          role: 'user',

          content:
            prompt
        }
      ],

      1200
    );

  return {
    correct:
      Boolean(
        result.correct
      ),

    feedback:
      String(
        result.feedback ||
        ''
      )
  };
}