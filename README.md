# Tiny Cosmos

一款以宇宙经营、跨轮决策和碎片叙事为核心的浏览器游戏。当前可玩内容覆盖第一轮文明循环，以及第二轮“答案的反例”到真理裁定。

## 从这里开始

- [项目文档总入口](./docs/README.md)
- [产品愿景](./docs/product/vision.md)
- [当前制作路线图](./docs/product/roadmap.md)
- [世界观圣经](./docs/game-design/world-bible.md)
- [五轮主叙事](./docs/design/narrative/five-loop-arc.md)

文档发生冲突时，以 `docs/README.md` 中的权威顺序为准。历史复盘与已被替代的方案统一保存在 `docs/archive/`。

## 本地运行

项目是无构建步骤的静态网页：

```bash
python3 -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。

## 回归检查

```bash
node tools/validate-static-assets.js
node tools/balance/early-agency-smoke.js
node tools/balance/first-contact-smoke.js
node tools/balance/civilization-smoke.js
node tools/balance/second-loop-smoke.js
node tools/balance/background-progress-smoke.js
node tools/balance/time-scale-smoke.js
```

第三、第四轮与第五轮总结的设计基线已经确定，但尚未宣称进入完整可玩实现。
