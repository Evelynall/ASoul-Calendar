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

### 冲突解决惯例
- 有本地未提交修改时，若需拉最新：`git fetch origin && git reset --hard origin/main`
