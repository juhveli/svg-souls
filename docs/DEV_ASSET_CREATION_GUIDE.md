# Developer Instructions: Isometric Asset Creation & Iteration

Follow this workflow to source, process, and visually verify new isometric pixel-art assets.

## 1. Sourcing from OpenGameArt
The primary repository for our base assets is the curated Isometric RPG Collection on OpenGameArt.

* Browse the collection for assets that fit our architectural needs (e.g., "Dark Ruins Tilesets", "Classic Dungeon Walls", "Medieval Props").
* Crucial: Verify the license is CC0 or CC-BY. If CC-BY, you MUST immediately add the author to docs/CREDITS.md.
* Download the asset pack zip. You can automate this using our downloader script:
`python3 tools/asset_pipeline/download_isometric_assets.py --url <ZIP_URL> --out assets/sprites/raw/<PACK_NAME>`
* Categorize the raw PNGs. Separate structural tiles (floors/walls) from props (crates, gears) and entities (characters).

## 2. Processing & Masking
Raw assets from OpenGameArt are often too bright and colorful for our cosmology. Use `tools/asset_pipeline/process_isometric_assets.py` to strip away primary colors, enforce the grid, and inject our signature decay.

**Extending the Processor by Lore Zone:** You must tailor the script's processing parameters based on the asset's intended lore location and material:

* **Zone 0 (The Scrapyard):** Heavy rust, dark metal, deep void shadows.
    * Palette: RUST or VOID.
    * Decay: High (decay_chance=0.15). We want visible holes in the metal.
* **Zone 1 (Glass Gardens):** Sharp, translucent, shattered elegance.
    * Palette: VERDIGRIS mixed with stark whites/greys.
    * Decay: Medium (decay_chance=0.08), but modify the script to prefer cracking patterns rather than round holes.
* **Zone 5 (The Crystal Belfry/Glitch Space):** Reality breaking down.
    * Palette: CORRUPTED_NEON mixed with pure VOID.
    * Decay: High, but localized to blocky/pixelated chunks (modify script to remove 4x4 pixel blocks).

**Masking Techniques (Preserving Detail):** When processing complex entities (like the MetronomeGeneral), you may need to preserve certain glowing features.

* Modify `process_isometric_assets.py` to identify specific bright RGB ranges in the raw PNG (e.g., pure red eyes).
* "Mask" these pixels from the darkening pass.
* Apply a CORRUPTED_NEON (e.g., Cyan or Magenta) color to them instead of the standard Rust/Void, ensuring they pop against the dark outline.

## 3. Visual Checking & Iteration
The most critical step is verifying that the processed asset looks correct in the engine and feels right according to the lore.

**Iteration Loop:**

1. **Process:** Run the processor on a batch of raw PNGs into `assets/sprites/isometric/`.
2. **Pack:** Run the atlas packer to rebuild the sprite sheet:
`python3 tools/asset_pipeline/update_atlas.py`
3. **Stage:** Open a dedicated test map (e.g., temporarily modify `src/world/ScrapyardMap.ts` to spawn a grid of your new tiles and props).
4. **Serve:** Start the local dev server using:
`npm run dev`
5. **The Lore Check:** Open the game in your browser (`localhost:5173`) side-by-side with the relevant lore document (e.g., `docs/lore_locations.md` or `docs/lore_items.md`). Ask yourself:
    * Does this "Dark Ruin Wall" look like the shattered remains of the Clockwork Empire?
    * Is it dark enough? If it draws too much attention, the player won't see the enemies.
    * Is the 1-pixel Void outline legible against the background?
6. If an asset fails the visual check (e.g., it looks too clean, or the perspective is slightly off the 2:1 isometric grid), adjust the parameters in `process_isometric_assets.py` (increase decay, change palette mapping thresholds) and run steps 1-5 again.