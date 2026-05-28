# 桌宠功能说明

## 功能概述

枝江日程表的桌宠功能是一个可交互的页面组件，支持多角色切换，响应鼠标和键盘操作，并提供对话框提示功能。

## 文件结构

```
src/
└── pet/
    ├── Pet.jsx              # 桌宠主组件
    └── Pet.css              # 桌宠样式文件

public/
└── pet/
    └── img/
        ├── text-boxs.png    # 对话框背景图
        ├── 贝拉/            # 贝拉角色图片
        ├── 嘉然/            # 嘉然角色图片
        ├── 乃琳/            # 乃琳角色图片
        ├── 心宜/            # 心宜角色图片
        └── 思诺/            # 思诺角色图片
```

## 角色图片说明

每个角色文件夹包含以下图片：

- `bgImage.png` - 背景图层
- `keyboardImage.png` - 键盘操作图层
- `mouseImage.png` - 鼠标移动图层
- `leftClickImage.png` - 左键点击效果
- `rightClickImage.png` - 右键点击效果

## 功能特性

### 1. 基础交互
- **拖拽移动**：左键拖拽桌宠可以在页面上自由移动
- **百分比定位**：使用百分比定位，适配不同分辨率屏幕
- **边界限制**：自动限制在屏幕范围内，不会拖出窗外
- **位置保存**：位置会保存到 localStorage，刷新后保持不变

### 2. 响应式动作
- **键盘操作**：按下键盘时，键盘图层会有按压动画
- **鼠标移动**：鼠标图层会跟随页面鼠标移动产生偏移
- **点击效果**：鼠标点击时，对应按键会显示点击效果

### 3. 右键菜单
右键点击桌宠可以打开菜单，提供以下功能：

- **重置位置**：将桌宠重置到默认位置（屏幕右下角）
- **切换角色**：可选择贝拉、嘉然、乃琳、心宜、思诺五个角色
- **想要同款？**：跳转到相关视频链接
- **测试单个对话框**：测试单个对话框功能
- **测试多个对话框**：测试多个对话框堆叠效果
- **关闭所有对话框**：关闭当前显示的所有对话框
- **隐藏桌宠**：隐藏桌宠（可在设置中重新开启）

### 4. 对话框系统
- **单条消息**：支持显示单个对话框
- **多条堆叠**：支持多条消息向上堆叠显示
- **文本内容**：支持自定义文本内容和样式
- **超链接**：支持嵌入可点击的超链接
- **点击事件**：支持自定义点击回调函数
- **自动关闭**：点击对话框可自动关闭
- **独立关闭**：每个对话框可独立关闭
- **批量关闭**：支持一次性关闭所有对话框

### 5. 响应式设计
- **手机模式**：在小屏幕设备上自动隐藏桌宠
- **开关控制**：可在设置中开启/关闭桌宠功能

## 使用方法

### 基本使用

在 `App.jsx` 中引入并使用桌宠组件：

```jsx
import Pet from './pet/Pet';

function App() {
  const [petEnabled, setPetEnabled] = useState(() => {
    const saved = localStorage.getItem('pet_enabled');
    return saved !== 'false';
  });

  return (
    <div>
      {/* 其他组件 */}
      <Pet
        isEnabled={petEnabled}
        onToggleEnabled={setPetEnabled}
      />
    </div>
  );
}
```

### 显示对话框

通过 `showDialog` 函数显示对话框（需要通过 ref 或其他方式暴露该函数）：

```jsx
// 显示单个对话框
showDialog({
  content: [
    { text: '这是一条消息', style: { fontSize: '14px', fontWeight: 'bold' } },
    { text: '\n\n' },
    { type: 'link', text: '点击跳转', url: 'https://example.com', style: { color: '#1890ff' } }
  ],
  onClick: () => console.log('对话框被点击了'),
  closeOnClick: true
});
```

#### 对话框参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | Array | 是 | 对话框内容数组 |
| `onClick` | Function | 否 | 点击对话框时的回调 |
| `closeOnClick` | Boolean | 否 | 点击时是否自动关闭，默认为 true |

#### 内容项格式

**文本项：**
```jsx
{
  text: '文本内容',
  style: { /* 可选的 CSS 样式 */ },
  className: '可选的类名'
}
```

**链接项：**
```jsx
{
  type: 'link',
  text: '链接文字',
  url: 'https://example.com',
  style: { /* 可选的 CSS 样式 */ }
}
```

## 配置说明

### 修改默认位置

在 `Pet.jsx` 中修改 `getDefaultPosition` 函数：

```jsx
const getDefaultPosition = () => {
  // ...
  return { x: 88, y: 75, unit: '%' }; // 调整这里的百分比
};
```

### 修改对话框堆叠高度

在 `Pet.jsx` 顶部修改常量：

```jsx
const DIALOG_STACK_HEIGHT = 25; // 调整堆叠高度（像素）
```

### 修改对话框位置

在 `PetDialog` 组件中修改样式：

```jsx
top: `calc(${petPosition.y}% - 40px - ${index * DIALOG_STACK_HEIGHT}px)`,
```

## 自定义角色

1. 在 `public/pet/img/` 下创建新角色文件夹
2. 放入 5 张对应图片
3. 在 `Pet.jsx` 中添加角色名称到 `CHARACTERS` 数组：

```jsx
const CHARACTERS = ['贝拉', '嘉然', '乃琳', '心宜', '思诺', '新角色'];
```

## 注意事项

- 桌宠使用 `fixed` 定位，会悬浮在所有内容之上
- 移动端会自动隐藏以节省空间
- 位置和角色选择会自动保存到 `localStorage`
- 对话框的 z-index 会根据索引递增，确保新对话框在最上层

## 参考项目

本桌宠功能参考了 ASoul-Little-Bun 项目的设计思路。
