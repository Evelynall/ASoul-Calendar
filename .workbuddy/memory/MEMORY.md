# 项目长期记忆

## 项目信息
- **项目名称**：枝江日程表（ASoul Calendar）
- **仓库**：`c:\Tools\Elements\Evelynall\枝江日程表\枝江日程表-工程`
- **技术栈**：React 19 + Vite + TailwindCSS + Supabase

## 技术决策记录

### base-schedules.json 拉取策略（2026-03-27）
- 数据仓库：`Evelynall/ASoul-Data`，分支 `main`，文件 `base-schedules.json`
- **主URL**：`gh-proxy.org` 代理 `raw.githubusercontent.com`（实时，无CDN缓存延迟）
- **备用URL**：`raw.githubusercontent.com` → jsDelivr 系列（有最长24小时CDN缓存延迟）
- 历史问题：原主URL使用 jsDelivr `@main`，CDN 约 24 小时刷新一次，数据仓库更新后无法及时生效
- 本地缓存策略：localStorage，2小时有效期，stale-while-revalidate 模式

### UpData 独立页面（2026-04-09）
- 路径：`public/UpData.html`，通过 `/ASoul-Calendar/UpData` 或 `/ASoul-Calendar/UpData.html` 访问
- 完全独立的 HTML 页面（无 React 依赖），使用 Tailwind CDN
- 功能：搜索基础日程 → 选择日程 → 标记完成/添加备注 → 生成 JSON → 通过 GitHub API 触发 `patch-schedule.yml` workflow
- 每次提交需输入 GitHub Token，不保存
- patch_data 格式：数组形式 `[{"id":"...","completed":true,"note":"..."}]`

### 冲突解决惯例
- 有本地未提交修改时，若需拉最新：`git fetch origin && git reset --hard origin/main`
