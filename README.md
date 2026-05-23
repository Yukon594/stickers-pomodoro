# 贴纸番茄钟

一个给 MacBook 用的可爱风番茄时钟：上传自己的小人头像，专注结束时从屏幕角落弹出贴纸提醒。

## 开发运行

```bash
npm install
npm run dev
```

浏览器预览地址：

```text
http://127.0.0.1:1420/
```

## 桌面运行

Tauri 桌面壳需要本机安装 Rust 工具链：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm run tauri dev
```

当前项目已经包含 Tauri 2 配置、菜单栏托盘、四角悬浮提醒窗口、系统通知兜底和本地设置读写代码。

## 验证

```bash
npm test
npm run build
npm run tauri -- info
```
