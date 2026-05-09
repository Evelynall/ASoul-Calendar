# 枝江日程表工程 - 长期记忆

## 项目概况
- 技术栈：React + Vite + Tailwind CSS，单页应用，核心逻辑集中在 `src/App.jsx`（约 2500+ 行）
- 数据存储：双存储（localStorage 主存储 + IndexedDB 备份），三级云同步（JSON导出/GitHub Gist/Supabase）
- 日程数据分两层：基础日程库（GitHub 远程 JSON）+ 用户数据（asoul_user_data）

## 已实现功能记录

### URL 参数设置日程链接（2026-05-08，迭代更新）
在 `src/App.jsx` 中添加了 `useEffect` + `applyScheduleLink` useCallback，通过 URL 参数为指定日程添加跳转链接，支持模糊 ID 匹配。

**URL 格式：**
```
https://your-app-url/?set_link=<scheduleId>&link=<encodedUrl>
```

**参数说明：**
- `set_link`：目标日程的 `id` 字段（支持模糊）
- `link`：要设置的链接（需 URL 编码，`encodeURIComponent()`）

**ID 模糊匹配逻辑（ID 格式：`20260504-0900-bella@asoul.love`）：**
1. 先精确匹配
2. 按日期 + 标识符过滤同组，再按小时前缀（如 `09`）匹配
3. 收到 `0000` 或同小时内有多个候选 → `setLinkCandidateModal` 弹窗列出所有候选供用户点选

**行为：**
- 等待数据加载完毕后执行，只处理一次（useRef 防重）
- 处理完毕后清除 URL 参数（`history.replaceState`）
- 日历日程：自动跳转到该日程所在周；追番日程：切换到追番表视图
- 成功/失败/歧义均有弹窗提示

## 日程数据结构
- `id`：唯一标识，基础日程格式如 `schedule-2024-03-07-20-00-001`，用户创建为 `manual-...`
- `link`：用户自定义跳转链接（区别于系统自带的 `liveRoomUrl`/`dynamicUrl`）
- `isBaseSchedule`：来自基础日程库；`isUserCreated`：用户手动创建
- 日期格式：`YYYY/MM/DD`，追番日程日期为 `追番/追番`
