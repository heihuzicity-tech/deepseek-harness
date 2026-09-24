/** Generate a certificate-free preparer without editing the upstream application or scripts. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const app = join(root, 'apps/desktop')
const original = join(app, 'scripts/prepare-dsh.ts')
let source = readFileSync(original, 'utf8')
const signing = [
  "    if (process.platform === 'darwin') {",
  "      await packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'sign:dsh-native', () => signMacOSRuntime(DSH_OUTPUT_ROOT, resolveDesktopAppId(process.env), resolveMacOSSigningEnvironment(process.env), join(BUILD_PATHS.root, 'signature-cache')))",
  "      await packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'sign:primary-native', () => signMacOSRuntime(join(RUNTIME_ROOT, 'primary-runtime'), resolveDesktopAppId(process.env), resolveMacOSSigningEnvironment(process.env), join(BUILD_PATHS.root, 'signature-cache')))",
  '    }',
  '',
].join('\n')
if (source.split(signing).length !== 2) {
  throw new Error('Community preparer: upstream signing block changed; review before building')
}
source = source.replace(signing, '')
const appRoot = "const APP_ROOT = resolve(import.meta.dirname, '..')"
if (!source.includes(appRoot)) throw new Error('Community preparer: upstream APP_ROOT changed')
source = source.replace(appRoot, `const APP_ROOT = ${JSON.stringify(app)}`)
source = source.replace(/from '(\.{1,2}\/[^']+)'/gu, (_, specifier) =>
  `from '${pathToFileURL(resolve(dirname(original), specifier)).href}'`)
const output = join(app, '.desktop-build/community')
mkdirSync(output, { recursive: true })
writeFileSync(join(output, 'prepare-dsh.ts'), source)
