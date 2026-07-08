# 启效智联汽车销售线索管理系统

这是一个基于 React、TypeScript、Vite 和 Ant Design 的企业管理系统前端原型。第一版用于学习和验证汽车销售线索的内部管理流程。

## 当前范围

- 工作台统计
- 客户项目管理
- 线索管理
- 线索导入模拟
- 线索清洗与重复提示
- 供应商管理
- 成交开拓基地
- 交付对象管理
- 交付批次管理
- 管理员、运营、其他角色的权限演示
- SOP 工作流程手册

## 当前技术架构

- 前端框架：React 19 + TypeScript + Vite
- UI 组件：Ant Design + Ant Design Pro Components
- 路由：React Router
- 状态管理：Zustand
- 数据形态：当前以前端 mock 数据为主，后续再接后端

## 本地启动

```bash
pnpm install
pnpm dev
```

默认开发地址一般是：

```bash
http://127.0.0.1:5173
```

## 发布前检查

```bash
pnpm build
pnpm lint
```

## Git 提交流程

第一次已经完成 GitHub 绑定后，后续每次更新都按下面做：

```bash
git add .
git commit -m "feat: 你的本次更新说明"
git push
```

常见提交说明可以这样写：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `refactor:` 重构但不改业务结果

## 推荐开发顺序

1. 先梳理业务目标和操作流程。
2. 再确认字段、筛选项、角色和按钮。
3. 先补 `src/domain/types.ts` 的类型。
4. 再补 `src/domain/mockData.ts` 的模拟数据。
5. 然后开发页面和交互。
6. 同步更新 `docs/sop/`。
7. 最后执行 `pnpm build` 和 `pnpm lint`。

## 重要文档

- `agent.md`：Agent 协作与开发规则
- `docs/sop/README.md`：工作流程手册入口
- `docs/sop/project-governance.md`：长期开发规范
- `docs/sop/release-checklist.md`：发布前检查清单
