# Targeted neighborhood changes — September 13, 2026

## Harbor alley and railing

- The two animated sunburst artwork planes, hub, rim, ties, lower cradle, outline shells and three red paper lantern meshes are hidden at runtime. The GLB file is unchanged. `src/harbor-alley.js` records the exact audited original face ranges.
- `bostonHarborWheel` is a dark wooden eight-spoke wheel with aged brass fittings, an anchor and a small BOSTON HARBOR medallion on both faces. Its rotor turns slowly in the existing main animation loop; the inscription stays upright. Five amber emissive bulbs and a thin cable form `bostonFestoonLights`. No real-time lights or external image assets were added.
- `bostonIronRailing` replaces the two rear and three side red railing sections, including the old feet and outlines. Seven slim posts follow the old post centers and street-level bases. Simple vertical bars replace the geometric motifs. The 732-triangle replacement uses one merged mesh/material. The adjacent red postbox, banners, flowerpots and trolley route are retained.

## Signage and artwork

| Original surface | Replacement | Palette / visual idea |
| --- | --- | --- |
| Pink bubble mural, door graphic and header in the alley | CHARLES ROWING CLUB mural and BEACON BOOKS prints | Faded sky blue, brick, mustard; rowing shell and open book |
| Alley storefront fascia and illustrated shutters | HARBOR COFFEE and harbor-wave paintings | Navy, cream, teal and muted gold |
| Three dotted food banners behind the Bruins plaque | HARBOR FISH MARKET, LOBSTER ROLL, NORTH SHORE SEAFOOD | Navy, muted orange, teal; fish, lobster and sailboat |
| Japanese reverse sides of the three street banners | BOOKS, HARBOR and JAZZ | Mustard, blue and burgundy; approved BOSTON / MARKET / BACK BAY fronts are retained |
| Remaining narrow white/blue plaques and small eaves signs | SEAFOOD, JAZZ, BOOKS, BAKED and CAFE | Mixed navy, burgundy, mustard and brick palettes |
| Remaining unapproved reverse face of the Mayor Wu sign and its circular roof badge | Floral treatment | Muted green, warm cream and dusty pink; approved Mayor Wu front retained |
| Small manga/fruit/sunburst posters, book covers and window notices | Jazz, Fenway Records, Boston Design Week, lighthouse and florist prints | Record, instrument, brownstone, lighthouse and flower illustrations |
| Vending-machine artwork and tiny price/notice cards | Simple science/floral graphics | Faded blue, cream and muted orange; no crowded microtype |
| Small chalkboard/menu surfaces | Baked-goods/coffee prints | Forest green, cream, warm mustard |
| Three raised characters immediately above WHOOP | NORTH SHORE SEAFOOD plaque | Teal/cream sailboat print on the original backing; raised glyphs and their outline shells removed |
| Japanese traffic captions and painted road glyphs | ONE WAY / NO CYCLING notices; glyph decals removed | Cream and navy; arrows and restriction meaning retained; road surface untouched |

The immutable face lists live in `src/signage-faces.json`. `src/neighborhood-signage.js` copies only the selected printed surfaces. Approved front faces take precedence. The original shared texture atlases and original material colors are not edited. New prints use varied type treatments and illustrations packed into one 1024×1024 generated print sheet, not downloaded textures or base64 artwork. All printed copies are combined into a single mesh. Only the audited raised-letter and road-decal index ranges are collapsed in private runtime geometry copies; source vertices and original face numbering stay intact.

### Deliberately retained details

- Tiny cast-gold relief marks on the small hanging sign beneath the rear green awning below MGH.
- Small molded gold relief elements in the narrow alley behind the BACK BAY sign / beside the air-conditioning units.
- Microprint and etched artwork deep behind the rear blue-awning storefront's glass.

These are integrated into decorative geometry or layered window surfaces. They were left untouched to avoid changing those surfaces, their frames, or nearby approved elements. This is not a claim that every microscopic Japanese mark in the source asset has been removed.

## Verification

- Inspected front, rear, left/right three-quarter, alley, street-level railing/bookstall and rooftop views. The wheel and bulbs replace the old disc/lantern set; the iron rails stay inside the old footprint. Replacements preserve existing clipped/rounded sign edges.
- Production browser checks passed: desktop and mobile loading, animation, orbit, lobster click/tap, nearby-click rejection, drag suppression, once-per-session discovery, noninteractive Secret Base teaser, error fallback and retry. Embedded 560×360 and 320×320 sizing passed. The existing visibility pause/resume handler was exercised successfully.
- No missing assets or uncaught browser errors in production tests. No inspection screenshots, temporary hooks or reference images are included in `dist`.
- Original GLB, loading poster and all 16 approved image artwork hashes match `ASSET-MANIFEST.json`.
- Exactly one intentional main animation loop remains; its existing first-frame scheduling and pixel-ratio cap are unchanged.
- `npm run build` passes. The existing Vite large-chunk warning remains non-fatal.

### Size and rendering measurements

| Measurement | Before signage pass | After signage pass |
| --- | ---: | ---: |
| Scene JS | 767.22 kB | 785.57 kB |
| Scene JS, gzip | 200.66 kB | 207.10 kB |
| Draw calls in fixed street-level test view | 108 | 109 |
| Loaded GPU textures in that view | 57 | 58 |
| Submitted triangles in that view | 147,757 | 148,482 |

The final signage mesh contains 725 triangles. Measurements compare the same frozen animation time, viewport and camera, with the wheel and railing already present in both versions. No extra repeating animation loop or runtime light was added.

- Final `dist`: 14,338,149 bytes.
- Draco GLB: 4,133,072 bytes, unchanged.
- Loading poster: 841,488-byte lossless WebP, unchanged.
- Camera defaults, controls, trolley animation, Prudential Tower, approved logos/signage, lamps, lobster, Secret Base text, loading UI and overall scene lighting are retained.
