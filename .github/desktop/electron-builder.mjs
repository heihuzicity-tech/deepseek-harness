/** Certificate-free community installers; official signed release commands remain independent. */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { officePackageDirectories } from '../../scripts/libreoffice-packages.mjs'
import { resolveDesktopTargetBuildPaths } from '../../apps/desktop/scripts/desktop-build-paths.mjs'
import { prepareWindowsAsarUnpack, verifyWindowsAsarUnpack } from '../../apps/desktop/scripts/windows-asar-unpack.mjs'

const app = fileURLToPath(new URL('../../apps/desktop/', import.meta.url))
const paths = resolveDesktopTargetBuildPaths()
const version = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')).version
const target = { platform: process.platform, arch: process.arch }
let windowsCode = []

export default {
  appId: 'com.deepseek.harness',
  productName: 'DeepSeek Harness',
  artifactName: 'deepseek-harness-${version}-${os}-${arch}-community.${ext}',
  protocols: [{ name: 'DeepSeek Harness', schemes: ['dsh'] }],
  directories: { app, output: join(paths.root, 'community-artifacts') },
  electronDist: paths.electron,
  npmRebuild: false,
  asar: true,
  electronFuses: { runAsNode: true },
  extraMetadata: {
    dshDesktopAppId: 'com.deepseek.harness',
    dshBuildCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    dshBuildDirty: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim() !== '',
  },
  files: [
    'lib/main.js', 'lib/welcome/**/*', 'lib/preload-*.cjs', 'renderer/**/*', 'package.json',
    { from: paths.dsh, to: 'dsh', filter: ['**/*'] },
    { from: join(paths.dsh, 'node_modules'), to: 'dsh/node_modules', filter: ['**/*'] },
  ],
  asarUnpack: ['**/*.{node,dylib,dll,so,exe}', '**/*.so.*', '**/spawn-helper', '**/@vscode/ripgrep-*/bin/rg'],
  extraResources: [
    { from: paths.runtime, to: 'runtime' },
    { from: join(app, 'resources/icon-windows.png'), to: 'icon.png' },
  ],
  mac: {
    icon: join(app, 'resources/icon-macos.png'),
    category: 'public.app-category.developer-tools',
    identity: '-', forceCodeSigning: false, hardenedRuntime: true, notarize: false,
    signIgnore: ['/Contents/Resources/app\\.asar\\.unpacked/dsh(?:/|$)', '/Contents/Resources/runtime/primary-runtime(?:/|$)', '\\.pak$'],
    extendInfo: {
      CFBundleLocalizations: ['en', 'zh_CN'],
      NSMicrophoneUsageDescription: 'DeepSeek Harness uses your microphone to transcribe speech into message drafts.',
    },
    target: ['dmg'],
  },
  dmg: { sign: false, writeUpdateInfo: false },
  win: { icon: join(app, 'resources/icon-windows.png'), forceCodeSigning: false, signAndEditExecutable: false, target: ['nsis'] },
  nsis: { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true, runAfterFinish: false },
  publish: null,
  beforePack: async context => {
    const office = await officePackageDirectories(paths.dsh, target)
    context.packager.config.asarUnpack.push(...office.map(dir => `**/${relative(paths.dsh, dir).split(sep).join('/')}/**/*`))
    if (process.platform === 'win32') windowsCode = await prepareWindowsAsarUnpack(context, paths.dsh)
  },
  afterPack: async context => {
    const { verifyDesktopRuntime } = await import('../../apps/desktop/lib/types/runtime-tree.js')
    await verifyDesktopRuntime(paths.dsh, version, target)
    if (process.platform === 'win32') {
      await verifyWindowsAsarUnpack(paths.dsh, context.packager.getResourcesDir(context.appOutDir), windowsCode)
    }
  },
}
