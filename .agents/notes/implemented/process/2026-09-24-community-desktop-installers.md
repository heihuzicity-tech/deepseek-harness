# Agent Note: Community desktop installers

Status: implemented

English | [中文](2026-09-24-community-desktop-installers.zh.md)

## Problem

A public fork needs downloadable desktop installers without access to the upstream Apple Developer ID, notarization credentials, Windows signing token, or update infrastructure. Its application code must remain the official source.

## Decision

A separate GitHub Actions workflow packages certificate-free community installers on fresh native runners. Its helpers live under `.github/desktop` and reuse upstream preparation and assembled-runtime checks. A generated, disposable preparer omits only Developer ID signing; the checked-in upstream preparer stays intact. Upstream signing-block changes fail preparation until reviewed. Installer uploads depend on successful packaged-runtime checks, including Host boot and Office conversion. Windows verification installs the EXE in a private user Programs directory and uninstalls it after checking the installed files. This exercises installation while keeping native Office resource paths representative of a user installation.

The [official signed release pipeline](../architecture/2026-08-25-electron-desktop-packaging-and-updates.md) remains independent. Community artifacts carry a distinct suffix and no update feed; they cannot satisfy that pipeline's release completion requirements.

The separate manual **Publish desktop installers** workflow accepts a successful three-platform build and an empty draft release targeting the same commit. It downloads that run's installers inside GitHub, writes SHA-256 checksums, uploads the files, compares server digests and sizes, and publishes only after those checks pass. Keeping transfers on hosted runners avoids routing large installers through the operator's computer.

## Alternatives considered

**Requiring upstream signing credentials** prevents an independently operated fork from building installers. Ad-hoc macOS signing and unsigned Windows packaging permit manual distribution while clearly giving up verified publisher identity.

**Changing official application or packaging scripts** creates a larger recurring merge burden and weakens the upstream signed-release checks. Separate build helpers preserve those checks and keep application behavior unchanged.

## Consequences

The fork gains repeatable native builds without repository secrets. Users install updates manually and may need operating-system approval. Runtime checks verify archive integrity, native dependencies, Host startup, and Office conversion; they do not establish notarization, interactive installer success, or real-model connectivity. Upstream packaging changes require reviewing the helper configuration and generated preparer before publishing another build.
