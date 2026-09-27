# Santa Fede pixel-art assets

Generated with the built-in `image_gen` tool on 2026-09-26 for Ultimate Eleven.
Exact prompts are preserved in `generation-prompts.json`.

## Masters

- `material-atlas-v1.png`: ivory plaster, limestone, terracotta roof and salmon stucco.
- `detail-atlas-v1.png`: church glazing, carved doors, green shutters and curtained windows.
- `foliage-atlas-v1.png`: ivy, laurel, geraniums and weeds, with alpha.

Each original is 1254 x 1254 pixels. The tool returned this size despite the
requested larger sheet; the originals are retained unmodified. No generated
image is a surveyed reference or a photograph of Santa Fede.

## Runtime

`ult11-santafede-art.js` samples the first two atlases into 256px material tiles
and the foliage into 128px cutouts, without canvas smoothing. Nearest
magnification preserves crisp pixels; mipmaps and anisotropic minification
reduce distant shimmer. Mirrored repeat avoids hard boundaries on non-perfect
generated tile edges. Pixel-art details are mapped to geometry, not a flat
background image.

Foliage did not obey the requested equal-quadrant layout exactly. Its four
regions are selected explicitly in the art module rather than clipping long
ivy or mixing neighboring plants. Alpha test rejects translucent fringes;
plants have lit double-sided cards and do not cast card-shaped shadows.

Doors and glass use fitted UVs. Walls, roof and stone use world-scaled UVs.
Window glazing uses tinted unlit artwork to preserve its painted reflections;
modeled surrounds, arches, ledges and buildings receive real light/shadow.
Selected windows tint warm at night. This is a stylized approximation, not a
glass transmission or physically based material simulation.

The native r128 match renderer currently grades display-referred colour with
LinearEncoding and no final linear-to-sRGB conversion. The art module decodes
its sRGB textures for lighting, then locally re-encodes those material outputs
before the existing match grade. This prevents blackened artwork without
changing the global renderer or Claude's other stadiums. If the main renderer
later moves to a fully linear post-processing pipeline, review this adapter;
its current guard only checks renderer.outputEncoding.

## Ownership and next checks

Main index loads `ult11-santafede-art.js?v=2` before
`ult11-stadium-santafede.js?v=6`. The latter retains the native pitch surface
and five-player integration and delegates environment construction to the art
module. The existing main match renderer and gameplay are unchanged.

Layout stays wall/parking behind goals, church right, housing left. The stadium
child rotates into native match coordinates; the pitch, goals and camera
presets do not rotate. Runtime geometry is the shipping source in this pass;
no new Blender export was created.

Next: author art review, actual device performance, full-match five-player
balance and set-piece checks. Native post-processing remains as authored in
the main renderer; night grain/color fringe may need a separate review.

## Daytime whole-court extension

`court-surfaces-v1.png` is a fourth built-in image_gen master, 1254 x 1254 pixels, preserved unmodified. Its exact prompt is in `court-generation-prompt.json`. Quadrants: worn asphalt, repair asphalt, faded housing stucco, damp boundary render. The latter two replace the shared church texture on houses/boundary. Three frontages retain distinct muted paint tints. A soft shadow-free daytime facade fill keeps shaded houses readable. Night tuning is no longer the art target for this venue.

Pitch uses a 256px nearest-sampled asphalt tile at eight-world-unit scale, mirrored across native pitch UVs. Runtime tint compresses bright aggregate into matte grey before the existing film grade. Fourteen repair overlays, fine seams/scuffs and the faded native marking mask are composed into the existing pitch canvas. Day map is display-ready LinearEncoding to match the legacy match pipeline and avoid a second gamma decode; native night shader remains unchanged. Async repaint guards disposal and exposes courtArtReady in stadium inspection. Physical collision and all marking coordinates remain untouched. Generated textures can contain fine continuous tone; pixel sampling is an art treatment, not certification that every source pixel was hand-authored.
