# Online Notepad & File Manager — 部署与说明文档

🌐 **[日本語 (Japanese)](README.md) | [简体中文 (Simplified Chinese)](README_zh.md)**

带密码保护的多功能在线记事本与文件管理系统。
支持运行于 JAIST 共享 Web 服务器（Solaris 10 / Perl CGI）环境以及 Linux / Unix / macOS 环境。

---

## ✨ 主要功能

- **多语言即时切换 (Trilingual i18n Support)**
  - 🇯🇵 **日语 (Japanese, 默认)** | 🇨🇳 **中文 (Simplified Chinese)** | 🇺🇸 **英语 (English)**
  - 国旗图标分段控制条 UI（`[ 🇯🇵 日本語 | 🇨🇳 中文 | 🇺🇸 EN ]`）
  - 实时语言无缝切换（基于 DOM `data-i18n` 属性绑定）与 `localStorage` 语言偏好自动持久化
  - 涵盖侧边栏、工具栏、弹窗 Modal、底部状态栏、Toast 通知、服务器仪表盘及压缩包解压提示的全量多语言国际化

- **记事本功能 (Notepad)**
  - 支持 `.txt`（纯文本）与 `.md`（Markdown）格式
  - 实时 Markdown 渲染预览、快捷工具栏、编辑器快捷键（`Ctrl+B`, `Ctrl+I`, `Ctrl+K`, `Ctrl+Shift+P`）
  - 笔记列表右键上下文菜单（**重命名** / **删除**）
  - Markdown 目录大纲 (TOC) 自动生成与平滑滚动跳转
  - 离线草稿自动暂存（`localStorage`）与一键恢复提示
  - 笔记的自动加载、保存、重命名与删除

- **文件管理 (File Manager)**
  - 文件上传、删除、直链 URL 一键复制
  - 实时文件名模糊搜索框与分类标签筛选器（图片 / 文档 / 压缩包 / 视频）
  - 全屏毛玻璃拖拽上传覆盖层（Drag & Drop Overlay）
  - 磁盘存储容量可视化仪表盘（已用/可用/总容量/使用率进度条）

- **多格式全屏预览 (Lightbox)**
  - **图片**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`
  - **视频**: `.mp4`, `.webm`, `.ogg`, `.mov`（内联播放）
  - **PDF**: 内置 PDF 阅读器展示
  - **Office 文档**: `.ppt`, `.pptx`, `.doc`, `.docx`, `.xls`, `.xlsx`（集成 Microsoft Office Online 查看器）
  - **压缩包**: `.zip`, `.7z`, `.rar`, `.tar`, `.gz`, `.epub`, `.jar`（类 Windows 资源管理器多层级树状展开、中日文字符乱码自动修复 `fixEncoding`、加密 7z 密码解密、包内 PDF/图片/文本无损解压预览）

- **服务器系统信息仪表盘 (Server Info)**
  - CPU 配置（核心数、平均负载 Load Average、架构）
  - 物理内存 / 可用内存 (RAM)
  - 活跃进程数、OS & 内核版本、主机名、运行时间 Uptime、Perl 版本

- **安全性与兼容性**
  - 带 Salt 加盐的哈希保护
  - 服务端 Session 管理（HttpOnly + SameSite=Strict）
  - 路径穿越攻击防护
  - POSIX 兼容 Shebang (`#!/usr/bin/env perl`) 以及 `.gitattributes` 强制 LF 换行符保护

---

## 🕒 最近修复与更新日志 (Change Log)

- **三语言无缝切换（日语·中文·英语）及 i18n 模块架构**
  - 新增 `js/modules/i18n.js` 国际化模块。支持基于国旗图标分段组件（`[ 🇯🇵 日本語 | 🇨🇳 中文 | 🇺🇸 EN ]`）的即时语言切换与偏好持久化。
- **笔记右键上下文菜单（重命名·删除）功能**
  - 支持侧边栏笔记列表项右键操作。通过纯文本优雅排版的上下文菜单，提供快速重命名与二次确认删除功能。
- **Tab 标签切换时笔记标题误覆盖 BUG 修复**
  - 彻底修复从文件 / 服务器 Dashboard 仪表盘切回笔记视图时，当前激活笔记标题被临时服务器名称覆盖的 BUG。
- **前端架构 ES Modules 模块化重构**
  - 将原单文件 `app.js`（1500+行）重构解耦为 `js/main.js` 及 `js/modules/`（包含 i18n、API、Theme、Notepad、FileManager、TreeExplorer、Lightbox 等七大模块）。
- **WebAssembly 动态按需延迟加载 (Lazy Loading)**
  - 将 `libarchive.wasm` 模块改为仅在用户首次点击 `.7z` 预览时动态 `import()` 加载，大幅提升首屏加载速度。
- **Windows 资源管理器风格树状预览 & 乱码自动修复 (`fixEncoding`)**
  - 压缩包预览全面升级为多层级可折叠树状结构。针对 Windows 打包的 GBK / CP1252 编码文件，增加智能 `TextDecoder` 中日文乱码自动修复。

---

## 📁 文件结构

```
Online_Notepad/
├── index.html          ← 主 HTML 页面
├── style.css           ← 现代 CSS 样式表
├── js/                 ← 前端 ES Modules 目录
│   ├── main.js         ← 主入口文件
│   └── modules/
│       ├── i18n.js         ← 国际化 (i18n) 模块 (ja / zh / en 字典管理与 DOM 动态更新)
│       ├── api.js          ← API 通信与工具函数 (AbortController 超时控制)
│       ├── theme.js        ← 主题切换管理 (Light / Dark / Sumeru)
│       ├── notepad.js      ← 记事本 CRUD、右键菜单、Markdown 编辑器与 TOC 目录
│       ├── fileManager.js  ← 文件管理、搜索/分类筛选器与拖拽上传覆盖层
│       ├── treeExplorer.js ← Windows 风格压缩包树状视图与 WASM 按需懒加载
│       └── lightbox.js     ← 全屏预览 Modal
├── icon.png            ← 网站 Icon 图标
├── Xumi.webp / nahida.webp ← 自定义主题背景图
├── setup.pl            ← 安装初始化脚本
├── libarchive/         ← .7z 压缩包解压用 JS/WASM 模块 (WebAssembly 动态懒加载)
│   ├── main.js
│   ├── worker-bundle.js
│   └── libarchive.wasm
├── cgi-bin/
│   ├── auth.pl         ← 身份认证 API (chmod 755)
│   ├── notes.pl        ← 笔记 CRUD API (chmod 755)
│   └── upload.pl       ← 文件上传与服务器信息 API (chmod 755)
├── notes/              ← 笔记存储目录 (chmod 755)
└── uploads/            ← 上传文件存储目录 (chmod 755)
```

---

## 🚀 部署步骤

### 1. 上传文件

通过 SCP 或 SFTP（WinSCP / Cyberduck 等）将 `Online_Notepad/` 目录完整上传至服务器：

```bash
# SCP 示例
scp -r Online_Notepad/ 用户名@sshserv.jaist.ac.jp:~/public_html/
```

### 2. 首次初始化（SSH）

```bash
ssh 用户名@sshserv.jaist.ac.jp
cd ~/public_html/Online_Notepad
perl setup.pl
```

### 3. 权限设置

请确认 CGI 脚本与存储目录的权限：

```bash
chmod 755 cgi-bin/auth.pl cgi-bin/notes.pl cgi-bin/upload.pl
chmod 755 notes/ uploads/
```
