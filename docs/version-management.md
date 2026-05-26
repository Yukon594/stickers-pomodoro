# 贴纸番茄钟 Git 与发版说明

这份文档是给第一次使用 Git 的自己准备的。

## 1. 唯一主仓库

以后只在下面这个目录继续开发：

```text
/Users/liuyuhang/Cursor/贴纸番茄钟-1.0-improved
```

不要再新建 `1.0-final`、`1.1-new`、`最新最终版` 这种目录来表示版本。

正确做法是：

- 目录保持不变
- 改动用 `commit` 记录
- 发布版本用 `tag`
- 安装包用 GitHub Release 管理

## 2. 先记住 6 个最常用命令

每次都先进入主仓库：

```bash
cd /Users/liuyuhang/Cursor/贴纸番茄钟-1.0-improved
```

查看当前状态：

```bash
git status
```

先拉取最新远端代码：

```bash
git pull --ff-only origin main
```

把当前改动加入暂存区：

```bash
git add -A
```

提交一次改动：

```bash
git commit -m "feat: 描述这次改了什么"
```

推送到 GitHub：

```bash
git push origin main
```

查看历史：

```bash
git log --oneline --decorate -n 10
```

## 3. 你可以把 Git 理解成什么

- `git status`：看现在有没有改动、哪些文件改了
- `git add -A`：告诉 Git，这些改动我要记录
- `git commit`：拍一张“版本快照”
- `git push`：把本地快照同步到 GitHub
- `git pull`：把 GitHub 上的新内容同步回本地
- `git tag`：给某个正式版本贴标签，比如 `v1.1.0`

## 4. 每次开发都照这个顺序

### 日常开发流程

1. 进入主仓库

```bash
cd /Users/liuyuhang/Cursor/贴纸番茄钟-1.0-improved
```

2. 先同步最新代码

```bash
git pull --ff-only origin main
```

3. 看一下仓库是否干净

```bash
git status
```

如果看到 `working tree clean`，说明仓库是干净的，可以开始改。

4. 修改代码后，先运行检查

```bash
npm test
npm run build
```

如果你改了 Tauri 或桌面打包相关内容，再加一条：

```bash
npm run tauri build
```

5. 记录版本

```bash
git add -A
git commit -m "feat: 添加今日面板交互优化"
git push origin main
```

## 5. 正式发版怎么做

假设你下一次要发布 `v1.2.0`：

### 第一步：改版本号

需要同时检查这两个文件里的版本号：

- `package.json`
- `src-tauri/tauri.conf.json`

它们通常都应该从 `1.1.0` 改成 `1.2.0`。

### 第二步：运行验证

```bash
npm test
npm run build
npm run tauri build
```

### 第三步：提交

```bash
git add -A
git commit -m "release: v1.2.0"
git push origin main
```

### 第四步：打标签

```bash
git tag -a v1.2.0 -m "Sticker Pomodoro v1.2.0"
git push origin v1.2.0
```

### 第五步：上传安装包

打包完成后，DMG 通常在类似下面的位置：

```text
src-tauri/target/release/bundle/dmg/
```

然后去 GitHub Releases 页面：

1. 选择刚刚的 `v1.2.0` tag
2. 新建 Release
3. 上传 `.dmg`
4. 写版本说明
5. 发布

## 6. 已经帮你整理好的当前规则

- 当前正式开发分支：`main`
- 当前远端：`origin`
- 当前已存在正式标签：`v1.1.0`
- 当前主仓库目录：`/Users/liuyuhang/Cursor/贴纸番茄钟-1.0-improved`

## 7. 哪些东西不要提交到 Git

这些内容属于构建产物或本地环境文件，不应该进入版本历史：

- `node_modules/`
- `dist/`
- `src-tauri/target/`
- `.vercel/`
- `*.dmg`
- `*.app`

## 8. 以后最容易踩的坑

- 不要再复制一个新目录继续开发，否则历史会断掉
- 不要直接改归档目录，归档目录只用于查旧版本
- 不要把打包产物提交到 Git
- 不要跳过 `git pull --ff-only origin main`，否则容易本地和远端不一致
- 不要在不看 `git status` 的情况下直接提交

## 9. 你最常用的一套“傻瓜流程”

每次只要记住下面这 7 行就够了：

```bash
cd /Users/liuyuhang/Cursor/贴纸番茄钟-1.0-improved
git pull --ff-only origin main
git status
npm test
npm run build
git add -A
git commit -m "feat: 这次改动说明" && git push origin main
```
