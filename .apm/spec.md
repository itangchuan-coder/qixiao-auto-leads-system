---
title: 启效智联汽车销售线索管理系统
modified: Spec creation by the Planner.
---

# APM Spec

## Overview

启效智联汽车销售线索管理系统是一个基于 React、TypeScript、Vite、Ant Design 和 Zustand 的企业内部前端原型，用于验证汽车销售线索、客户项目、报价、供应商、成交产能和交付批次等业务流程。本轮工作解决单体入口、首包过大、浏览器验收不足和线上部署尚未验证的问题，同时保持现有业务行为与数据模型不变。交付范围包括渐进式页面组件化、路由懒加载、按需加载 Excel 导出能力、可重复的桌面与移动端验收，以及 Vercel Preview 和 Production 发布验证。完成标准是所有自动化检查通过、入口 JavaScript 原始体积低于 500 kB、关键业务流程无回退、线上子路由可直接访问和刷新。

## Workspace

- 工作目录：`/Users/tangchuan/Desktop/启效智联 联效系统`
- 工作仓库：单一 Git 仓库，当前分支为 `main`，远端为 `origin/main`。
- 主要代码：`src/`；业务类型、规则和 mock 数据位于 `src/domain/`；导航位于 `src/app/`；共享选择控件位于 `src/components/`。
- 业务与协作规范：`agent.md`、`docs/sop/README.md`、`docs/sop/` 下各业务流程文档。
- 项目背景与技术现状：`README.md`、`docs/project-apm-handoff-report.md`。
- APM 配置：`.agents/`、`.apm/`、`.codex/`。
- 现有 `AGENTS.md` 要求所有修改前阅读 `agent.md` 和 `docs/sop/README.md`，新增核心业务流程时同步更新 SOP；该内容必须保留。

---

> **Notes:** 当前 `main` 工作区包含尚未提交的权限、状态流转、交付校验、测试、SOP 和 Vercel 配置修改，以及 APM 初始化文件。这些改动是本轮工作的有效基线，不应被重置或覆盖。`.vercel/` 和 `.env*` 已被忽略，`.vercel/project.json` 仅作为本地项目绑定信息使用。用户偏好通过多个执行窗口并行提高效率，但最终浏览器验收和生产发布需要在整合后的代码上完成。

## Product Scope

### Included

- 保留并优化工作台、个人业务驾驶舱、客户项目、报价、线索、线索导入、供应商、成交开拓基地、交付批次、交付对象、SOP 和权限演示页面。
- 将当前 `src/App.tsx` 中的页面渲染、表格、表单、抽屉和弹窗逐步迁移到清晰的页面与共享组件边界。
- 按实际路由延迟加载页面代码，避免当前页面状态变化时构造所有页面 JSX。
- 将 `xlsx` 从顶层静态依赖改为用户执行导出时按需加载。
- 建立桌面端与移动端关键流程的自动化浏览器验收。
- 使用当前已绑定的 Vercel 项目完成 Preview 验证和 Production 发布。
- 更新受影响的 SOP、发布检查和项目交接报告。

### Excluded

- 真实后端 API、数据库、登录、用户系统和服务端权限。
- 真实 Excel 导入解析、文件存储和外部业务接口。
- 审批流、真实审计日志、真实结算和财务系统。
- 重新设计现有业务字段、页面信息架构或视觉风格。
- 用新的状态管理方案替换 Zustand。

## Behavior Preservation

- 现有页面名称、路由、主要布局、字段、mock 数据和业务结果保持一致。
- 管理员和运营保留流程操作权限；其他角色保持只读、手机号脱敏且不能通过编辑入口获取完整手机号。
- 线索、客户项目、报价和成交产能只能通过既定状态机流转，编辑资料不得直接覆盖状态。
- 交付批次只能包含状态为“有效”的线索，界面选择和写入函数都必须执行校验。
- 城市、品牌和车型字段继续复用 `SmartSelect`，保留中文、拼音、首字母、别名和手动添加能力。
- 页面拆分不得改变 Zustand store 中现有数据类型和更新语义，除非修复经验证的缺陷且同步测试与 SOP。

## Architecture Direction

- 保留 React 19、TypeScript、Vite、Ant Design、React Router 和 Zustand 技术栈。
- 应用外壳负责侧栏、顶部栏、角色选择、路由边界和全局错误/加载状态；业务页面负责自己的展示、表单状态和交互。
- 页面组件通过 React Router 路由边界和动态导入加载。未知路由必须得到明确处理，不应静默伪装成工作台。
- 共享领域规则继续放在 `src/domain/`，不得重新复制到页面组件。
- 页面可以按需要使用精确的 Zustand selector，避免无关数据变动导致所有页面重新渲染；不得为此更换状态管理库。
- Excel 导出保持现有文件内容和文件名，但仅在用户点击导出后加载 `xlsx`。
- 未被源码使用的生产依赖应在验证无引用后移除。

## Performance Requirements

| Requirement | Acceptance criterion |
|---|---|
| Route code splitting | 构建产物包含可识别的业务路由 chunk，页面代码不再全部进入单一入口文件。 |
| Initial entry size | 入口 JavaScript 原始体积低于 500 kB。 |
| Excel loading | 首次加载任何页面时不请求 `xlsx` 所在 chunk；执行线索导出时才加载。 |
| Build warnings | `pnpm build` 不出现未解释的超大 chunk 告警；若第三方依赖产生不可避免的独立 chunk，必须记录原因和实际影响。 |
| Functional stability | 性能优化前已通过的业务规则测试继续通过，关键浏览器流程无行为回退。 |

## Quality and Browser Validation

- Vitest 继续覆盖领域规则和纯函数；新增领域规则必须先有可复现的失败测试。
- Playwright 负责可重复的浏览器验收，主要运行环境为 Chromium 桌面视口和移动端模拟视口。
- 至少直接打开并刷新 `/`、`/leads`、`/customer-projects`。
- 至少验证管理员、运营和其他角色切换，手机号脱敏、写入按钮权限和其他角色不可编辑线索。
- 至少验证有效线索选择与交付批次创建、非有效线索不可交付、终态不能非法回退。
- 至少验证新增或编辑表单保存、SmartSelect 搜索/选择，以及关键页面没有明显重叠、裁切或不可操作控件。
- 浏览器控制台不得出现与应用相关的 error；warning 必须被解释或修复。
- 桌面和移动端关键页面截图作为验收证据保存在仓库外，不提交到 Git。
- 所有交付必须通过 `pnpm test`、`pnpm build`、`pnpm lint` 和 `git diff --check`。

## Deployment and Release

- 使用官方 Vercel CLI，通过 `pnpm dlx vercel@latest` 调用，避免要求全局安装。
- 当前登录账号为 `itangchuan-9342`，本地已绑定项目 `qixiao-auto-leads-system`。
- `vercel.json` 保留 Vite 构建配置、`dist` 输出目录和 SPA rewrite。
- 先创建 Preview deployment，验证页面身份、静态资源、子路由刷新、浏览器控制台和关键业务流程。
- Preview 全部通过并向用户汇报后，才可发布 Production。
- Production 发布后再次验证 `/`、`/leads`、`/customer-projects` 的直接访问与刷新，并记录最终线上 URL。
- 本轮不新增自定义域名或环境变量，使用 Vercel 默认生产域名。

## Documentation

- 页面内部重构且业务流程不变时，SOP 只需在发布检查中补充新的验证方式；业务规则发生变化时必须更新对应业务 SOP。
- `docs/sop/release-checklist.md` 应包含 Vitest、Playwright、桌面/移动端、子路由刷新、构建体积和 Vercel Preview/Production 检查。
- `docs/project-apm-handoff-report.md` 中关于 Vercel rewrite、未提交文件和测试能力的过期描述必须修正。
- 最终记录应包含测试结果、构建产物体积、Preview URL、Production URL、已验证路由和剩余风险。
