# 启效智联线索系统 Agent 协作规则

## 项目目标

本项目用于从 0 开始学习并开发一个企业内部使用的汽车销售线索管理系统。第一版是前端原型，重点跑通线索录入、导入、清洗、去重、交付批次和 SOP 管理流程。

## 当前技术栈

- React + TypeScript + Vite
- Ant Design + Ant Design Pro Components
- 前端 mock/state 数据
- 后续再接真实后端、数据库和权限服务

## 开发原则

- 先做能跑通业务闭环的最小版本，再逐步增强。
- 管理员默认完整权限；运营负责流程；其他角色先预留结构。
- 每次新增核心业务流程，都要同步更新 `docs/sop/`。
- 不在第一版引入复杂后端、第三方接口或真实 Excel 解析，除非用户明确要求。
- 页面优先使用 Ant Design 组件，不手写复杂基础控件。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## 文件约定

- `src/App.tsx`：当前前端原型主入口。
- `src/domain/types.ts`：业务类型定义。
- `src/domain/mockData.ts`：模拟数据。
- `src/domain/helpers.ts`：状态、权限、脱敏、编号等工具函数。
- `docs/sop/`：工作流程手册。

## 发布前检查

每次准备交付前至少执行：

```bash
pnpm build
pnpm lint
```

并人工检查：

- 页面能打开。
- 菜单能切换。
- 新增/编辑线索可用。
- 重复手机号能提示。
- 角色切换后手机号显示符合权限。
- 交付批次能创建。
- SOP 与最新流程一致。
