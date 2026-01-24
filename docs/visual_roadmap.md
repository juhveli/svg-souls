# Visual Roadmap & Trajectory

## Overview
This document outlines the planned transition from the legacy "One-Screen SVG" background system to a modern, scrolling, multi-layer visual system suitable for a Zelda-like adventure with high-fidelity visuals.

## Current State (v0.1)
- **Rendering:** Hybrid. Entities are rendered via WebGPU (SDFs/Shaders). Background is rendered via SVG DOM elements (`#world-layer`).
- **Scrolling:** Functional. The SVG layer's `transform` is updated to match the camera.
- **Visual Quality:** Low. Backgrounds are largely flat colors with simple SVG paths (gears, junk piles).
- **Issues:**
    - "Void" effect when scrolling past SVG bounds (patched with background rects).
    - Lack of parallax depth.
    - Flat lighting in background vs dynamic lighting in WebGPU.

## Target State (v1.0)
- **Rendering:** Unified WebGPU or Hybrid with Canvas-based Backgrounds.
- **Scrolling:** Seamless, tile-based or large texture streaming.
- **Visual Quality:** High-fidelity pixel art or high-res SDF compositions.

## Action Plan

### Phase 1: Parallax Layers (Priority)
Replace the single `#world-layer` SVG group with three distinct groups/layers:
1.  `#bg-far` (Scroll speed 0.5x): Distant skyline, smog, giant machinery.
2.  `#bg-mid` (Scroll speed 1.0x): The current playable floor, walls, and collision objects.
3.  `#fg-close` (Scroll speed 1.2x): Foreground pipes, chains, and fog overlays that pass *in front* of the player.

### Phase 2: Asset Pipeline Upgrade
The current `SVGAssets.ts` generates simple paths. We need to:
- **TODO:** Implement a "Sprite Batch" system for the background. Instead of 1000 separate SVG DOM nodes (slow), render static geometry to an `OffscreenCanvas` and draw that as a single texture in WebGPU.
- **TODO:** Create a "Tile Editor" or import logic for `Tiled` (tm) maps to allow complex level design beyond procedural scattering.

### Phase 3: Lighting Integration
Currently, WebGPU entities are lit, but the SVG background is unlit.
- **Goal:** Render the background *into* the WebGPU pipeline (e.g., as a texture quad at Z=1.0) so it receives the same lighting/shadows as the entities.

## Specific TODOs by File

### `src/world/GameMap.ts`
- [ ] Deprecate `el: SVGGElement`. Move to `render(ctx: GPUCanvasContext)` or similar.
- [ ] Add `backgroundLayers: Layer[]` to support parallax.

### `src/world/ScrapyardMap.ts`
- [ ] Replace `junkPile` procedural generation with hand-crafted "Junk Hills" assets.
- [ ] Add `FogSystem` overlay for "Smog Vent" areas.

### `src/engine/Game.ts`
- [ ] Implement "Room Transition" logic (Zelda 1 / Link to the Past style) where the camera pans to a new discrete area, OR implement "Chunk Streaming" for continuous open world. Currently, it is a hybrid continuous scroll within a Zone.
