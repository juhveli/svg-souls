# Isometric PNG Asset Pipeline

## Overview
This document outlines the workflow and requirements for integrating raw 2D pixel-art assets (PNG format) into the dark fantasy, rusted, and silent aesthetic of the game world.

## Sourcing
1. Ensure the asset is CC0 (Public Domain) or CC-BY.
2. If CC-BY, add attribution immediately to `CREDITS.md`.
3. High-quality sources: [OpenGameArt.org](https://opengameart.org), [Kenney.nl](https://kenney.nl).
4. Download the raw asset pack and extract it to `assets/sprites/raw/PACK_NAME`. You can use `tools/asset_pipeline/download_isometric_assets.py` for automated downloading.

## Processing Requirements
All imported raw assets must undergo the "Blight Filter" pass to maintain visual consistency with the 16-bit decaying cartridge aesthetic.

### 1. Execute the Processor
Run the `process_isometric_assets.py` script:
```bash
python3 tools/asset_pipeline/process_isometric_assets.py
```
This script performs the following critical steps:

### 2. Resolution & Grid Compliance
- All flat terrain/floor tiles MUST be resized and projected to exactly `64x32` pixels (2:1 isometric ratio).
- Wall tiles, entities, and props should typically have a base footprint of `64x32` but can extend upward in height (e.g., `64x64`, `64x128`).
- The processor uses Nearest-Neighbor (`Image.Resampling.NEAREST`) resizing to maintain crisp pixel edges.

### 3. Palette Confinement
- Raw RGB values are aggressively mapped to the project's canonical palettes using a closest-color Euclidean distance calculation.
- **RUST:** `(139, 69, 19), (160, 82, 45), (205, 133, 63), (210, 105, 30), (107, 62, 36), (61, 31, 14)`
- **VOID:** `(10, 10, 10), (25, 25, 25), (40, 40, 40), (15, 20, 25)`
- Base brightness determines whether a pixel falls into the VOID shadows or the RUST highlights.

### 4. Blight Filter (Decay Injection)
- A probability threshold (`decay_chance=0.08`) is evaluated for every non-transparent pixel.
- Selected pixels are either converted to pure VOID (`15, 15, 15, 255`) or entirely erased (`Alpha 0`) to simulate holes, rot, and data corruption on the physical cartridge.
- Random noise (-15 to +15 RGB shift) is applied to non-decayed pixels to add "grit".

### 5. Silhouette Readability (Outline)
- An edge-detection pass automatically adds a 1-pixel wide pure Void (`10, 10, 10`) outline to all outer boundaries of the sprite. This ensures entities and objects pop against the dark backgrounds.

## Engine Integration
1. Processed files are saved to `assets/sprites/isometric/` with a `_decayed.png` suffix.
2. Update `assets/sprite_atlas.json` (or the texture loader) to reference the new textures.
3. Update specific maps (e.g. `ScrapyardMap.ts`) to assign these `textureId`s to `TileData`.
