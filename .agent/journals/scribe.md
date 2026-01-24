# Scribe's Journal - The Chronology of Errors

## 📜 Scribe: Refined 'Glitch' Item Lore - Expansion

**The Connection:**
The "Glitch" items in World 5 (The Crystal Belfry) were using modern technical terms ("Math", "Resolution", "Bandwidth", "Memory") which clashed with the established "Clockwork/Crystal/Music" cosmology of the Chronocrystal Empire.

**The Fix:**
Rewrote the descriptions for `wireframe_apple`, `pixelated_tear`, and `null_texture_sample` to frame these "glitches" as failures of the Divine Song or the Blueprint, rather than computer errors.
- "Wireframe" -> "Blueprint/Ghost of a meal"
- "Pixelated" -> "Crystals/Raw Form"
- "Null Texture" -> "Void/Hole in the Tapestry"

**New Entry:**

```json
    "wireframe_apple": {
        "name": "Wireframe Apple",
        "description": "A fruit composed of nothing but edges, humming with the faint sound of a tuning fork. It casts no shadow and has no scent. \"It fell from the Blueprint Tree, before the Creator sang the flesh onto the bone. It is the ghost of a meal that never was.\"",
        "category": "consumable",
        "effect": {
            "type": "heal",
            "value": 15
        },
        "icon": "apple"
    },
    "null_texture_sample": {
        "name": "Null Texture Sample",
        "description": "A scrap of cloth that possesses no color, only a maddening pattern of absence. \"The weavers claim this is not a fabric, but a hole in the tapestry where the thread ran out. To look at it is to see the nothingness that lies behind the song.\"",
        "category": "narrative",
        "effect": null,
        "icon": "cloth"
    },
    "pixelated_tear": {
        "name": "Pixelated Tear",
        "description": "A teardrop hardened into crude, square crystals. It cuts the hand that holds it. \"When the world unravels, even sadness loses its curve. This is grief stripped of its grace, left as raw, jagged form.\"",
        "category": "narrative",
        "effect": null,
        "icon": "tear"
    }
```
