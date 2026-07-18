# Tiny Cosmos 开发路线图

本文用于项目维护和交接。玩法讨论、平衡验证和技术方向都从这里进入。

## 分支状态

- 开发分支：`dev`
- 稳定分支：`main`
- 开发工作在 `dev` 进行，通过拉取请求合并到 `main`。

## 已完成工作

### 仓库整理

- 增加隐私和开发文件忽略规则。
- 忽略本地代理状态、环境文件、依赖、日志、浏览器测试产物和临时平衡报告。

### 平衡验证基础

- Node 游戏加载器：`tools/balance/load-game.js`
- 指标和警告：`tools/balance/metrics.js`
- 确定性场景：`tools/balance/scenarios.js`
- 验证命令：`tools/balance/run-validation.js`
- 基线写入：`tools/balance/write-baseline.js`
- 验证协议：`docs/balance/protocol.md`
- 当前基线：`docs/balance/reports/baseline-current.md`
- 机器学习待办：`docs/balance/ml-backlog.md`

### 一致性修复

- 界面产出速度与引擎速度乘数保持一致。
- “核聚变催化”里程碑已接入原子合成成本。
- 生产注释已经更新。

### 性能修复

- 画布刷新限制为 30 帧。
- 背景渐变在尺寸变化时重新缓存。
- 页面隐藏时暂停画布。
- DOM 信息每秒更新四次，模拟仍保持每秒二十 tick。

## 当前平衡基线

运行：

```bash
node tools/balance/run-validation.js --all
```

结果：

- `idle-10m`：层级 1，无警告。
- `click-start-10m`：层级 1，无警告。
- `guided-30m`：层级 3，无警告。
- `guided-60m`：层级 4，无警告。
- `first-prestige`：11496 秒抵达大坍缩，约 3.2 小时。
- `post-prestige-10m`：层级 2，无警告。

## 已知排错结论

第一轮大坍缩早期失败曾由场景脚本引起。引导策略只合成到层级 5，没有执行层级 6 的文明合成。修正脚本上限后，原有常量即可完成场景。

遇到平衡问题时先检查：

- 场景是否覆盖全部已解锁层级。
- 自动策略是否执行了必要操作。
- 界面、引擎和指标是否使用同一公式。
- 警告来自持续问题还是短时状态。

## 当前玩法设计包

中文索引：`docs/game-design/README.md`

主要文档：

- 整体玩法方向：`docs/game-design/gameplay-direction.md`
- 周目和继承物：`docs/game-design/loop-and-inheritance.md`
- 小决策与伪随机选项池：`docs/game-design/decision-pool.md`
- 细枝玩法：`docs/game-design/side-branches.md`
- 纸面试玩：`docs/game-design/paper-playtest.md`
- 反宇宙敌人：`docs/game-design/adversarial-system.md`
- 多结局总览：`docs/game-design/victory-routes.md`
- 共同世界观和分幕剧本：`docs/game-design/routes/shared-campaign.md`
- 越过视界：`docs/game-design/routes/across-horizon.md`
- 无尽花园：`docs/game-design/routes/endless-garden.md`
- 最后观测者：`docs/game-design/routes/last-observer.md`
- 双生大坍缩：`docs/game-design/routes/twin-crunch.md`

完整周目、四条终局和继承物仍处于纸面设计阶段。下面的“第一次接触”竖切已经可玩，其时间和数值会继续根据试玩结果调整。

## 当前可玩竖切

二十分钟“第一次接触”版本已经进入实现：

- 融入任务指令的前期教学。
- 夸克、核子、原子三层资源。
- 宇宙焦点和单层保护线。
- 两段读取真实库存与净流量的稳定任务。
- 三项第一法则。
- 三种接触准备及其经营条件。
- 真空水蛭预警、损失上限与三种可执行处理。
- 第四种同步处理占位。
- 核心余像选择和四类路线信号。
- 硬科幻三栏驾驶舱界面。

实现说明见 `docs/game-design/first-contact-vertical-slice.md`。

## 当前技术判断

- 玩法原型继续使用现有网页技术。
- Blazor WebAssembly 暂不采用，详见 `docs/architecture/blazor-webassembly-evaluation.md`。
- 网页和 Steam 路线见 `docs/architecture/platform-direction.md`。
- 完成两个公开结局和数轮继承循环后，再做 Electron 或 Tauri 桌面封装样片。

## 下一阶段顺序

### 阶段一：纸面试玩

- 使用资源卡、焦点、保护线和事件卡演练共同剧本。
- 验证真空水蛭的四种处理方法。
- 演练越过视界和无尽花园的终局时间轴。
- 检查玩家能否指出小决策与终局提案的联系。

### 阶段二：局内控制竖切

- 一个宇宙焦点。
- 简单储备保护。
- 一个短项目槽。
- 三类资源状态：短缺、循环、过载。

验收重点：玩家会根据资源链移动焦点，操作频率保持在几十秒到数分钟一次。

### 阶段三：小决策与选项池

- 数据驱动的三选一事件。
- 四类路线倾向。
- 最近重复惩罚、反向补偿和保底。
- 固定随机种子，重新载入不能刷新候选。

验收重点：连续专精仍然可行，其他方向会获得更多出场机会。

### 阶段四：第一次敌人接触

- 真空水蛭预警。
- 新增产出截流。
- 过载、断供、观测、同步四种处理。
- 资源损失上限和离线冻结。

验收重点：忽略敌人会减慢发展，资源链仍然可以恢复。

### 阶段五：第一个结局与继承物

- 优先实现越过视界。
- 终局提案读取整局小决策。
- 定向大坍缩生成两件继承物候选。
- 下一轮装备一件主继承物。

验收重点：继承物会改变下一轮前十分钟的事件和操作。

### 阶段六：第二个公开结局

- 实现无尽花园。
- 同一敌人和资源链支持另一套解法。
- 加入混合刻印，例如边疆种舱转为迁徙种荚。

验收重点：两条路线使用不同操作顺序，完成时间没有全面失衡。

### 阶段七：观测、自动化和档案

- 最后观测者的证据系统。
- 两个自动化规则槽。
- 宇宙档案、谱系和回归报告。

### 阶段八：隐藏结局和桌面样片

- 双生大坍缩。
- 矛盾继承物。
- Steam 桌面封装技术样片。

该阶段需要前三个公开结局已经稳定。

## 验收范围

现有基础范围见 `docs/balance/protocol.md`。

新增玩法还要检查：

- 第一处有后果的小决策出现时间。
- 每条公开路线是否能完成。
- 不同路线的操作顺序和资源压力是否有差异。
- 选项池能否避免连续重复。
- 反向补偿是否保留专精自由。
- 敌人损失是否有预警和上限。
- 继承物是否改变下一轮规则。
- 普通大坍缩是否始终可用。

## 机器学习安排

当前阶段继续使用确定性场景和人工试玩。满足 `docs/balance/ml-backlog.md` 中的报告数量和稳定性条件后，再考虑异常检测和参数搜索。

## 接手检查表

开始工作前：

- 运行 `git status --short --branch`。
- 确认当前分支为 `dev`。
- 阅读本文件、平衡协议、当前基线和玩法索引。
- 修改行为前运行全部验证场景。

提交前：

- 检查相关 JavaScript 语法。
- 运行全部验证场景。
- 记录有意产生的场景变化。
- 评审通过后再更新基线。
- 不提交 `reports/balance/` 下的临时报告。

推送前：

- 检查工作区状态。
- 推送 `dev` 分支。
- 从 `dev` 向 `main` 创建拉取请求。
