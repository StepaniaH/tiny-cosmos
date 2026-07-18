# Blazor WebAssembly 适用性评估

状态：当前决策
更新日期：2026-07-18
决策：保留现有 JavaScript 技术栈，暂不迁移。

## 技术说明

Blazor 是 ASP.NET Core 的网页界面框架，主要使用 C# 和 Razor 组件。Blazor WebAssembly 会把 .NET WebAssembly 运行时、应用程序集和依赖下载到浏览器，在浏览器界面线程执行组件。

发布结果可以静态托管，也可以做成支持离线的 PWA。Canvas、Web Audio 和现有 JavaScript 库通过 JavaScript 互操作调用。

采用 Blazor WebAssembly 需要用 C#、Razor 组件和 .NET 项目结构重组应用。现有 JavaScript 不会自动转换。

官方资料：

- [Blazor 托管模型（.NET 10）](https://learn.microsoft.com/en-us/aspnet/core/blazor/hosting-models?view=aspnetcore-10.0)
- [Blazor WebAssembly 构建工具与 AOT（.NET 10）](https://learn.microsoft.com/en-us/aspnet/core/blazor/webassembly-build-tools-and-aot?view=aspnetcore-10.0)
- [Blazor 与 JavaScript 互操作（.NET 10）](https://learn.microsoft.com/en-us/aspnet/core/blazor/javascript-interoperability/?view=aspnetcore-10.0)

## 适合的项目条件

- 团队长期使用 C# 和 .NET。
- 前后端都使用 ASP.NET Core，需要共享模型和验证逻辑。
- 界面由大量 Razor 组件组成。
- 项目愿意承担 .NET 运行时下载和构建流程。
- 客户端模拟能够从 .NET 测试和工具链获得明显收益。

增量游戏和管理页游可以使用 Blazor WebAssembly。是否采用取决于团队技术和产品需求。

## 主要成本

- 初始下载包含 .NET 运行时和程序集，通常高于轻量 JavaScript 页面。
- 浏览器端只能使用 WebAssembly 环境支持的 .NET API 子集。
- 客户端代码会发送给用户，不能依靠 WebAssembly 隐藏规则或防作弊。
- Canvas 和部分浏览器能力需要互操作边界。
- AOT 可以提高运行性能，同时增加发布体积和构建时间。
- 迁移涉及状态、引擎、界面、存档和验证工具的重写与兼容处理。

## 与 Tiny Cosmos 的匹配情况

当前项目具备：

- 可直接运行的 HTML、CSS 和 JavaScript。
- 已分开的状态、模拟、界面和画布。
- 无运行时依赖。
- 基于 Node 的确定性验证工具。
- 较轻的计算负载。

当前工作集中在焦点、选项池、敌人、结局和继承物。这些系统可以继续由现有技术承载。迁移完成后仍需解决同样的玩法和内容问题。

Blazor 可能提供的收益：

- C# 静态类型和工具链。
- ASP.NET Core 前后端共享模型。
- Razor 组件化界面。

当前需要承担的成本：

- 重写现有运行结构。
- 处理旧存档。
- 改写 Node 验证加载方式。
- 增加 SDK、构建、发布和互操作维护。
- 提高冷启动载荷。

## 当前安排

继续用现有技术验证周目循环。代码规模增长后，可以单独评估 ES Modules、TypeScript 和数据驱动内容组织。

平台方向见 `docs/architecture/platform-direction.md`。未来 Steam 版本可以通过 Electron 或 Tauri 复用网页前端，无需先迁移到 Blazor。

## 重新评估条件

满足多项条件后再讨论 Blazor：

- 核心维护者确定 C#/.NET 为长期主技术。
- 项目需要 ASP.NET Core 后端和共享模拟。
- 账号、云存档、多人或排行榜需要服务端验证。
- 现有 DOM 管理已经形成可量化瓶颈。
- 项目接受更大的初始下载。
- 团队有时间处理存档和双版本验证。

## 技术样片范围

若进入重新评估，先在独立分支制作：

1. 三层资源和确定性模拟。
2. Canvas 动画与点击。
3. 本地存档和旧存档导入。
4. 一个十分钟验证场景。

记录：

- 首次下载和冷启动。
- 桌面与中低端设备的 tick、渲染和内存。
- JavaScript 互操作维护量。
- 测试和调试效率。
- 迁移一条实际玩法规则所需工作。

样片数据达到预期后再提交正式迁移提案。
