# 社区桌面安装包

[English](README.md) | 中文

## 构建与下载

在 fork 的 Actions 页面运行 **Desktop installers**。工作流在 macOS ARM64、macOS x64 和 Windows x64 运行器上构建所选 Git 修订，每个成功的任务上传一个安装包产物。在 `codex/desktop-installers` 分支推送此工作流或辅助脚本的变更也会启动构建。每个产物保留 30 天；已发布的 GitHub Release 附件不受该保留期限影响。

应用源码、依赖版本和官方发布命令保持不变。此工作流使用官方构建、运行时准备、文件清单校验，以及打包后的 Host/Office 冒烟检查。Windows 检查将 EXE 安装到用户 Programs 目录下的私有目录，验证安装后的运行时，然后卸载。这些检查不包含付费模型请求或安装器交互页面。

## 签名与更新

以 `-community.dmg` 结尾的文件使用临时应用签名，未经 Apple 公证。以 `-community.exe` 结尾的文件没有发布者签名。操作系统可能要求用户明确批准后才能打开。这些是基于官方源码的社区构建，不是厂商签名的官方发行版。安装包不包含模型密钥或本地应用数据。

安装包不配置自动更新源或强制更新服务。后续社区版本需手动安装。Windows 使用上游的 NSIS 目录安装器和 BCJ 压缩设置。macOS 应用 ID 和 `dsh` URL 处理器与上游一致；与其他 Harness 构建并存时，安装可能替换该应用或接管其 URL 处理器。

## 维护

`prepare-community.mjs` 在 `.desktop-build` 下生成临时运行时准备脚本，省略上游的 Developer ID 签名代码块，同时保留准备与校验步骤。签名代码块的定位标记变化时它会拒绝继续，以便在上游更新后进行审查。`electron-builder.mjs` 打包准备好的运行时，保留文件清单，并将原生 Office 和 Windows PE 文件放在 ASAR 外。上传前，`smoke.ts` 使用上游检查验证组装后的运行时。

[决策记录](../../.agents/notes/implemented/process/2026-09-24-community-desktop-installers.zh.md) 解释了此工作流为何独立于签名发布流水线。
