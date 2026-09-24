/** Exercise the assembled community app through upstream runtime integrity and Host checks. */
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import { resolveDesktopTargetBuildPaths } from '../../apps/desktop/scripts/desktop-build-paths.mjs'
import { readDesktopRuntime, verifyDesktopRuntime } from '../../apps/desktop/src/runtime-tree.ts'
import { smokePreparedRuntime } from '../../apps/desktop/scripts/smoke-prepared-runtime.ts'

const paths = resolveDesktopTargetBuildPaths()
const windows = process.platform === 'win32'
const output = join(paths.root, 'community-artifacts')
let app = windows ? join(output, 'win-unpacked')
  : join(output, process.arch === 'arm64' ? 'mac-arm64' : 'mac', 'DeepSeek Harness.app', 'Contents')
const descriptor = await verifyDesktopRuntime(paths.dsh, readDesktopRuntime(paths.dsh).release.version,
  { platform: process.platform, arch: process.arch })
const execute = promisify(execFile)
let installation: string | undefined
try {
  if (windows) {
    const local = process.env.LOCALAPPDATA
    if (local === undefined) throw new Error('Installer smoke requires LOCALAPPDATA')
    const programs = join(local, 'Programs')
    await mkdir(programs, { recursive: true })
    installation = await mkdtemp(join(programs, 'HarnessSmoke-'))
    app = join(installation, 'App')
    const installers = (await readdir(output)).filter(name => name.endsWith('-win-x64-community.exe'))
    if (installers.length !== 1) throw new Error('Installer smoke requires exactly one Windows installer')
    await execute(join(output, installers[0]!), ['/S', `/D=${app}`], { timeout: 300_000, windowsHide: true })
    console.log('Installed Windows application for runtime verification:', app)
  }
  const resources = join(app, windows ? 'resources' : 'Resources')
  const node = windows ? join(app, 'DeepSeek Harness.exe') : join(app, 'MacOS', 'DeepSeek Harness')
  await smokePreparedRuntime(join(resources, 'app.asar', 'dsh'), node, join(resources, 'runtime'), descriptor)
} finally {
  if (installation !== undefined) {
    const uninstaller = join(app, 'Uninstall DeepSeek Harness.exe')
    if (existsSync(uninstaller)) await execute(uninstaller, ['/S', `_?=${app}`], { timeout: 300_000, windowsHide: true })
    await rm(installation, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
