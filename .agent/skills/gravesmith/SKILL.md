---
name: gravesmith_asset_generator
description: A specialized routine for generating 16-bit SVG assets with a "Dark Souls" aesthetic (gritty, high-contrast, decaying) for a top-down Zelda-style perspective.
---

# GraveSmith Skill Instructions

## When to use
Use this skill when the user requests a game asset (enemy, NPC, or item) that needs to fit the "Grimdark 16-bit" aesthetic. Do NOT use this for clean, vibrant, or high-fantasy assets.

## Core Logic: The "Blighted Trinity"
1. **Skeleton Selection**: Fetch a base SVG rig based on the entity's size and perspective.
2. **Texture Synthesis**: Generate a hex-encoded pixel string representing the "decayed" material (rust, rotted cloth, obsidian).
3. **Blight Application**: Run the `blight_filter.py` to inject "grit" (noise) and directional shadows that follow the Zelda-view light source (45° Top-Left).

## Constraints & Rules
- **Pixel Grid**: All assets must align to a 1x1 integer grid. No sub-pixel offsets.
- **Palette**: Strictly adhere to the `SOULS_16` palette (Grave-Grey, Blood-Ochre, Void-Black).
- **Anti-Aliasing**: Must be set to `shape-rendering: crispEdges`.
- **Filtering**: Never use `feGaussianBlur`. Use `feComponentTransfer` for hard-edge shadows.

## Inputs
- `entity_type`: [humanoid_small, humanoid_large, object_static]
- `decay_level`: Float [0.0 - 1.0] (0 is 'New', 1 is 'Ancient Dust')
- `direction`: [North, South, East, West]
