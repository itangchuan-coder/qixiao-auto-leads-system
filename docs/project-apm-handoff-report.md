# 启效智联汽车销售线索管理系统 APM 交接报告

生成日期：2026-07-14

## 1. 项目一句话说明

这是一个从 0 开始搭建的企业内部汽车销售线索管理系统前端原型，用于验证汽车销售线索、客户项目、供应商、成交产能、报价和交付批次等核心业务流程。

当前重点不是完整后端系统，而是先用前端原型把业务闭环跑通，后续再逐步接入真实后端、数据库、登录和权限体系。

## 2. 当前项目位置

本地目录：

```bash
/Users/tangchuan/Desktop/启效智联 联效系统
```

GitHub 仓库：

```text
git@github.com:itangchuan-coder/qixiao-auto-leads-system.git
```

当前分支：

```bash
main
```

## 3. 技术栈

- React 19
- TypeScript
- Vite
- Ant Design
- Ant Design Pro Components
- React Router
- Zustand
- XLSX
- oxlint
- pnpm

常用命令：

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

本地开发地址通常是：

```bash
http://127.0.0.1:5173
```

## 4. 当前产品定位

系统面向汽车销售线索业务，用户目前偏个人客户业务场景。

核心目标：

1. 管理线索。
2. 管理下游客户项目。
3. 管理汽车销售线索渠道方和数据方供应商。
4. 管理成交开拓基地，即通过自有外呼中心联系经销商获取成交产能。
5. 管理报价需求。
6. 管理交付对象和交付批次。
7. 用 SOP 文档沉淀每个业务流程。

当前角色设计：

- 管理员：完整权限。
- 运营：负责核心流程操作。
- 其他角色：先预留结构，后续按需求细分。

## 5. 已实现模块

### 5.1 工作台

用于查看线索统计、重复线索、待清洗、已交付、品牌排行和来源排行。

### 5.2 个人业务驾驶舱

用于按人员查看相关客户项目、报价、成交开拓基地等业务指标。

### 5.3 客户项目管理

用于销售接到客户项目后，管理项目详情、合同、首付款、人员安排、业务类型、线索/成交/到店要求、结算方式、发票形式、耗损比例和备注。

当前业务方向已明确为“下游客户项目管理”。

主要字段包括：

- 客户名称
- 项目类型：普通、平台、主机厂、直播基地
- 客户供给平台：易车、之家、懂车帝、百度有驾等
- 主机厂品牌
- 直播业务标记
- 平台业务名称：KA、有驾、车商汇、CPT、到店、CPS、直播线索、其他
- 供给内容：线索、成交、到店、直播、其他
- 需求量级
- 推送时间
- 销售负责人
- 运营负责人
- 项目状态
- 首触要求
- 有效率要求
- 是否支持精准下发
- 成交周期：T+1/T+2/T+3/T+30/其他
- 成交凭证要求
- 到店录音、到店凭证、系统到店确认
- 单店成交限制和备注
- 合同和首付款
- 月结/项目结算
- 账期
- 发票形式
- 单价、最终结算单价、最终结算比例、最终结算金额
- 结算标准
- 耗损比例
- 结算备注和需求备注

### 5.4 线索管理

用于线索新增、编辑、搜索、详情查看、手机号重复提示、状态流转和跟进记录。

线索状态：

- 新线索
- 待清洗
- 有效
- 重复
- 已交付
- 无效

### 5.5 线索导入

当前为模拟导入，不是真实 Excel 导入。

导入后会模拟：

- 成功线索
- 重复线索
- 失败数量提示

### 5.6 供应商管理

用于管理汽车销售线索的渠道方和数据方。

主要给运营使用。

供应商类型：

- 渠道方
- 数据方

主要字段：

- 供应商名称
- 供应类型
- 联系人
- 电话
- 合约开始
- 合约结束
- 付款模式：预付/后付
- 账期
- 状态
- 备注

### 5.7 成交开拓基地

用于通过自有外呼中心联系主机厂各城市经销商门店，获取可供成交产能。

主要给成交开拓中心专属运营使用。

主要字段：

- 城市
- 主机厂品牌
- 经销商
- 联系人
- 电话
- 职位
- 供应车型
- 供应内容
- 供应凭证
- 供应时间
- 是否有效
- 付款方式：预付/后付
- 金额
- 量级
- 我司对接人
- 我司付款人
- 付款时间
- 状态
- 是否成功
- 失败原因
- 公司是否承担成本
- 备注

业务流程理解：

1. 开拓中心运营联系各城市经销商门店。
2. 建立联系并记录供应能力。
3. 客户有某车型需求时，发给对接门店。
4. 经销商确认是否有预计成交产能和量级。
5. 可在某个时间段内预占量级。
6. 按预付/后付方式完成交割。
7. 需要记录最终是否成功。
8. 若客户不算或失败，可能影响成交率，成本可能由公司承担。

### 5.8 报价系统

用于管理客户报价需求。

当前字段覆盖：

- 客户名称
- 需求方
- 需求时间
- 城市范围
- 车辆品牌
- 车型
- 内容类型：线索、到店、成交、政策、其他
- 需求量级
- 目标价格
- 是否需要报价
- 是否要求平安保单
- 是否支持精准下发
- 提交方式：表格、链接、二维码、其他
- 二维码转链接白名单
- 是否需要验证码
- 是否要求成交
- 成交比例
- 是否要求到店
- 判定方式
- 判定标准
- 上游报价和产能
- 自有渠道报价和产能
- 推荐报价
- 毛利率
- 销售、运营、渠道负责人
- 状态
- 需求备注
- 报价备注

报价状态：

- 新需求
- 需求确认中
- 寻源中
- 已报价
- 已赢单
- 已丢单
- 已归档

### 5.9 交付对象

用于维护可交付的下游对象，例如平台或主机厂。

### 5.10 交付批次

用于勾选线索后创建交付批次，并把对应线索状态更新为已交付。

### 5.11 权限配置占位

当前只做角色演示和预留。

后续需要真实权限时，要重新设计：

- 登录
- 用户
- 角色
- 菜单权限
- 按钮权限
- 数据权限

## 6. 智能选择能力

城市、品牌、车型已经做成智能选择方式。

相关文件：

```bash
src/components/SmartSelect.tsx
src/domain/referenceData.ts
src/domain/search.ts
```

能力：

- 支持中文搜索
- 支持拼音搜索
- 支持首字母搜索
- 支持别名搜索
- 支持手动新增没有覆盖到的城市、品牌或车型

业务约束：

- 城市只覆盖中国。
- 品牌和车型覆盖在华销售的主机厂和车型。
- 后续如新增城市、品牌、车型字段，应优先复用 SmartSelect。

## 7. 当前代码结构

核心文件：

```bash
src/App.tsx
src/App.css
src/index.css
src/app/navigation.tsx
src/components/SmartSelect.tsx
src/domain/types.ts
src/domain/mockData.ts
src/domain/helpers.ts
src/domain/formDefaults.ts
src/domain/referenceData.ts
src/domain/search.ts
src/domain/store.ts
```

说明：

- `src/App.tsx`：当前仍是主要页面入口，包含大量页面渲染、表格列、表单和业务操作逻辑。
- `src/app/navigation.tsx`：菜单、页面路径和页面 key。
- `src/domain/types.ts`：业务类型定义。
- `src/domain/mockData.ts`：前端模拟数据。
- `src/domain/helpers.ts`：状态标签、权限判断、编号生成、手机号脱敏等工具。
- `src/domain/formDefaults.ts`：默认表单值、选项配置、状态流转规则和颜色映射。
- `src/domain/referenceData.ts`：城市、品牌、车型基础数据。
- `src/domain/search.ts`：智能选择的搜索匹配逻辑。
- `src/domain/store.ts`：Zustand 前端状态。

当前 `src/App.tsx` 约 3000 行，已经做过第一轮低风险拆分，但后续仍建议继续拆页面组件。

## 8. SOP 文档现状

SOP 目录：

```bash
docs/sop/
```

已建立 SOP：

- 开发环境搭建
- 项目长期开发规范
- 页面开发流程
- 个人业务驾驶舱流程
- 客户项目管理流程
- 报价系统流程
- 线索导入流程
- 线索清洗与去重
- 线索搜索、状态流转与跟进
- 城市、品牌、车型智能选择
- 供应商管理流程
- 成交开拓基地流程
- 交付批次流程
- 发布前检查

维护规则：

- 每新增一个核心业务模块，同步新增或更新 SOP。
- 每个 SOP 要包含使用场景、操作步骤、注意事项、常见问题。
- 真实流程变化后，先更新系统，再更新 SOP，最后运行发布前检查。

## 9. GitHub 和部署状态

### 9.1 2026-07-14 Preview 验证

- 已创建非 Production Preview：<https://qixiao-auto-leads-system-cvg2l6ogd-itangchuan-9342s-projects.vercel.app>
- Vercel 部署检查显示目标为 `preview`、状态为 Ready，云端构建完成，运行日志中未发现构建失败。
- 本地 `pnpm test`（8 个测试）、`pnpm lint` 和 `pnpm build` 均通过；初始入口脚本为 233.03 kB（原始大小），低于 500 kB，页面路由与 XLSX 按需资源均已生成。
- 未认证浏览器直接访问该 Preview 时显示 `Login – Vercel`，而非应用页面。因此 `/`、`/leads` 和 `/customer-projects` 的直接访问、刷新和静态资源加载尚未完成应用级验收；在不修改 Vercel 访问策略或项目设置的前提下，不能继续验证。
- 未创建 Production 部署。后续需由有权限的负责人确认 Preview 访问策略后，再重新执行线上路由验收；通过 Preview 验收并获得明确批准前，不得发布 Production。

GitHub 已配置 SSH 推送。

曾经遇到 HTTPS 推送不稳定，后改成 SSH，已成功推送。

已知提交：

```bash
0a9e8f4 refactor: extract app navigation and domain defaults
16bb589 docs: add project governance and release workflow
1996319 feat: initialize qixiao auto leads system
```

当前本地存在 Vercel 配置：

```bash
.vercel/project.json
vercel.json
```

`vercel.json` 内容意图：

```json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist"
}
```

注意：

- `.vercel` 应该保持本地使用，不要提交到 GitHub。
- `.env*` 应该忽略，避免密钥泄露。
- 当前部署状态需要由 Vercel 控制台或 Vercel CLI 再确认。

## 10. 当前未提交改动

截至本报告生成时，工作区存在未提交改动：

```bash
 M .gitignore
 M src/App.tsx
?? vercel.json
```

含义：

- `.gitignore` 新增忽略 `.vercel` 和 `.env*`。
- `vercel.json` 是 Vercel 静态部署配置。
- `src/App.tsx` 有未提交改动，需在继续开发前先检查 diff，确认是否为部署/路由相关改动或其他代码修改。

新 APM 接手后的第一步建议：

```bash
git status --short --branch
git diff -- .gitignore src/App.tsx vercel.json
```

确认无误后再运行：

```bash
pnpm build
pnpm lint
```

## 11. 已知技术限制和风险

### 11.1 当前只是前端原型

当前数据都在前端 mock 和 Zustand 状态中，刷新页面可能丢失新增数据。

尚未接入：

- 真实数据库
- 后端 API
- 登录
- 用户权限
- 审计日志
- 文件存储
- 真实 Excel 导入解析流程

### 11.2 App.tsx 仍然偏大

虽然已抽出导航、默认值、搜索逻辑，但 `src/App.tsx` 仍是大文件。

建议下一阶段按业务页面拆分：

- `src/pages/CustomerProjectsPage.tsx`
- `src/pages/SuppliersPage.tsx`
- `src/pages/DealBasePage.tsx`
- `src/pages/QuotationsPage.tsx`
- `src/pages/LeadsPage.tsx`

### 11.3 权限还只是演示

当前角色切换是前端演示，不能作为真实权限安全边界。

### 11.4 构建包体积提示

此前 `pnpm build` 通过，但 Vite 提示 bundle 超过 500 kB。现阶段不影响开发，后续可以做动态导入和页面拆包。

### 11.5 Vercel 路由刷新问题

如果 React Router 使用 browser history，部署到 Vercel 后刷新子路由可能 404。需要确认是否已通过 `vercel.json` rewrite 解决。当前 `vercel.json` 只配置了构建命令和输出目录，尚未包含 rewrites。

如遇子页面刷新 404，可考虑：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

同时保留 Vite 构建配置。

## 12. 推荐下一阶段开发路线

### 第一阶段：整理架构

目标：让后续继续加业务模块不再堆进 `App.tsx`。

建议：

1. 先拆客户项目管理页。
2. 再拆供应商管理页。
3. 再拆成交开拓基地页。
4. 再拆报价系统页。
5. 再拆线索管理页。

每次拆分后必须运行：

```bash
pnpm build
pnpm lint
```

### 第二阶段：完善业务闭环

优先完善：

1. 客户项目管理：从需求、合同、首付款、排期、交付、结算到回款。
2. 成交开拓基地：从联系经销商、确认产能、预占、交割、成功/失败成本承担。
3. 报价系统：从客户需求到寻源报价、推荐报价、赢单/丢单。
4. 供应商管理：从供应商档案、合约、账期、状态到成本归集。

### 第三阶段：真实后端

后端可考虑：

- Supabase/Postgres
- 自建 Node/NestJS
- 或其他低代码/云数据库方案

需要引入：

- 用户登录
- 角色权限
- 数据库表结构
- 文件上传
- Excel 导入
- 操作日志
- 部署环境变量

### 第四阶段：产品化

可继续增加：

- 数据看板
- 权限后台
- 导出模板
- 审批流
- 项目结算单
- 供应商成本报表
- 客户利润报表
- 线索转化漏斗

## 13. 新 APM 对话建议起始提示词

可以把下面这段直接发给新 APM 对话：

```text
你现在接手一个名为“启效智联汽车销售线索管理系统”的项目。

本地目录是：
/Users/tangchuan/Desktop/启效智联 联效系统

请先阅读：
1. AGENTS.md
2. agent.md
3. docs/sop/README.md
4. docs/project-apm-handoff-report.md

这是一个 React + TypeScript + Vite + Ant Design 的企业管理系统前端原型，目前用 Zustand 和 mock 数据跑业务流程，后续再接后端。

当前核心业务包括：
- 工作台
- 个人业务驾驶舱
- 客户项目管理
- 线索管理
- 线索导入
- 供应商管理
- 成交开拓基地
- 报价系统
- 交付对象
- 交付批次
- SOP 文档
- 权限配置占位

请先执行：
git status --short --branch
git diff -- .gitignore src/App.tsx vercel.json

再确认当前未提交改动。任何修改代码前，必须同步考虑 SOP 是否需要更新。

开发原则：
先跑通业务闭环，再逐步增强；管理员完整权限，运营负责流程，其他角色后续细分；城市、品牌、车型字段优先使用 SmartSelect。

下一步建议优先做：
1. 确认 Vercel 部署配置是否完整。
2. 运行 pnpm build 和 pnpm lint。
3. 继续拆分 src/App.tsx，优先拆客户项目管理页。
```

## 14. 给接手 Agent 的重要提醒

1. 不要一上来重构全项目。
2. 先保护现有业务功能可用。
3. 每次拆分只拆一个模块。
4. 每次新增核心业务都要更新 SOP。
5. 任何涉及城市、品牌、车型的选择字段，优先复用 SmartSelect。
6. 不要把 `.vercel` 和 `.env*` 提交到 GitHub。
7. 当前是小白学习式项目，解释要用大白话，步骤要明确。
