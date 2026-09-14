# Production verification

The subsequent final audit is recorded in PRODUCTION-AUDIT.md, including lossless poster optimization, unreachable-asset removal, visibility pause/resume, and pixel-identical before/after scene verification.

Verified September 9, 2026 against the built dist output in headless Chromium, using an HTTP server. The original was served separately for comparison, without editing its files.

- npm install completed with zero reported vulnerabilities; npm run build succeeded.
- Loading poster was visible before the deliberately delayed model response.
- GLB and local Draco loaded; 98 Boston-named scene objects and 16 artwork requests were observed.
- Required artwork completed before the ready transition.
- Original and production desktop captures were compared at a fixed animation time; scene appearance was preserved.
- Animation clock progressed and orbit dragging changed the camera.
- Desktop, 1366×768 laptop, 768×1024 tablet and 390×844 mobile layouts rendered and resized.
- Happy-path console and asset requests had no observed errors or missing files.
- Forced model, Draco wrapper and artwork HTTP failures each showed fallback; retry then succeeded.
- Unavailable WebGL showed the poster fallback.
- Subdirectory-relative loading and a 600×500 iframe both passed.

Tests used browser automation, not physical phones/tablets. Real mobile GPU performance, prolonged use, and the eventual Vercel/Lovable deployment still need a final smoke test. No remote deployment was performed. Diagnostic screenshots and test harnesses are not shipped in this project.

ASSET-MANIFEST.json records source hashes and copied asset hashes for provenance. The original example and original GLB were preserved.
