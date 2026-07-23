# Tiny Cosmos 资产文档索引

更新日期：2026-07-23
适用版本：第一次接触 Build 0.6（页游轻量资产接口）

把整个 `docs/art/` 目录、`assets/manifest.json` 和 `assets/README.md` 交给 Cursor。Cursor 首先读取 [`AI-ASSET-HANDBOOK.md`](./AI-ASSET-HANDBOOK.md)，再按任务清单生成统一的回传包。

## 阅读顺序

1. [`AI-ASSET-HANDBOOK.md`](./AI-ASSET-HANDBOOK.md)：给 Cursor 的总任务书，包含执行顺序、停机条件和最终回传目录。
2. [`asset-style-bible.md`](./asset-style-bible.md)：硬科幻造型、色板、材质、灯光和禁止项。
3. [`asset-inventory.md`](./asset-inventory.md)：当前竖切、下一阶段和终局预留所需的完整资源清单。
4. [`asset-production-spec.md`](./asset-production-spec.md)：模型、图标和动画的具体尺寸与命名。
5. [`asset-integration-contract.md`](./asset-integration-contract.md)：运行时坐标、清单字段、状态事件和降级规则。
6. [`asset-prompts.md`](./asset-prompts.md)：可直接交给建模或图像模型的固定提示词。
7. [`asset-validation-and-delivery.md`](./asset-validation-and-delivery.md)：自动检查、人工验收和回传包结构。
8. [`asset-jobs.json`](./asset-jobs.json)：供 Cursor 读取的机器任务清单。
9. [`prologue-storyboard-prompts.md`](./prologue-storyboard-prompts.md)：已完成的第一轮 14 幕序章与 GPT Image 2 提示词。
10. [`rebirth-rounds-2-4-storyboard-prompts.md`](./rebirth-rounds-2-4-storyboard-prompts.md)：第二至第四轮 31 张重生图片槽位、路线分支与生产门槛。
11. [`rebirth-production-log.md`](./rebirth-production-log.md)：第二轮 10 个已完成生产槽位、两张 B 版锁定母版、哈希与运行时接入记录。

## 文件职责

- 视觉取舍以 `asset-style-bible.md` 为准。
- 文件名、尺寸、动作和预算以 `asset-production-spec.md` 为准。
- 运行时字段和状态映射以 `asset-integration-contract.md` 与 `assets/manifest.json` 为准。
- 两份文档发生冲突时，Cursor 在 `reports/questions.md` 记录冲突并暂停对应资产，其他无冲突任务继续执行。
- Cursor 不修改游戏代码，不把依赖写入项目，不自动把清单项改成 `enabled: true`。
