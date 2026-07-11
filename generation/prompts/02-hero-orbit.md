# HERO ORBIT (Seedance 2.0, image-to-video, start frame = canonical keyframe)

Params: 1080p, 16:9, no audio, ~8s. Must loop: camera returns exactly to the
start position so last frame ≈ first frame.

```
The man from the start frame stands perfectly still in a pure black void
studio, confident, arms crossed, feet planted. Wearing a black t-shirt and a
dark overshirt — plain, no logos. A single emerald green (#10B981) rim light
from one side traces his silhouette. The camera performs ONE slow, perfectly
smooth 360-degree orbit around him at chest height, constant speed and
constant radius, ending at exactly the starting camera position and angle. He
does not move, blink minimally, no gestures. No camera shake, no zoom, no
lighting changes. Cinematic, high contrast, subtle film grain.
```

Negative: `camera shake, zoom, dolly in, subject movement, walking, lighting flicker, background objects, text, logos, morphing face, wardrobe change`

Loop check after render: extract first + last frame and diff; if the camera
doesn't close the orbit, regenerate — the scroll scrub depends on it.
