/** Exercise the assembled community app through upstream runtime integrity and Host checks. */
import { join } from 'node:path'
import { resolveDesktopTargetBuildPaths } from '../../apps/desktop/scripts/desktop-build-paths.mjs'
import { readDesktopRuntime, verifyDesktopRuntime } from '../../apps/desktop/src/runtime-tree.ts'
import { smokePreparedRuntime } from '../../apps/desktop/scripts/smoke-prepared-runtime.ts'

const paths = resolveDesktopTargetBuildPaths()
const windows = process.platform === 'win32'
const output = join(paths.root, 'community-artifacts')
const app = windows ? join(output, 'win-unpacked')
  : join(output, process.arch === 'arm64' ? 'mac-arm64' : 'mac', 'DeepSeek Harness.app', 'Contents')
const resources = join(app, windows ? 'resources' : 'Resources')
const node = windows ? join(app, 'DeepSeek Harness.exe') : join(app, 'MacOS', 'DeepSeek Harness')
const descriptor = await verifyDesktopRuntime(paths.dsh, readDesktopRuntime(paths.dsh).release.version,
  { platform: process.platform, arch: process.arch })
await smokePreparedRuntime(join(resources, 'app.asar', 'dsh'), node, join(resources, 'runtime'), descriptor)
