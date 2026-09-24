# Community desktop installers

English | [中文](README.zh.md)

## Build and download

Run **Desktop installers** from the fork's Actions page. The workflow builds the selected Git revision on macOS ARM64, macOS x64, and Windows x64 runners and uploads one installer artifact per successful job. Pushes changing this workflow or its helpers on `codex/desktop-installers` also start a build. Each artifact expires after 30 days; published GitHub Release assets are independent of that retention period.

Application sources, dependency versions, and official release commands remain unchanged. This workflow uses the official build, runtime preparation, inventory verification, and packaged Host/Office smoke checks. Windows checks install the EXE into a private user Programs directory, verify the installed runtime, and uninstall it afterward. These checks do not exercise paid model requests or interactive installer pages.

## Signing and updates

Files ending in `-community.dmg` use an ad-hoc application signature without Apple notarization. Files ending in `-community.exe` have no publisher signature. Operating systems may require explicit user approval to open them. These are community builds of official source, not vendor-signed official releases. No model keys or local application data are included.

The installers do not configure an automatic update feed or mandatory-update service. Install later community versions manually. Windows uses upstream's NSIS directory installer and BCJ compression setting. The macOS application ID and `dsh` URL handler match upstream; installing alongside another Harness build can replace that app or claim its URL handler.

## Maintenance

`prepare-community.mjs` generates a disposable runtime preparer under `.desktop-build`, omitting the upstream Developer ID signing block while preserving preparation and verification. It rejects changed signing-block anchors so an upstream update requires review. `electron-builder.mjs` packages the prepared runtime, preserves its inventory, and keeps native Office and Windows PE files outside ASAR. `smoke.ts` verifies that assembled payload with upstream checks before upload.

The [decision record](../../.agents/notes/implemented/process/2026-09-24-community-desktop-installers.md) explains why this workflow is separate from the signed release pipeline.
