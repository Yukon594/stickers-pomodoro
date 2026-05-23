# 菜单栏树苗图标用户环境排查

## 结论

如果同一台 Mac 切换到另一个 macOS 用户账户后可以显示树苗图标，另一台电脑也可以显示，那么优先按当前 macOS 用户账户环境问题排查，而不是继续大规模修改树苗绘制代码。项目代码保留 fallback：前端树苗 PNG 渲染失败、Rust 收到空图标字节或 PNG 解码失败时，会回退到内置 app 图标，避免菜单栏 item 因图片资源为空而完全不可见。

## 项目内可观察信息

开发模式运行 `npm run tauri dev` 时，终端会输出菜单栏图标更新信息。Release 或打包版本也可以临时打开 Rust 侧诊断：

```bash
STICKER_POMODORO_TRAY_DIAG=1 npm run tauri dev
```

前端 WebView 侧也有一个只读诊断开关，打开开发者工具后可在 Console 中执行：

```js
localStorage.setItem("sticker-pomodoro-tray-diagnostics", "1");
```

关闭前端诊断：

```js
localStorage.removeItem("sticker-pomodoro-tray-diagnostics");
```

诊断信息包括：

- 前端图标来源、渲染状态、树苗样式、阶段、休息/专注变体；
- 18x18 逻辑尺寸、高分辨率 backing bitmap 尺寸、缩放倍数；
- 是否以 template 图标渲染；
- 前端 PNG 字节数、Rust 收到的字节数；
- 是否启用了内置 app 图标 fallback；
- `set_icon` 与 `set_visible` 是否成功，以及失败时的错误信息；
- 前端 render / invoke / retry 阶段、设备像素比和 WebView user agent。

如果看到 `fallback=none`、`rust_bytes` 大于 0，且 `set_icon and set_visible(true) succeeded`，通常说明项目已经把图标数据交给 macOS；此时只有某个用户账户显示不出来，更像状态栏环境或用户配置问题。

## 可能原因

- 菜单栏隐藏/整理工具隐藏了该 app 的状态栏 item，例如 Bartender、Hidden Bar、Ice、Dozer、iStat Menus 等。
- SystemUIServer 状态异常，导致某个用户账户的菜单栏缓存或排列状态没有刷新。
- 当前用户的菜单栏或控制中心偏好设置损坏或残留了旧配置。
- 登录项、LaunchAgent 或后台管理工具在当前用户中干预了状态栏。
- 第三方状态栏工具已卸载，但用户目录里仍有残留配置。
- 当前用户下 app 权限、隔离属性、登录项或启动方式与另一个账户不同。
- 多屏幕、刘海屏、菜单栏自动隐藏或空间切换导致状态栏 item 被挤压到不可见区域。

## 安全排查步骤

1. 先退出所有菜单栏隐藏/整理工具，再重新打开贴纸番茄钟。
2. 按住 Command，在菜单栏上拖动图标区域，确认图标不是被挤到隐藏区域或屏幕刘海/控制中心附近。
3. 到“系统设置 > 控制中心”和“系统设置 > 登录项”检查是否有会管理菜单栏或后台项目的工具。
4. 重启菜单栏进程，不会删除数据：

   ```bash
   killall SystemUIServer
   ```

5. 只读列出当前用户 LaunchAgent，人工查看是否有菜单栏整理工具或残留后台项：

   ```bash
   ls ~/Library/LaunchAgents
   ```

6. 检查当前登录项和后台项目设置：打开“系统设置 > 通用 > 登录项”，先临时关闭可疑菜单栏工具，再重启贴纸番茄钟。
7. 用开发模式确认项目侧是否已经成功提交图标：

   ```bash
   npm run tauri dev
   ```

   打开设置里的菜单栏开关或切换树样式，观察终端里的 `Tray icon update` 日志。
8. 如果安全模式或新建用户账户正常，优先清理第三方菜单栏工具配置，而不是继续大规模改项目代码。清理任何偏好设置前，先备份，不要直接删除不确定的系统文件。

## 判断标准

- 新 macOS 用户账户可以显示，其他电脑也可以显示：优先按当前用户环境排查。
- 诊断显示 `renderState=ok`、`fallback=none`、`set_icon` 成功：项目侧已成功提交图标，继续排查 SystemUIServer、菜单栏工具和用户偏好设置。
- 诊断显示 `renderState=failed` 或 `fallback=empty icon bytes`：再回到项目侧检查 WebView Canvas/SVG 渲染。
- 诊断显示 `set_icon failed` 或 `set_visible(true) failed`：记录完整错误信息，优先确认当前用户权限、状态栏管理工具和 Tauri/macOS 运行环境。

## 不建议的操作

- 不要使用 `rm -rf` 删除系统目录或整个 `~/Library/Preferences`。
- 不要重置整台 Mac 的系统设置来排查单个状态栏 item。
- 不要在没有备份的情况下删除第三方工具配置。
- 不要因为当前用户账户异常而大规模改动树苗绘制逻辑。
