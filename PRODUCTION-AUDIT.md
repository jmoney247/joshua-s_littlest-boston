# Final production audit — September 9, 2026

Scope: littlest-boston only. Measurements use actual file byte counts, not disk allocation. MB/KB below are decimal. Only the final requested Vite build was run; the project was not recreated.

| Metric | Before | After |
| --- | ---: | ---: |
| Draco-compressed GLB | 4,133,072 bytes | 4,133,072 bytes |
| Loading poster | PNG, 1,424,416 bytes | lossless WebP, 841,488 bytes |
| Total dist | 15,217,654 bytes | 14,295,087 bytes |
| Combined production JS | 749,034 bytes | 748,358 bytes |
| Main scene JS | 745,876 bytes | 745,200 bytes |
| Approx. attached materials | 81 | 81 |
| Unique material-referenced textures | 62 | 62 |
| Renderer GPU texture count | 56 | 56 |
| Draw calls / triangles at audit view | 177 / 144,844 | 177 / 144,844 |

Final JS gzip total: 195,116 bytes. Final dist reduction: 922,567 bytes (6.1%). Poster reduction: 582,928 bytes (40.9%). Runtime counts are a loaded-scene snapshot; environment textures and renderer-internal allocations differ from material references.

## Changes

- Removed one unreachable MassAI poster experiment targeting bostonBackBayCafeDisplay, a name never created by the production scene. Removed its unrequested 338,966-byte artwork-22c94acf20d1.png and its manifest entry. No visible MassAI element was removed.
- Replaced the PNG loading poster with lossless WebP, retaining 1408×768 dimensions and exactly equal decoded RGB pixels. Updated HTML image, preload and social-image references. Removed the obsolete PNG from production assets.
- Added a visibilitychange listener that stops the main animation loop when hidden and resumes it when visible. The existing document-connected Three.Timer resets its clock on visibility restoration. Disposal removes the new listener, avoiding accumulation on retry.
- Preserved the existing pixel-ratio cap: Math.min(window.devicePixelRatio || 1, 2), including resize behavior.
- No scene refactoring, geometry edits, model recompression, sign substitutions, lighting, camera, control, animation timing or transform changes. No KTX2/Meshopt pipeline introduced.

Removed asset copies were moved to /private/tmp/boston-audit-removed-wF3ZMb for temporary recovery, rather than permanently deleted. That folder is outside the production project and may be cleared by the OS.

Exactly one intentional repeating renderer.setAnimationLoop callback remains. Two nested one-shot requestAnimationFrame callbacks wait for the initial frame before reveal; these are not repeating loops. No application console logs, debugger statements, embedded image data URLs, targeting screenshots, or reference files were found in the production source/assets. Working sign construction code was left intact rather than speculatively deleting intermediate materials or implementation steps that could affect appearance.

## Verification

The existing build was tested before edits, then npm run build succeeded and the final dist was tested in local headless Chromium. The only build warning is Vite's non-fatal scene chunk size warning.

- Fixed-time desktop screenshot before/after was pixel-identical: zero differing RGB channels across 1280×800 pixels.
- Poster PNG/WebP decoded pixels were byte-identical.
- Production GLB SHA256 still matches the recorded source GLB hash.
- Same 98 Boston-named objects and 16 active artwork requests. No unused artwork remained in dist.
- No happy-path asset 404s, missing assets or page errors.
- Loading poster visible before a deliberately delayed GLB response; ready reveal occurred after assets and frame initialization.
- Model, Draco and artwork forced failures displayed the poster fallback; each retry succeeded with one canvas.
- Unavailable WebGL displayed fallback.
- Animation clock advanced; orbit drag changed camera position.
- Visibility pause/resume logic passed a simulated document visibility event test: rendered-frame counter stayed fixed while hidden and advanced again after restoration.
- Desktop, laptop, tablet and mobile 390×844 views rendered with correct canvas dimensions and no horizontal overflow.
- 600×500 iframe and subdirectory deployment paths passed.

## Ship assessment

Ready to ship as a static Vite experience, subject to the normal final smoke test on the deployed host and real mobile hardware. No remote deployment was performed. Browser viewport tests do not substitute for physical-device GPU testing. Biggest remaining costs are large scene artwork downloads (largest PNG 3.87 MB), GLB decoding/texture upload, and 177 draw calls per frame. Further changes could affect final visuals; optimization stops here.
