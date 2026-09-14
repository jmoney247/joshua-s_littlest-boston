# Crown cycle and sign updates — September 13, 2026

- State Street panel uses the supplied crossed-out Yankees artwork.
- Big Dig panel uses the new supplied illustration.
- Only the circular flower badge above Mayor Wu uses the Boston cream picture;
  other florist signs and Mayor Wu remain unchanged. Existing print sheet reused.
- Tea Party image is fitted within the upper 65% of its existing wall and shifted
  left to clear the bench and foreground notices. Complete bottom caption visible.
- Upper WHOOP panel width and height increased by 30%, centered in place.
- Lower Patriots sign uses the supplied navy-background logo; only blank navy
  margins are cropped. No logo pixels are clipped.

## Crown timing

Green → blue → purple → red → amber → teal → white → green.
Each next color is reached at a three-second boundary. Hold 2.25 seconds, then
smoothstep blend for 0.75 seconds; full cycle 21 seconds. Colors are allocated
once and the existing crown material's emissive value changes in place. The
existing main loop supplies delta time, preserving visibility pause/resume. No
setInterval, additional repeating requestAnimationFrame, lights or materials per
cycle. White lettering, body, windows and red beacon are not recolored.

## Verification

Deterministic browser test confirmed green at zero; exact colors at 3, 6, 9, 12,
15, 18 and 21 seconds; an intermediate blend at 2.625 seconds; unchanged lettering
texture and body color; and the same crown material identity. WHOOP scale is
[1.3, 1.3, 1]. Inspected updated sign views and full Tea Party caption.

Build passes. Desktop/mobile nearby click/tap, distant-click rejection, drag
rejection, lobster message, orbit, trolley animation, iframe resizing, visibility
pause/resume and loading/fallback/retry tests pass. Actual preview loads without
observed console errors or missing assets. Existing Vite size warning remains.
