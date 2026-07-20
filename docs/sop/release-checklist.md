# 发布前检查 SOP

## 使用场景

每次准备让用户试用、演示或继续开发前。

## 操作步骤

1. 运行构建检查：`pnpm build`。
2. 运行代码检查：`pnpm lint`。
3. 运行测试：`pnpm test`。
4. 启动本地服务：`pnpm dev`。
4. 打开工作台，确认统计卡片显示正常。
5. 打开客户项目管理，测试搜索、新增、编辑、详情和状态流转。
6. 打开线索管理，测试新增、编辑、搜索、详情。
7. 测试城市、品牌、车型选择框支持中文、拼音和首字母搜索。
8. 测试重复手机号提示。
9. 测试状态流转：新线索 → 待清洗 → 有效 → 已交付 / 无效。
10. 打开线索详情，添加一条跟进记录。
12. 切换管理员、运营、其他角色，检查手机号显示和按钮权限；其他角色不能打开线索编辑。
12. 模拟导入线索。
13. 打开供应商管理，测试搜索、新增、编辑和详情。
14. 打开成交开拓基地，测试搜索、新增、状态流转和详情风险提示。
16. 仅勾选有效线索并创建交付批次；确认重复、无效和已交付线索不可勾选。
16. 查看 SOP 页面，确认文档入口存在。
17. 如需发布到 GitHub，先执行 `git status` 检查改动。
18. 提交代码：`git add . && git commit -m "本次更新说明"`。
19. 推送代码：`git push`。

## Cloudflare Pages 自动发布

GitHub 仓库的 `main` 分支使用 `.github/workflows/cloudflare-pages.yml` 自动发布到 Cloudflare Pages。

1. GitHub Actions 中必须配置 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 两个 Repository Secret。
2. Cloudflare Token 仅授予当前账户的 `Cloudflare Pages: Edit` 权限，不得写入仓库、文档或日志。
3. 推送到 `main` 后，Actions 依次执行安装、测试、代码检查、构建和 Production 发布。任何一步失败都不得继续发布。
4. 发布目标是 `qixiao-auto-leads-system` Pages 项目，线上域名是 `https://qinuo.hgengine.dpdns.org`。
5. 发布完成后，直接打开并刷新 `/`、`/login` 和 `/leads`，确认 HTTPS、静态资源、浏览器控制台和手机布局正常。

## Vercel Preview 与 Production

在完成本地检查后，按以下顺序进行线上发布验证：

1. 使用临时 CLI 确认工具和当前登录账号：`pnpm dlx vercel@latest --version`、`pnpm dlx vercel@latest whoami`。账号或项目绑定与当前发布目标不一致时停止发布并联系管理员，不要重新绑定项目。
2. 确认 `vercel.json` 使用 Vite 构建、`dist` 输出目录和单页应用 rewrite；`.vercel/` 与 `.env*` 必须保持未跟踪。
3. 创建 Preview：`pnpm dlx vercel@latest --yes`。记录命令输出的 Preview 地址，但不记录任何令牌、环境变量或项目私密标识。
4. 检查部署：`pnpm dlx vercel@latest inspect <preview-url>`；需要排查时使用 `pnpm dlx vercel@latest logs <preview-url>`。
5. 在 Preview 直接打开并刷新 `/`、`/leads` 和 `/customer-projects`，确认静态资源、页面和浏览器控制台正常；完成桌面与移动端关键流程验收后，向用户汇报 Preview 结果和剩余风险。
6. **暂停等待用户明确批准。** 只有收到 Production 批准后，才可执行 `pnpm dlx vercel@latest --prod --yes`。
7. Production 完成后，再次直接打开并刷新上述三个路由，记录最终线上地址、构建结果、测试结果和剩余风险。

## 注意事项

- 构建失败不能发布。
- 业务流程和 SOP 不一致时，先修正 SOP。
- 第一版是前端原型，刷新后数据可能丢失。
- 如果 HTTPS 推送不稳定，优先使用 SSH 推送 GitHub。
- Preview 验证通过不等同于 Production 发布批准；未经用户明确确认，不得执行带 `--prod` 的命令。

## 常见问题

- 页面样式错乱：检查 Ant Design 样式是否引入。
- 按钮无效：检查当前角色是否有权限。
- 表格横向溢出：确认表格已设置横向滚动。
- GitHub 推送失败：先检查网络，再确认 SSH 是否已配置。
