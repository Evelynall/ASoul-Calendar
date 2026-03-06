# 基础日程库格式说明

## 概述

基础日程库是一个托管在 GitHub 上的 JSON 文件，包含所有公共的日程数据。用户打开页面时会自动拉取这个文件。

## JSON 格式

```json
{
  "version": "20240307001",
  "schedules": [
    {
      "id": "schedule-2024-03-07-20-00-001",
      "date": "2024/03/07",
      "time": "20:00",
      "type": "直播",
      "subTitle": "嘉然今天吃什么",
      "title": "《嘉然的奇妙冒险》第10期",
      "category": "嘉然",
      "dynamicUrl": "https://www.bilibili.com/opus/123456789",
      "liveRoomUrl": "https://live.bilibili.com/22637261",
      "isAnime": false
    },
    {
      "id": "schedule-2024-03-08-19-00-002",
      "date": "2024/03/08",
      "time": "19:00",
      "type": "直播",
      "subTitle": "贝拉kira",
      "title": "游戏直播",
      "category": "贝拉",
      "liveRoomUrl": "https://live.bilibili.com/22632424",
      "isAnime": false
    }
  ]
}
```

## 字段说明

### 根对象
- `version` (string): 版本号，建议使用时间戳格式 `YYYYMMDDxxx`
- `schedules` (array): 日程数组

### 日程对象
- `id` (string, 必需): 唯一标识符，建议格式 `schedule-YYYY-MM-DD-HH-MM-序号`
- `date` (string, 必需): 日期，格式 `YYYY/MM/DD`
- `time` (string, 必需): 时间，格式 `HH:MM`
- `type` (string, 必需): 类型，如 "直播"、"动态"、"视频" 等
- `subTitle` (string): 副标题
- `title` (string, 必需): 主标题
- `category` (string, 必需): 成员分类，可选值：
  - 单个成员: "贝拉"、"嘉然"、"乃琳"、"思诺"、"心宜"
  - 组合: "A-SOUL"、"小心思"
  - 多成员: "贝拉+嘉然"、"嘉然+乃琳" 等
  - 其他: "其他"
- `dynamicUrl` (string, 可选): B站动态链接
- `liveRoomUrl` (string, 可选): 直播间链接
- `link` (string, 可选): 其他跳转链接
- `isAnime` (boolean, 可选): 是否为追番日程，默认 false

## 注意事项

1. **ID 唯一性**: 每个日程的 `id` 必须全局唯一，建议包含日期时间信息
2. **版本号**: 每次更新基础日程库时应更新 `version` 字段
3. **日期格式**: 统一使用 `YYYY/MM/DD` 格式，不要使用 `-` 分隔
4. **时间格式**: 使用 24 小时制，格式 `HH:MM`
5. **URL 完整性**: 所有 URL 应包含完整的协议头 `https://`

## 托管方式

### 方式一：GitHub Pages（推荐）

1. 创建一个 GitHub 仓库
2. 将 JSON 文件命名为 `base-schedules.json`
3. 启用 GitHub Pages
4. 访问地址：`https://YOUR_USERNAME.github.io/YOUR_REPO/base-schedules.json`

### 方式二：GitHub Raw

1. 将 JSON 文件上传到 GitHub 仓库
2. 访问地址：`https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/base-schedules.json`

### 方式三：GitHub Gist

1. 创建一个公开的 Gist
2. 访问地址：`https://gist.githubusercontent.com/YOUR_USERNAME/GIST_ID/raw/base-schedules.json`

## 更新流程

1. 编辑 `base-schedules.json` 文件
2. 更新 `version` 字段
3. 提交到 GitHub
4. 用户打开页面时会自动拉取最新版本

## 用户数据

用户的以下数据会保存在本地，不会被基础日程库覆盖：
- 完成状态 (`completed`)
- 备注内容 (`note`)
- 自定义链接 (`link`)
- 收藏状态 (`isFavorite`)
- 用户自己添加的日程

## 示例脚本

### 生成基础日程库

```javascript
// 从现有数据生成基础日程库
const schedules = [...]; // 你的日程数据
const baseSchedules = {
  version: new Date().toISOString().replace(/[\-:T.]/g, '').slice(0, 14),
  schedules: schedules.map(s => ({
    id: s.id,
    date: s.date,
    time: s.time,
    type: s.type,
    subTitle: s.subTitle,
    title: s.title,
    category: s.category,
    dynamicUrl: s.dynamicUrl || '',
    liveRoomUrl: s.liveRoomUrl || '',
    isAnime: s.isAnime || false
  }))
};

console.log(JSON.stringify(baseSchedules, null, 2));
```

## 配置应用

在 `src/App.jsx` 中修改基础日程库地址：

```javascript
const BASE_SCHEDULES_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/base-schedules.json';
```
