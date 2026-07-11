// Generates dark cinematic placeholder MP4s for the BUILDER and CLOSER
// background videos (stand-ins for the Kie.ai clips). Requires ffmpeg on PATH.
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'video')

const CLIPS = [
  { name: 'builder', label: 'BUILDER PLACEHOLDER', speed: 0.012 },
  { name: 'closer', label: 'CLOSER PLACEHOLDER', speed: 0.02 },
]

for (const clip of CLIPS) {
  const filter = [
    `gradients=s=1280x720:d=8:speed=${clip.speed}:nb_colors=3:c0=0x050505:c1=0x06281d:c2=0x03100b,`,
    `vignette=PI/4,`,
    `drawtext=text='${clip.label} — swap with Kie.ai clip':fontcolor=0x2f4f43:fontsize=28:x=(w-text_w)/2:y=h-64`,
  ].join('')
  execFileSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', filter,
    '-t', '8', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '30', '-an', join(out, `${clip.name}.mp4`),
  ], { stdio: 'inherit' })
  // poster = first frame, so sections never flash empty
  execFileSync('ffmpeg', [
    '-y', '-i', join(out, `${clip.name}.mp4`),
    '-frames:v', '1', '-q:v', '4', join(out, `${clip.name}-poster.jpg`),
  ], { stdio: 'inherit' })
}
console.log('placeholder videos + posters written to public/video')
