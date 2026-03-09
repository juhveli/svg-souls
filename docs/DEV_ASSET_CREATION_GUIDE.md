# Developer Guide: Isometric Asset Iteration & Creation

This guide outlines the complete workflow for sourcing, processing, and visually verifying new isometric pixel-art assets to ensure they strictly adhere to our "16-bit Zelda cartridge left in the rain" and dark fantasy aesthetic.

## 1. Sourcing from OpenGameArt
The primary repository for our base assets is the curated [Isometric RPG Collection on OpenGameArt](https://opengameart.org/content/isometric-rpg).

**Sourcing Workflow:**
1. Browse the collection for assets that fit our architectural needs (e.g., "Dark Ruins Tilesets", "Classic Dungeon Walls", "Medieval Props").
2. Verify the license is **CC0** or **CC-BY**. If CC-BY, you MUST immediately add the author to `docs/CREDITS.md`.
3. Download the asset pack zip. You can automate this using our downloader script:
   ```bash
   python3 tools/asset_pipeline/download_isometric_assets.py --url <ZIP_URL> --out assets/sprites/raw/<PACK_NAME>
   ```
4. Categorize the raw PNGs. Separate structural tiles (floors/walls) from props (crates, gears) and entities (characters).

## 2. Processing & Masking
Raw assets from OpenGameArt are often too bright and colorful for our cosmology. We rely on `tools/asset_pipeline/process_isometric_assets.py` to strip away primary colors and inject our signature decay.

**Extending the Processor:**
You must tailor the processing parameters based on the asset's intended lore location and material:

*   **Zone 0 (The Scrapyard):** Heavy rust, dark metal, deep void shadows.
    *   *Palette:* `RUST` or `VOID`.
    *   *Decay:* High (`decay_chance=0.15`). We want visible holes in the metal.
*   **Zone 1 (Glass Gardens):** Sharp, translucent, shattered elegance.
    *   *Palette:* `VERDIGRIS` mixed with stark whites/greys.
    *   *Decay:* Medium (`decay_chance=0.08`), but modify the script to prefer cracking patterns rather than round holes.
*   **Zone 5 (The Crystal Belfry/Glitch Space):** Reality breaking down.
    *   *Palette:* `CORRUPTED_NEON` mixed with pure `VOID`.
    *   *Decay:* High, but localized to blocky/pixelated chunks (modify script to remove 4x4 pixel blocks).

**Masking Techniques:**
When processing complex entities (like the `MetronomeGeneral`), you may need to preserve certain glowing features.
1. Modify `process_isometric_assets.py` to identify specific bright RGB ranges in the raw PNG (e.g., pure red eyes).
2. "Mask" these pixels from the darkening pass.
3. Apply a `CORRUPTED_NEON` (e.g., Cyan or Magenta) color to them instead of the standard Rust/Void.

## 3. Visual Checking & Iteration
The most critical step is verifying that the processed asset looks correct *in the engine* and feels right according to the lore.

**Iteration Loop:**
1. Process a batch of raw PNGs into `assets/sprites/isometric/`.
2. Run the atlas packer:
   ```bash
   python3 tools/asset_pipeline/update_atlas.py
   ```
3. Open a dedicated test map (e.g., temporarily modify `src/world/ScrapyardMap.ts` to spawn a grid of your new tiles and props).
4. Start the local dev server using `npm run dev &`.
5. **The Lore Check:** Open the game in your browser (`localhost:5173`) side-by-side with the relevant lore document (e.g., `docs/lore_locations.md` or `docs/lore_items.md`).
    *   *Does this "Dark Ruin Wall" look like the shattered remains of the Clockwork Empire?*
    *   *Is it dark enough? If it draws too much attention, the player won't see the enemies.*
    *   *Is the 1-pixel Void outline legible against the background?*

If an asset fails the visual check (e.g., it looks too clean, or the perspective is slightly off the 2:1 isometric grid), adjust the parameters in `process_isometric_assets.py` (increase decay, change palette mapping thresholds) and run steps 1-5 again.
