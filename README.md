# 批量重命名工具

一个基于 Electron + React + TypeScript 构建的桌面应用程序，提供强大且灵活的文件批量重命名功能。

## 功能特性

### 核心功能

- **文件浏览** - 左侧树形目录结构，支持快速浏览和导航
- **批量重命名** - 支持多种重命名规则，实时预览重命名效果
- **冲突检测** - 自动检测文件名冲突和非法字符，避免重命名错误
- **撤销操作** - 支持撤销最近的重命名操作

### 重命名规则

#### 序号设置
- **数字序号** - 如 0001, 0002, 0003...
- **小写字母** - 如 a, b, c...
- **大写字母** - 如 A, B, C...
- 支持自定义起始值、步长和位数

#### 规则占位符

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{$n%04}` | 数字序号（4位补零） | 0001, 0002... |
| `{$l}` | 小写字母序号 | a, b, c... |
| `{$L}` | 大写字母序号 | A, B, C... |
| `{$f}` | 原始文件名 | photo → photo |
| `{$ext}` | 文件扩展名 | .jpg |
| `{$d}` | 当前日期 | 2024-01-15 |
| `{$t}` | 当前时间 | 14-30-00 |
| `$[old][new]$` | 文本替换 | 将 old 替换为 new |

#### 示例规则

```
{$n%04}-{$f}{$ext}        → 0001-photo.jpg
{$L}_{$f}{$ext}           → A_photo.jpg
{$d}_{$f}{$ext}           → 2024-01-15_photo.jpg
{$f}$[old][new]${$ext}    → phnew.jpg (将 old 替换为 new)
```

### 其他功能

- **标签管理** - 创建自定义标签，快速插入到文件名中
- **收藏夹** - 收藏常用目录，快速访问
- **主题切换** - 支持浅色/深色主题
- **快捷键支持** - 提高操作效率

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React 18** - UI 组件库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Vite** - 构建工具
- **Vitest** - 测试框架

## 安装与运行

### 环境要求

- Node.js >= 18
- npm >= 9

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建打包

```bash
# 构建 Vite
npm run build:vite

# 构建 Windows 安装包
npm run build:win

# 打包 Windows 可执行文件（不含安装程序）
npm run package:win
```

### 其他命令

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run typecheck

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

## 项目结构

```
batch-rename/
├── electron/               # Electron 主进程
│   ├── main.ts            # 主进程入口
│   ├── preload.ts         # 预加载脚本
│   ├── ipc/               # IPC 通信处理
│   └── services/          # 后端服务
│       ├── config.ts      # 配置服务
│       ├── fileSystem.ts  # 文件系统操作
│       ├── history.ts     # 历史记录
│       ├── logger.ts      # 日志服务
│       └── version.ts     # 版本信息
├── src/                   # 渲染进程（React）
│   ├── components/        # UI 组件
│   │   ├── FileList.tsx   # 文件列表
│   │   ├── RulePanel.tsx  # 规则面板
│   │   ├── TreePanel.tsx  # 目录树
│   │   └── ...
│   ├── hooks/             # 自定义 Hooks
│   ├── stores/            # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   │   ├── ruleEngine.ts  # 重命名规则引擎
│   │   ├── ruleParser.ts  # 规则解析器
│   │   └── ...
│   ├── App.tsx            # 应用入口
│   └── main.tsx           # React 入口
├── build/                 # 构建资源
├── index.html             # HTML 模板
└── package.json           # 项目配置
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建文件 |
| `Ctrl+Shift+N` | 新建文件夹 |
| `Ctrl+O` | 打开文件 |
| `Ctrl+K` | 打开目录 |
| `Ctrl+S` | 保存 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Enter` | 执行重命名 |
| `Ctrl+W` | 关闭窗口 |

## 许可证

[MIT](LICENSE)

## 作者

Developer
