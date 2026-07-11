// Generates a seamless-loop placeholder orbit frame sequence (stand-in for the
// Kie.ai HERO ORBIT clip). A faceted monolith rotates exactly 360° across the
// sequence, lit by a fixed emerald rim light — same file layout the real clip
// uses after `npm run extract-frames`, so swapping is a pure file replacement.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const SETS = [
  { dir: 'public/frames/desktop', frames: 240, w: 1440, h: 810 },
  { dir: 'public/frames/mobile', frames: 120, w: 720, h: 405 },
]

const TAU = Math.PI * 2
const LIGHT = -TAU / 8 // fixed rim-light direction (viewer-left)

function facetPolys(baseAngle, cx, cy, R, halfH) {
  const N = 10
  const polys = []
  for (let i = 0; i < N; i++) {
    const a1 = baseAngle + (i / N) * TAU
    const a2 = baseAngle + ((i + 1) / N) * TAU
    const mid = (a1 + a2) / 2
    if (Math.cos(mid) <= 0) continue // back-facing
    const x1 = cx + R * Math.sin(a1)
    const x2 = cx + R * Math.sin(a2)
    // Lambertian shade toward camera + emerald rim toward fixed light
    const camShade = Math.max(0, Math.cos(mid))
    const rim = Math.max(0, Math.cos(mid - LIGHT)) ** 6
    const g = Math.round(14 + camShade * 26)
    const er = Math.round(16 * rim + g)
    const eg = Math.round(185 * rim * 0.55 + g)
    const eb = Math.round(129 * rim * 0.55 + g)
    polys.push(
      `<polygon points="${x1.toFixed(1)},${(cy - halfH).toFixed(1)} ${x2.toFixed(1)},${(cy - halfH).toFixed(1)} ${x2.toFixed(1)},${(cy + halfH).toFixed(1)} ${x1.toFixed(1)},${(cy + halfH).toFixed(1)}" fill="rgb(${er},${eg},${eb})"/>`
    )
  }
  return polys.join('')
}

function frameSvg(t, w, h) {
  const angle = t * TAU // exactly one revolution -> seamless loop
  const cx = w / 2
  const cy = h * 0.52
  const R = h * 0.21
  const halfH = h * 0.34
  const capR = R * (0.55 + 0.06 * Math.sin(angle * 2))
  const glowX = cx + R * 1.4 * Math.sin(LIGHT)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#050505"/>
  <ellipse cx="${cx}" cy="${cy + halfH + h * 0.05}" rx="${R * 2.6}" ry="${h * 0.045}" fill="#0a0f0c"/>
  <ellipse cx="${glowX}" cy="${cy}" rx="${R * 2.2}" ry="${halfH * 1.5}" fill="#10B981" opacity="0.05"/>
  ${facetPolys(angle, cx, cy, R, halfH)}
  <ellipse cx="${cx}" cy="${cy - halfH}" rx="${R}" ry="${R * 0.22}" fill="#1c1c1c"/>
  <circle cx="${cx}" cy="${cy - halfH - capR * 0.9}" r="${capR * 0.6}" fill="#161616"/>
  <circle cx="${cx + capR * 0.6 * Math.sin(LIGHT) * 0.8}" cy="${cy - halfH - capR * 0.9}" r="${capR * 0.6}" fill="#10B981" opacity="${(0.10 + 0.05 * Math.max(0, Math.cos(angle - LIGHT))).toFixed(3)}"/>
  <text x="${w - 16}" y="${h - 14}" text-anchor="end" font-family="monospace" font-size="${Math.round(h * 0.016)}" fill="#2a2a2a">PLACEHOLDER ORBIT — swap with extracted Kie.ai frames</text>
</svg>`
}

for (const set of SETS) {
  const outDir = join(root, set.dir)
  mkdirSync(outDir, { recursive: true })
  const jobs = []
  for (let i = 0; i < set.frames; i++) {
    const svg = frameSvg(i / set.frames, set.w, set.h)
    const name = `hero_${String(i + 1).padStart(4, '0')}.webp`
    jobs.push(
      sharp(Buffer.from(svg)).webp({ quality: 72 }).toFile(join(outDir, name))
    )
    if (jobs.length >= 24) {
      await Promise.all(jobs)
      jobs.length = 0
    }
  }
  await Promise.all(jobs)
  console.log(`${set.dir}: ${set.frames} frames @ ${set.w}x${set.h}`)
}
