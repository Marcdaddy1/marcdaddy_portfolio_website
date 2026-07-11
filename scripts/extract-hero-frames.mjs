// Extracts the real HERO ORBIT clip into the desktop + mobile frame sequences
// the site consumes. Run after the Kie.ai clip lands:
//   node scripts/extract-hero-frames.mjs generation/clips/hero-orbit.mp4
// Desktop: 240 frames @1440w. Mobile: 120 frames @720w. Requires ffmpeg.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = process.argv[2]
if (!src || !existsSync(src)) {
  console.error('usage: node scripts/extract-hero-frames.mjs <hero-orbit.mp4>')
  process.exit(1)
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Seedance 2 outputs 24fps natively — extract at 24/12 so no frame is a duplicate.
const SETS = [
  { dir: 'public/frames/desktop', fps: 24, width: 1440 },
  { dir: 'public/frames/mobile', fps: 12, width: 720 },
]

for (const set of SETS) {
  const outDir = join(root, set.dir)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  execFileSync('ffmpeg', [
    '-i', src,
    '-vf', `fps=${set.fps},scale=${set.width}:-2`,
    '-c:v', 'libwebp', '-quality', '72',
    join(outDir, 'hero_%04d.webp'),
  ], { stdio: 'inherit' })
  console.log(`${set.dir}: extracted at fps=${set.fps}, width=${set.width}`)
}
console.log('\nIf frame counts changed, update FRAME_COUNT in src/modules/hero-scrub.ts')
