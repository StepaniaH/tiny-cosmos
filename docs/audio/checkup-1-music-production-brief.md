# Tiny Cosmos 音乐与音频制作需求

版本：Checkup 1
日期：2026-07-18
目标：完成第一次接触大流程可直接接入网页的音乐、环境层和事件提示音

## 声音方向

这不是英雄式太空歌剧。玩家是宇宙外的观测者，最初听到的不是“宇宙的声音”，而是界面把无法听见的关系翻译成节律。音乐应当像一套逐渐意识到自己正在被另一侧观察的测量系统。

关键词：克制、精密、低温、非均匀周期、可计算但不完全可预测。
避免：史诗铜管、大片弦乐、明显鼓组、持续高频耳鸣、恐怖片跳吓、人声和可辨识的现成旋律采样。

## 自适应结构

所有音乐层使用同一时间网格和精确相同的循环长度，可独立循环，也可在任意小节边界叠加。

| 层 | 游戏状态 | 音乐职责 |
| --- | --- | --- |
| Observer Bed | 开局至稳定物质流 | 低频呼吸、稀疏脉冲，建立“观测正在维持存在” |
| Matter Pulse | 双层正流量形成 | 每一层加入不同周期，能听出系统开始自维持 |
| Research Layer | 等待研究原子层 | 非炫技的采样序列；随研究速率增强密度，不直接提高音量 |
| Reverse-Side Layer | 三次伪发现之后 | 极轻的反相、缺拍和非整数泛音，暗示欠描述区 |
| Contact Layer | 警报与真空水蛭 | 破坏既有周期，强调物质被抽走的方向，不使用普通战斗鼓点 |
| Afterimage Coda | 接触解决 | 短暂恢复原周期，但留下一个无法闭合的尾音，连接后续章节 |

建议主循环为 72–96 秒、4/4 的 80 BPM 等价时间网格。听感可以无拍，但所有 stem 必须相位对齐。状态切换默认 2 秒等功率交叉淡化；警报类提示音可立即进入，但不能超过音乐主体 6 dB。

## 交付文件

### 音乐 stem

- `music-observer-bed.wav/.ogg`
- `music-matter-pulse.wav/.ogg`
- `music-research-layer.wav/.ogg`
- `music-reverse-side.wav/.ogg`
- `music-contact-layer.wav/.ogg`
- `music-afterimage-coda.wav/.ogg`

### 事件提示音

- `ui-manual-pulse`
- `ui-producer-built`
- `ui-focus-lock` / `ui-focus-release`
- `ui-reserve-on` / `ui-reserve-warning`
- `ui-research-threshold`
- `ui-tier-unlock`
- `discovery-quark-echo`
- `discovery-nucleon-silence`
- `discovery-missing-description`
- `contact-warning` / `contact-attach` / `contact-siphon`
- `contact-overload` / `contact-cutoff` / `contact-observe`
- `afterimage-fuel` / `afterimage-return` / `afterimage-archive`

三个伪发现提示音要属于同一“不可解释信号”家族，但分别强调：重复回声、采样缺口、描述失败。它们不能像奖励宝箱，也不能阻断玩家操作。

## 技术规格

- 母带：48 kHz、24-bit WAV、立体声；事件音如果没有立体信息可使用 mono。
- 网页交付：OGG Vorbis，另保留 WAV 作为源文件；文件名必须与清单一致。
- 音乐响度建议约 -18 LUFS-I，True Peak 不高于 -1 dBTP；事件音以实际混音可读性校准，不追求逐个同响度。
- 每个循环提供精确到 sample 的 `loopStart`、`loopEnd`；开头不留播放器无法利用的静音。
- 循环边界无点击、无底噪突变；叠加任意两个 stem 不产生明显削波或低频相消。
- 同时测试耳机、笔记本扬声器、20% 系统音量和 mono 合并。
- 提供 `audio-catalog.json`、源工程、导出脚本、使用的 SoundFont/采样/插件清单和许可证。
- 禁止使用来源不明的网络采样、带传播限制的 SoundFont、生成器默认示例旋律或需要在线授权才能重现的插件。

## 推荐免费/开源工具链

建议让 Cursor 直接通过脚本完成可重复生产，再由人做听感修整：

1. **Mido**：用 Python 生成确定性的 MIDI 事件、分层和速度曲线。<https://github.com/mido/mido>
2. **FluidSynth**：在命令行中把 MIDI 和许可清晰的 SoundFont 渲染为 WAV。<https://github.com/FluidSynth/fluidsynth>
3. **FFmpeg**：完成裁切、交叉淡化、OGG 编码和 `loudnorm` 检查。<https://ffmpeg.org/ffmpeg-filters.html>
4. **LMMS**：免费开源 DAW，用于人工调整编曲和自动化。<https://www.lmms.io/>
5. **Surge XT**：免费开源合成器，适合制作冷色 drone、非整数泛音和调制脉冲。<https://github.com/surge-synthesizer/surge>
6. **Audacity**：最终检查波形、循环点击、淡入淡出和声道问题。<https://github.com/audacity/audacity>
7. **Tone.js 或 Howler.js**：接入网页时负责 stem 调度、交叉淡化和音量设置，不作为音乐创作工具。<https://github.com/Tonejs/Tone.js> / <https://github.com/goldfire/howler.js>

最小安装集是 Python + Mido、FluidSynth、FFmpeg；LMMS、Surge XT、Audacity 用于人工精修。如果 SoundFont 来源无法说明许可，宁可只用 Surge XT 合成，也不要混入不可追溯素材。

## MCP 建议

**这套免费流程不需要 MCP 才能开工。** Cursor 通过终端运行 Mido、FluidSynth 和 FFmpeg，并读写 MIDI、WAV、OGG 与 JSON，就能完成可重复的第一版。为了减少供应链风险，不建议为“看起来能连 DAW”而安装无人维护的小型 MCP。

可选项：

- 如果已有 Ableton Live 10+，可评估社区项目 AbletonMCP；它能让 Cursor 操作 Live，但 Ableton 本身不是免费工具。安装前固定版本并审查代码。<https://github.com/ahujasid/ableton-mcp>
- 如果一定要把 FFmpeg 包装成 MCP，可评估社区 `video-audio-mcp`，但它不是本项目必需依赖；先在隔离环境审查命令白名单和文件访问范围。<https://github.com/misbahsy/video-audio-mcp>
- 目前没有发现成熟且值得推荐的 LMMS 或 Audacity MCP。直接使用它们的工程文件、命令行工具和人工界面更可靠。

## 给 Cursor 的制作步骤

1. 先创建 `tempo-map.json`、主循环小节数和六层 MIDI 草稿，不立即追求音色。
2. 导出六层 dry WAV，验证单独和任意组合都能无缝循环。
3. 只用可追溯的 Surge XT patch 或 SoundFont 完成音色；保存 preset 和许可证。
4. 制作三种伪发现提示音，先在游戏 10、28、48 秒的真实触发点试听。
5. 制作接触层与五组接触事件音，确保低音量时仍能区分警报、附着、吸取和解决。
6. 用 FFmpeg 脚本批量生成 OGG、响度报告和波形峰值报告。
7. 把文件写入 `assets/audio/`，更新 `assets/manifest.json`，但在浏览器实测通过前保持 `enabled: false`。
8. 在桌面和移动浏览器测试后台暂停/恢复、快速切换状态、静音和减少动态效果偏好。

## 验收标准

- 不看画面也能大致分辨“稳定生产、研究等待、反向侧异常、遭遇吸取”四个状态。
- 等待研究原子层期间，10、28、48 秒的发现带来新信息，但不让玩家误以为必须立刻处理。
- 研究速率上升时，变化来自节律密度或频谱展开，而不是简单整体变响。
- 接触阶段紧张度明显提高，但对话、数字提示和按钮反馈始终可听清。
- 连续循环 10 分钟无边界点击、明显疲劳音和失控的低频累积。
- 所有文件可由仓库内脚本在干净环境重建，许可证报告无空项。
