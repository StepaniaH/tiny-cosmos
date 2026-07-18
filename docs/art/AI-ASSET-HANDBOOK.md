# AI 使用资产文档：Cursor + Blender 总任务书

版本：1.0
更新日期：2026-07-18
目标软件：Cursor、Blender 5.2.0 LTS、FFmpeg

## 你的任务

你负责为 Tiny Cosmos 的“第一次接触”竖切制作一套可验证、可重复生成、可以整体回传的美术资产包。当前游戏已经有 Canvas 与 CSS 占位。你的工作范围包括 Blender 源文件、GLB、SVG、纹理、预览、构建脚本、验证脚本和交付报告。

你不负责修改游戏玩法、数值、HTML、CSS 或 JavaScript。不要安装 Three.js，不要把资产直接接入页面，不要把 `enabled` 改为 `true`。完成后由主项目统一检查和接入。

## 输入文件

开始前必须完整读取：

1. `docs/art/asset-style-bible.md`
2. `docs/art/asset-inventory.md`
3. `docs/art/asset-production-spec.md`
4. `docs/art/asset-integration-contract.md`
5. `docs/art/asset-prompts.md`
6. `docs/art/asset-validation-and-delivery.md`
7. `docs/art/asset-jobs.json`
8. `assets/manifest.json`

如果只拿到了这些文档，没有游戏仓库，也可以完成资产制作。所有路径均相对于最终回传包根目录。

## 固定回传包

只创建一个顶层目录：

```text
tiny-cosmos-asset-pack/
├── DELIVERY.md
├── asset-pack-manifest.json
├── docs/
│   └── art/                  # 本任务全部规范与 asset-jobs.json 的冻结副本
├── assets/
│   ├── manifest.source.json
│   ├── manifest.delivery.json
│   ├── models/
│   ├── icons/
│   ├── textures/
│   ├── vfx/
│   ├── audio/
│   └── video/
├── source-art/
│   ├── blender/
│   ├── svg/
│   └── textures/
├── scripts/
│   ├── build_all.py
│   ├── build_models.py
│   ├── build_icons.py
│   ├── render_previews.py
│   └── validate_assets.py
├── previews/
│   ├── stills/
│   └── video/
└── reports/
    ├── build-report.json
    ├── validation-report.json
    ├── asset-status.md
    ├── questions.md
    └── licenses.md
```

不在回传包根目录旁边生成第二个缓存目录。临时文件放在 `tiny-cosmos-asset-pack/.work/`，交付前清空 `.work/`。

## 执行顺序

### 第 1 阶段：环境与清单

1. 检查 Blender 版本，要求 5.2.x LTS。
2. 检查 FFmpeg 是否可用。
3. 解析 `docs/art/asset-jobs.json`，验证所有 `jobId`、输出路径和依赖唯一。
4. 创建固定回传包目录。
5. 把本任务全部 `docs/art/` 文件复制到包内同名目录。它们是交付包的冻结规范，脚本不得在构建时改写。
6. 复制 `assets/manifest.json` 为 `assets/manifest.source.json`，再复制一份为 `assets/manifest.delivery.json`；两份都保留所有 `enabled: false`。
7. 在 `reports/build-report.json` 记录软件版本、操作系统和开始时间。

### 第 2 阶段：可重复构建脚本

1. 每个模型使用一个独立 Python 生成模块，统一由 `scripts/build_models.py` 调度。
2. 所有随机过程显式传入任务清单中的 `seed`。
3. 脚本重复运行时覆盖同名生成文件，不产生 `.001`、`.002` 后缀。
4. Blender 数据块使用固定名称，禁止依赖场景中当前选中物体。
5. 源 `.blend`、GLB、预览和报告由同一次构建产生。
6. SVG 使用确定性路径数据；相同输入两次生成的文件内容应一致。

### 第 3 阶段：P0 资产

完成所有 `priority: P0` 的任务：

- 观测核、真空水蛭、核心余像。
- 七个物质层图标。
- 第一法则、路线、接触准备、敌人处理图标。
- 观测核、层级解锁、接触异常和三种处理方案的 VFX 图集。
- 当前界面所需的环境纹理。

每完成一个任务，立即运行单项验证。单项失败时最多自动修复两轮。第三次仍失败，将状态写为 `blocked`，保留日志，继续无依赖任务。

### 第 4 阶段：P1 资产

完成生产单元、焦点透镜、保护信标、研究探针及其预览。P1 资产当前没有页面加载器，但文件接口已经冻结。

### 第 5 阶段：P2 预留

P2 包含四条结局和继承物的概念占位。先制作灰盒模型、轮廓图和色板预览，不制作高成本贴图。P2 资产不得挤占 P0、P1 的验证时间。

### 第 6 阶段：总验收与打包

1. 运行 `scripts/validate_assets.py --all`。
2. 生成 SHA-256、文件大小、三角面、材质、纹理和动画统计。
3. 生成每个模型四视图和全动画预览视频。
4. 将交付清单写入 `asset-pack-manifest.json`。
5. 在 `DELIVERY.md` 写明完成、失败、降级和需要人工判断的项目。
6. 清理 `.work/`、Blender 自动备份、缓存贴图、未引用数据块和重复预览。

## Blender 执行方式

macOS 默认命令：

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background \
  --factory-startup \
  --python tiny-cosmos-asset-pack/scripts/build_all.py \
  -- --root tiny-cosmos-asset-pack \
  --jobs tiny-cosmos-asset-pack/docs/art/asset-jobs.json
```

构建脚本需要支持：

```bash
--only M001
--priority P0
--skip-previews
--validate
--clean
```

不要依赖 Blender 图形界面中的手动点击完成最终构建。可以手动查看和调整生成结果，调整内容需要回写脚本或固定源文件，确保下一次构建仍能得到同样结果。

## 质量优先级

从高到低：

1. 文件名、坐标、原点、动画名和尺寸正确。
2. 轮廓在游戏实际显示尺寸下清晰。
3. 动画能与运行时状态无缝切换。
4. 性能预算和文件大小合格。
5. 表面细节和装饰密度。

精细表面不能补偿错误接口。未满足前四项的资产不得标记为完成。

## 禁止事项

- 不复制现有游戏、电影、动画或艺术家的标志性设计。
- 不加入文字、Logo、水印、二维码或不可追踪的外部贴图。
- 不使用未经确认的付费素材、网络模型和受限字体。
- 不改变固定文件名、动作名、尺寸、坐标、帧率和材质上限。
- 不把所有网格合并成无法单独调整材质或骨骼的单一静态网格。
- 不交付只有渲染图、没有源文件和 GLB 的模型。
- 不把模型动作烘焙成视频代替 GLB 动画。
- 不提交超过预算的 4K、8K 纹理。
- 不删除程序化占位或修改游戏代码。

## 遇到不确定项

按以下规则处理：

1. 接口和尺寸已有明确值：严格执行，不自行变更。
2. 局部装饰没有规定：使用固定种子，在允许变化范围内完成。
3. 两份文档冲突：暂停该任务，在 `reports/questions.md` 写明文件、段落、冲突值和建议。
4. 软件缺少功能：保留源文件，提供可用的低复杂度版本，并在报告中标记 `degraded`。
5. 音频生成工具不可用：创建音频任务清单和占位元数据，不合成无来源音频。

## 完成判定

只有同时满足以下条件，整个任务才算完成：

- P0 全部为 `passed`，不存在 `missing`。
- P1 至少完成模型、GLB、四视图和基础动画；允许表面贴图标记为 `degraded`。
- `validate_assets.py --all` 返回退出码 0。
- `asset-pack-manifest.json` 中每个载荷文件都有 SHA-256；清单文件本身不记录自身哈希。
- `manifest.delivery.json` 保持 `enabled: false`。
- `DELIVERY.md` 足以让未参与制作的人理解如何导入。
- 最终只需把 `tiny-cosmos-asset-pack/` 整个目录交回。
