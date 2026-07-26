# 平衡验证系统实施归档

状态：已在 `dev` 分支完成
实施日期：2026-07-07
用途：保存当时的目标、结构、执行结果和排错记录。当前工作安排以 `docs/product/roadmap.md` 为准。

## 实施目标

建立一套可重复运行的确定性平衡验证工具，让后续玩法和数值修改能够比较：

- 各层解锁时间。
- 资源、生产者和研究状态。
- 第一轮大坍缩时间。
- 第二轮开局提速。
- 停滞、耗尽和失控增长警告。

## 技术方案

验证工具直接加载浏览器中的游戏常量、状态和引擎文件。Node 运行环境提供一个最小 `window` 对象，模拟时主动调用 `GameEngine.tick()`，不启动浏览器定时器，也不加载 DOM 和画布。

技术组成：

- 原生 JavaScript。
- Node.js 内置模块。
- `vm` 隔离运行环境。
- JSON 完整报告。
- Markdown 评审摘要。
- 无运行时第三方依赖。

## 文件和职责

| 文件 | 职责 |
| --- | --- |
| `tools/balance/load-game.js` | 在 Node 中加载游戏脚本并创建新游戏 |
| `tools/balance/metrics.js` | 计算层级速度、快照和警告 |
| `tools/balance/scenarios.js` | 定义确定性策略和场景 |
| `tools/balance/run-validation.js` | 运行场景并写入 JSON 报告 |
| `tools/balance/write-baseline.js` | 把最新报告整理成评审基线 |
| `docs/balance/protocol.md` | 说明必跑命令和验收范围 |
| `docs/balance/reports/baseline-current.md` | 保存当前评审基线 |
| `docs/balance/ml-backlog.md` | 记录机器学习启动条件 |
| `reports/balance/.gitkeep` | 保留本地报告目录 |

## 主要接口

### 游戏加载

`tools/balance/load-game.js` 提供：

- `createGameRuntime()`：创建带最小浏览器兼容层的运行环境。
- `newGame()`：初始化游戏并返回常量、状态、引擎和当前状态对象。

加载顺序：

1. `js/constants.js`
2. `js/state.js`
3. `js/engine.js`

### 指标

`tools/balance/metrics.js` 提供：

- `tierRates(game, tierId)`：计算每秒产出、代谢和净变化。
- `snapshot(game, elapsedSeconds)`：生成完整状态快照。
- `warningsForSnapshot(snapshot)`：检查耗尽、负净变化、停滞和失控增长。

### 场景

`tools/balance/scenarios.js` 提供：

- `SCENARIOS`：场景定义表。
- `runScenario(name, options)`：运行单个确定性场景。
- 固定点击、购买、研究、合成和大坍缩策略。

### 命令行

`tools/balance/run-validation.js` 支持：

- `--all`：运行全部场景。
- `--scenario <name>`：运行指定场景。
- 输出带提交号和时间的 JSON 报告。

`tools/balance/write-baseline.js` 读取最新 JSON，生成或更新当前 Markdown 基线。

## 完成的任务

### 任务一：Node 游戏加载器

完成内容：

- 创建最小 `window` 兼容层。
- 禁止验证脚本调用真实 `setInterval`。
- 加载现有游戏脚本。
- 提供新游戏初始化方法。

验证结果：能够在 Node 中创建七个层级并执行 tick。

### 任务二：指标与检查点

完成内容：

- 统一产出、代谢和净变化计算。
- 记录各层资源、生产者、合成次数和历史总量。
- 记录研究、大坍缩、恒定点和里程碑状态。
- 增加耗尽、停滞和失控增长警告。

### 任务三：确定性场景

完成场景：

- `idle-10m`
- `click-start-10m`
- `guided-30m`
- `guided-60m`
- `first-prestige`
- `post-prestige-10m`

场景策略使用固定规则，运行结果可重复。

### 任务四：命令行与报告

完成内容：

- 支持运行全部或指定场景。
- 报告包含 Git 提交、时间和场景结果。
- 临时报告写入 `reports/balance/`。
- `.gitignore` 忽略生成报告，保留 `.gitkeep`。

### 任务五：协议与基线

完成内容：

- 增加平衡验证协议。
- 生成第一份评审基线。
- 明确 10、30、60 分钟和第一轮大坍缩的验收范围。

### 任务六：一致性修复

完成内容：

- 界面产出速度与引擎速度乘数保持一致。
- “核聚变催化”里程碑实际影响原子合成成本。
- 更新过时的生产注释。

### 任务七：机器学习待办

完成内容：

- 记录当前阶段不使用机器学习的原因。
- 记录历史报告数量、场景稳定性和人工阈值等启动条件。

## 关键排错记录

### 第一轮大坍缩曾被错误判定为不可达

最初的 `first-prestige` 场景长期无法获得文明。数轮常量调整都没有解决问题。

最终原因位于引导策略：合成循环最高只处理到层级 5，完全没有尝试合成层级 6 的文明。把上限改为 6 后，原有数值即可在约 3.2 小时抵达大坍缩。

这次问题说明：

- 调整数值前先确认验证策略覆盖所有玩法路径。
- 场景无法完成时检查执行记录和条件分支。
- 模拟器的错误可能伪装成平衡问题。

### 性能修复不改变模拟结果

完成验证系统后，画布刷新限制为 30 帧，背景渐变改为缓存，页面隐藏时暂停画布，DOM 更新频率降低。模拟 tick 仍保持每秒 20 次，因此场景数值没有变化。

## 常用命令

运行全部场景：

```bash
node tools/balance/run-validation.js --all
```

运行指定场景：

```bash
node tools/balance/run-validation.js --scenario guided-30m
```

更新评审基线：

```bash
node tools/balance/write-baseline.js
```

检查 JavaScript 语法：

```bash
node --check tools/balance/load-game.js
node --check tools/balance/metrics.js
node --check tools/balance/scenarios.js
node --check tools/balance/run-validation.js
node --check tools/balance/write-baseline.js
```

## 当前结果

- 十分钟纯放置：层级 1，无警告。
- 十分钟点击开局：层级 1，无警告。
- 三十分钟引导：层级 3，无警告。
- 六十分钟引导：层级 4，无警告。
- 第一轮大坍缩：11496 秒，约 3.2 小时。
- 大坍缩后十分钟：层级 2，无警告。

详细数值见 `docs/balance/reports/baseline-current.md`。

## 保留约束

- 游戏常量继续集中在 `js/constants.js`。
- 验证脚本不加载 DOM 和画布。
- 临时报告不提交。
- 评审基线只在确认后更新。
- 机器学习不能替代确定性场景。
- 新路线需要独立策略脚本，避免单一引导策略代表全部玩法。

## 后续接手

开始修改玩法前阅读：

- `docs/product/roadmap.md`
- `docs/balance/protocol.md`
- `docs/balance/reports/baseline-current.md`
- `docs/game-design/README.md`

本文件已经完成归档，不再作为待执行任务清单。
