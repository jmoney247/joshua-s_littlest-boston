# Joshua’s Littlest Boston

Standalone Vite production copy of the finished Boston experience. The original example and GLB are unchanged. Scene geometry, reskins, camera, lighting, controls and animation are retained; the supplied poster adds loading and failure states, not a scene redesign.

## Local development

Use Node.js 24 LTS (minimum 22.12).

```sh
cd /Users/joshuasolomon/Documents/three.js/littlest-boston
npm install
npm run dev
```

Production check:

```sh
npm run build
npm run preview
```

Build output is `dist/`. Preview serves the production build. Use HTTP, not file://.

## Project structure

```text
littlest-boston/
  index.html                 immediate loading/fallback poster and metadata
  src/main.js                loading, first-frame reveal, failure and retry
  src/scene.js               preserved Boston scene and asset lifecycle
  src/style.css              full-container layout and subtle loading UI
  public/assets/             extracted artwork PNGs and boston-loading.webp
  public/models/             unchanged LittlestTokyo.glb
  public/draco/              local JavaScript/WASM Draco decoders
  vendor/three/              minimal exact Three.js runtime and MIT license
  package.json
  package-lock.json
  vite.config.js
  .gitignore
  ASSET-MANIFEST.json         original hashes and copied asset inventory
  VERIFICATION.md
  THIRD-PARTY-NOTICES.md
```

The exact original Three.js runtime is vendored because the source uses its Sky implementation. Only required runtime modules are included, not the Three.js repository. Its decoder default URLs were adjusted; decoding code is unchanged. No production runtime path depends on the parent repository or Desktop. Keep `vendor/three` in Git.

## GitHub

These commands create a separate repository inside this folder and push it as private. Install GitHub CLI first; change `--private` to `--public` only if you want public visibility.

```sh
cd /Users/joshuasolomon/Documents/three.js/littlest-boston
git init -b main
git add .
git commit -m "Prepare Joshua’s Littlest Boston for production"
gh auth login
gh repo create littlest-boston --private --source=. --remote=origin --push
```

No repository or deployment was created automatically. Do not commit node_modules or dist; both are ignored.

## Vercel

Import the new GitHub repository. Select Vite, project root `.`, install command `npm ci`, build command `npm run build`, output directory `dist`, and Node.js 24. No secrets or environment variables are required. This is a static site; no server or SPA route rewrites are needed. All assets and decoders are hosted with the app. Relative Vite paths also support a subdirectory.

Later, embed your deployed URL in Lovable:

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app/"
  title="Joshua’s Littlest Boston"
  style="display:block;width:100%;height:75vh;min-height:360px;border:0"
  loading="lazy"
></iframe>
```

No parent CSS is required. Avoid deployment headers that prohibit framing. If your portfolio uses a CSP, allow the deployment origin in its frame-src policy.

## Loading and performance

The HTML poster is visible while the scene module, model, Draco and artwork load. A spinner is indeterminate; the model percentage is shown only when the download supplies a measurable total. The poster fades after required artwork and the first rendered frame. Failure retains the poster and offers a fresh initialization through Try again. Device pixel ratio is capped at 2; resize observes the container.

Final audit sizes (decimal units): GLB 4.13 MB, lossless WebP loading poster 0.84 MB, total dist 14.30 MB, combined JavaScript 748 KB (195 KB gzip). The largest artwork PNG is 3.87 MB. Large artwork downloads plus model decoding/GPU upload remain the main slow-connection/mobile bottlenecks. Scene artwork and GLB were not recompressed. The poster has identical decoded pixels to its PNG predecessor. Vite reports a non-fatal large-chunk warning for the Three.js scene bundle. Rendering pauses while the document is hidden and resumes through the same single animation loop.

The final audit removed an unreachable MassAI experiment whose target display name did not exist, together with its unrequested artwork. No visible sign was removed or changed. The production scene still requests the same 16 active artwork images. See PRODUCTION-AUDIT.md for before/after measurements and verification.

See VERIFICATION.md for tested behavior and remaining device-testing limitations. Review third-party image/model rights before public release.
