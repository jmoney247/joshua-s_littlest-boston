# Final environment pass — September 13, 2026

This pass retains the original GLB, shared atlases, camera, controls, trolley,
landmarks, lobster, lamps, railings and loading lifecycle. No new animation loop.

## Building surfaces

- Expanded the audited roof-tile UV selections to include previously missed edges;
  changed these copies to a muted slate/charcoal treatment, retaining baked detail.
- Neutralized six red roof-ridge components above the BCG/New Balance façade
  (156 triangles), constrained by both UV region and physical rooftop location.
- Shifted the salmon façade island toward warm brick (15 triangles), and the
  turquoise plaster island toward warm cream (49 triangles across two materials).
- No core architectural geometry or shared texture was edited. Existing approved
  sign frames and literal architectural shapes remain, including some red trim.

## Two mailboxes

- Front/bookstall: removed the incomplete old blue enclosure implementation.
  Masked the exact original red pillar, cap, postal details and outline shell.
  Replaced it with a compact blue arched collection box with legs, slot and label.
- Rear/railing corner: masked the matching original pillar and details, replacing
  it with the same lightweight collection-box design at the original location.
- The two new boxes share materials and one small 256×128 label texture. No red
  cap or pillar geometry remains in these audited components. Their bases remain
  at the original pavement elevation, outside the trolley track.
- Exact source face ranges are documented in `src/us-mailboxes.js`; private index
  copies retain previous masks and stable triangle numbering for all overlays.

## Small lettering

- Red notice immediately behind the front mailbox → POSTAL COLLECTION.
- Small red service cabinet beside the bookstall → SERVICE / neutral graphic.
- Both use the existing shared print sheet, not additional textures.
- Left the deep cast-gold relief under the rear green awning / behind BACK BAY,
  and tiny text baked into shop-window interiors, unchanged: those cannot be
  safely isolated as flat sign faces without more invasive architectural work.
  This is not a claim that every microscopic source marking is gone.

## Subsequent requested artwork swaps

After the environment build and interaction checks passed:

- Gillette panel → supplied Loretta’s Last Call image (`bostonLorettasSign`).
- LIBERTY plaque → supplied John Hancock signature (`bostonJohnHancockPlaque`).
- Original locations, dimensions, slopes and frames retained. Artwork is fitted
  without stretching; original supplied files are copied intact into public assets.

## Verification

- Inspected front, rear, side, alley, bookstall and railing views, plus a close
  view of the signature plaque. Nearby approved signs remain intact.
- `npm run build` succeeds. Existing non-fatal bundle-size warning remains.
- Desktop and mobile: loading, orbit, animation advancement, lobster click/tap,
  nearby-object rejection, drag rejection and once-per-session success all pass.
- Iframe resizing, visibility-handler pause/resume, failure fallback and retry pass.
- Actual localhost preview: ready, zero observed console/page errors or missing assets.
- Same fixed rail-view render comparison: 109 → 113 calls, 148,482 → 148,763
  submitted triangles, textures unchanged at 58. This is a frame-specific workload
  comparison, not a full hardware FPS benchmark.
- Final scene bundle: 794.51 kB / 210.20 kB gzip versus 785.57 / 207.10 before
  this pass. Original GLB remains 4,133,072 bytes; loading poster remains 841,488.

Diagnostic browser hooks and screenshots exist only outside production; no test
camera changes or inspection interfaces were added to the shipped application.
