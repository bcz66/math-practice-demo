# CalcDaily · Adaptive v3 Full

CalcDaily 是一个面向中国考研高等数学学习者的自适应每日刷题 Web App 学生作品集项目。

这一版的目标不是“删掉旧界面再做一套新的”，而是在原有 CalcDaily 功能上做增量完善：原来的数据仪表盘、最近记录、能力诊断、每日刷题、错题复习队列、2 天 / 5 天复习调度、连续 3 次答对退出高频复习、打卡统计、AI 判题、LocalStorage、DeepSeek 状态检测与数据重置都保留；同时加入 L1–L12、连续 Ability θ、动态难度、固定难度、手动起点、训练模式、Topic Mastery、错误类型权重、Confidence、Difficulty Evaluator、未来 Anchor Calibration 接口和手机端公式修复。

## 文件结构

```text
math-practice-demo/
├── index.html
├── app.js
├── api/
│   └── deepseek.js
├── README.md
└── plan.md
```

本版本需要完整替换：

- `index.html`
- `app.js`
- `api/deepseek.js`
- `README.md`

`plan.md` 可以继续保留原文件。

不需要 npm，不需要数据库，也不需要修改 Vercel 环境变量名称。仍使用：

```text
DEEPSEEK_API_KEY
```

## 原有功能保留检查

- 数据仪表盘
- 今日完成题数
- 连续打卡
- 待复习数量
- 累计正确率
- 极限 / 导数 / 积分模块表现
- 薄弱考点
- 最近作答记录
- 能力诊断入口与诊断结果摘要
- 每日刷题
- AI 数学等价判题
- 错题复习
- 可视化复习队列
- 首次错题 2 天后复习
- 再次做错 5 天后复习
- 复习连续答对 3 次退出高频队列
- 28 天打卡统计
- DeepSeek API 状态
- LocalStorage 本地学习记录
- 重置本地数据

## 新增：L1–L12 临时难度体系

当前版本使用 provisional Soft Anchor：

- L1–L3：教材基础到熟练
- L4–L6：考研基础到标准
- L7–L9：考研中上到高难
- L10–L12：竞赛型微积分计算与技巧挑战

它目前不是经过真实考研 / 大学生数学竞赛题库统计校准的权威标尺。

以后加入真实 Anchor 后，只更新 Calibration Layer，不重写自适应引擎。

## 用户能力不直接用整数 Level 计算

每个模块独立保存连续能力值：

```text
Limit Ability       θ = 7.36
Derivative Ability  θ = 6.82
Integral Ability    θ = 7.91
```

Level 主要用于 UI 显示。

核心预测函数：

```text
P(correct) = 1 / (1 + exp(-0.9 * (theta - b)))
```

其中：

- `theta`：用户能力
- `b`：题目难度

动态学习率：

```text
K(n) = 0.15 + 0.35 * exp(-n / 30)
```

能力更新：

```text
theta_new = theta_old + K * (R - P) * W
```

- `R = 1`：答对
- `R = 0`：答错
- `W`：题目用途 / 错误类型权重

因此：高于当前能力很多的题答对会明显提高 Ability；明显低于当前能力的题答错会明显降低 Ability；高难题答错只轻微影响能力。

## Level 防横跳

显示等级使用缓冲区，而不是简单 `round(theta)`。

例如当前 Lv.7，不会因为 `7.49 → 7.51 → 7.48` 在 Lv.7 / Lv.8 之间来回变化。

内部 Ability 可以超过 12，界面显示 `Lv.12+`，为后续真实竞赛 Anchor 留出空间。

## 自适应能力诊断

诊断不是每个人固定答 9 道或 20 道。

每个模块从中间难度开始，早期使用较大的探测步长：

```text
L6 ✓ → 向 L8 探测
L8 ✓ → 向 L10 探测
L10 ✗ → 回到 L9 附近收缩区间
```

系统同时维护 Ability 与 Confidence。通常每个模块约 5–8 道，达到足够稳定的置信度就结束；若结果不稳定则继续到上限。

测评只是建议。用户可以完全跳过。

## 手动难度与固定难度

“难度设置”里可以分别设置：

```text
极限       Lv.1–12
导数       Lv.1–12
积分       Lv.1–12
```

两种核心模式：

### 动态自适应

手动等级可以作为初始 Ability。之后系统继续根据真实表现修正。

### 固定难度

始终按用户指定 Level 出题，不因答对或答错自动升降。

## 训练模式

- 均衡自适应：巩固 + 当前能力 + 少量挑战
- 基础巩固：增加低一档题目
- 考研冲刺：增加薄弱点与中高难训练
- 高阶挑战：增加高于当前 Ability 的挑战题

每日题量支持：8 / 10 / 12。

## 每日训练动态调度

自适应模式下不会一次把整天题单难度写死。

每完成一道题后：

```text
作答
→ 更新 Ability / Topic Mastery
→ 分析最近状态
→ 选择巩固 / 主训练 / 挑战 / 到期复习
→ 决定下一道题难度
```

固定模式不会修改用户 Ability，仅记录正确率与考点表现。

## Topic Mastery

总体模块 Ability 与具体考点能力分开。

例如：

```text
Integral Ability = 7.4

换元积分       8.1
分部积分       7.6
有理函数积分   6.4
反常积分       5.8
```

每日训练会优先考虑薄弱考点，而不是只看“积分 Lv.7”。

## 错误类型

答错后可标记：

- 不会做
- 方法想错
- 计算粗心
- 输入失误

不同错误对 Ability 的影响不同。

输入失误会撤销本题对 Ability、正确率和错题队列的影响。

## 错题复习

保留原来的简单间隔复习：

- 首次做错 → 2 天后
- 再次做错 → 5 天后
- 复习连续答对 3 次 → 退出高频复习

错题复习对总体 Ability 降权，避免系统专门练弱点后又用这些弱点过度降低总等级；但 Topic Mastery 仍正常更新。

## 久未练习

久未练习不会直接降低 Ability，只降低有效 Confidence。

系统之后通过验证题重新确认用户是否仍维持原水平。

## AI 难度评估

生成题目的 AI 不拥有最终难度解释权。

流程：

```text
Target Difficulty
→ DeepSeek Generator
→ Candidate Question
→ Independent Difficulty Evaluator
→ provisionalDifficulty
→ Calibration Layer
→ calibratedDifficulty
```

评估维度包括：

- Recognition Difficulty
- Technique Depth
- Calculation Complexity
- Knowledge Coupling

## 手机端数学公式

题目优先使用结构化字段：

```json
{
  "instruction": "计算极限",
  "expression": "\\lim_{x\\to0}\\frac{\\sin 3x}{2x}"
}
```

前端统一用 MathJax display mode 渲染，并给长公式设置独立横向滚动区域，避免手机页面出现裸 `\\lim` / `\\frac` 或整页被公式撑宽。

同时保留对旧 `prompt` / 裸 LaTeX 的兼容处理。

## 未来 Anchor Calibration

当前浏览器控制台暴露：

```js
CalcDailyCalibration.apply([
  { provisional: 2, real: 2.0 },
  { provisional: 4, real: 3.7 },
  { provisional: 6, real: 5.4 },
  { provisional: 8, real: 7.2 },
  { provisional: 10, real: 9.5 },
  { provisional: 12, real: 12.0 }
], 'v1-anchor');
```

以上数字只是接口示例，不是真实难度标准。

未来拿到真实 Anchor 后，可以换成真实映射点。

重置临时模型：

```js
CalcDailyCalibration.reset();
```

导出当前数据：

```js
CalcDailyCalibration.exportData();
```

历史记录会保存：

- `requestedDifficulty`
- `provisionalDifficulty`
- `calibratedDifficulty`
- `difficultyModelVersion`
- `difficultyConfidence`
- `difficultyDimensions`
- `abilityBefore`
- `abilityAfter`

因此以后可以重新校准，而不是推翻自适应系统。

## LocalStorage

新版主键：

```text
calcDaily.v2
```

首次加载会尝试迁移旧：

```text
calcDaily.v1
```

当前还没有账号系统，清除浏览器站点数据仍可能丢失学习记录。

## 部署

保持现有 Vercel 部署即可。

Vercel Environment Variables：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

不要把 API Key 写进 `app.js`、`index.html` 或 GitHub。

## 建议测试顺序

1. 首页确认 DeepSeek 已连接。
2. 检查原有 Dashboard：今日进度、打卡、待复习、正确率、模块表现、薄弱考点、最近记录均存在。
3. 手机打开极限 / 导数 / 积分题，确认公式为正常数学排版。
4. 做能力诊断：连续答对应明显上探，遇错后回落收缩。
5. 诊断结束后确认三个模块分别显示 Ability / Level / Confidence。
6. 难度设置中手动设置 Level，并选择“作为自适应起点”。
7. 切换固定难度，确认连续答对 / 答错不会修改 Level。
8. 切回动态自适应，做高于当前 Ability 的题，确认 Ability 更新。
9. 做错后分别测试“计算粗心”和“输入失误”。
10. 检查错题是否进入可视化复习队列，且显示下一次复习日期。
11. 完成每日训练，确认打卡统计保留。
12. 检查“最近记录”是否继续展示最新作答。

## 当前边界

- L1–L12 仍是 provisional scale，不应宣传为已经经过真实考研 / 竞赛题库校准。
- AI 出题、难度评估和判题仍可能出错。
- 当前仍仅覆盖高数中的极限、导数、积分训练。
- 当前仍使用 LocalStorage，没有账号和云端同步。


## v3.1 修复

- 修复页面切换时把所有 `.view` 隐藏后无法重新显示当前页面的问题。
- 原因：`$()` 封装使用 `getElementById`，但 `switchView()` 误传入了带 `#` 的 CSS 选择器。
- 修复后 Dashboard、能力诊断、每日刷题、错题复习、打卡统计和难度设置均可正常切换显示。

## v3.2 出题速度优化

在不改变原有页面和自适应难度逻辑的前提下，优化 AI 出题等待：

- 进入“能力诊断 / 每日刷题”页面时后台预热第一题。
- 用户阅读和作答当前题时，后台推测性预取下一题；实际结果不匹配时会自动丢弃，避免牺牲自适应准确性。
- 判题完成后立即继续后台准备下一题，点击“下一题”优先复用已生成结果。
- 诊断题的独立难度评估改为后台运行，不再阻塞题目展示；提交时最多额外等待 0.9 秒。
- 每日/复习题当前使用生成器 provisional difficulty，避免每题额外调用一次 Difficulty Evaluator；真实 Anchor 接入后的 Calibration Layer 保持不变。
- 单题生成输出预算由固定 7000 tokens 改为按题量动态分配，解析限制为简洁 2–4 句、最多 3 个关键步骤。
- Difficulty Evaluator 输出预算同步缩减，减少无意义的模型生成等待。

本次没有修改 index.html 的页面结构，也没有删除任何现有功能。
