# GitHub Gist 同步功能使用指南

## 功能说明

现在你的 A-SOUL 追番表应用已经支持通过 GitHub Gist 在多设备间同步数据了！

## 使用步骤

### 1. 创建 GitHub Personal Access Token

1. 访问 [GitHub Token 创建页面](https://github.com/settings/tokens/new?description=ASoul%20Calendar&scopes=gist)
2. 确保勾选 `gist` 权限
3. 点击 "Generate token" 生成 Token
4. **重要：** 复制生成的 Token（格式类似 `ghp_xxxxxxxxxxxxxxxxxxxx`），这个 Token 只会显示一次

### 2. 配置同步

1. 在应用中点击右上角的设置按钮
2. 找到 "GitHub Gist 云同步" 部分
3. 将复制的 Token 粘贴到 "GitHub Token" 输入框
4. Gist ID 可以留空（首次同步会自动生成）

### 3. 同步数据

应用提供三种同步方式：

#### 上传到 Gist
- 将当前本地数据上传到 GitHub Gist
- 首次使用会自动创建一个新的 Gist，并保存 Gist ID
- 后续使用会更新已有的 Gist

#### 合并 Gist 数据
- 从 Gist 下载数据并与本地数据合并
- 不会删除本地已有的数据
- 只会添加本地不存在的新日程

#### 替换为 Gist
- 用 Gist 中的数据完全替换本地数据
- 会删除本地所有数据并用 Gist 数据替换
- 适合在新设备上恢复数据

## 多设备同步流程

### 设备 A（主设备）
1. 配置 Token
2. 点击 "上传到 Gist" 将数据上传
3. 记录生成的 Gist ID（会自动保存）

### 设备 B（新设备）
1. 配置相同的 Token
2. 填入设备 A 的 Gist ID
3. 点击 "替换为 Gist" 下载数据

### 日常使用
- 在任一设备修改数据后，点击 "上传到 Gist" 同步
- 在其他设备上点击 "合并 Gist 数据" 获取最新数据

## 注意事项

1. **Token 安全**：请妥善保管你的 GitHub Token，不要分享给他人
2. **数据隐私**：Gist 默认创建为私有（private），只有你能访问
3. **冲突处理**：如果多设备同时修改，建议手动处理冲突（先下载，再上传）
4. **备份建议**：定期使用 "导出全部" 功能备份数据到本地

## 技术细节

- 数据存储在 GitHub Gist 的 `asoul-calendar-data.json` 文件中
- 使用 GitHub API v3 进行数据同步
- Token 和 Gist ID 保存在浏览器本地存储中
- 支持自动创建和更新 Gist

## 常见问题

**Q: Token 权限不足怎么办？**
A: 确保创建 Token 时勾选了 `gist` 权限。

**Q: 如何在多个设备间共享数据？**
A: 在主设备上传数据后，将 Gist ID 复制到其他设备即可。

**Q: 数据会丢失吗？**
A: 只要 Token 有效且 Gist 存在，数据就不会丢失。建议定期导出备份。

**Q: 可以手动查看 Gist 吗？**
A: 可以，访问 `https://gist.github.com/你的用户名/你的GistID` 即可查看。
