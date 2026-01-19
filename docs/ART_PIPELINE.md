# Art Pipeline: The "Crunch" Workflow

This document outlines the "High-Definition to Low-Fidelity" (HD-to-LoFi) rendering pipeline used to generate "16-bit Dark Souls" quality assets programmatically.

## The Core Concept
We do not write code to "draw a pixel." We write code to define a shape, and then use a script to "crunch" that shape into a pixel-art style.

## Workflow: 4-Stage Generation

### Stage A: Parametric Vector Definition (The Skeleton)
Instead of drawing a sword, we write a script that generates a sword based on parameters.
*   **Input**: `generate_sword(type="claymore", curvature=0.2, damage_wear=0.8)`
*   **Logic**: The script draws a high-resolution SVG black-and-white silhouette.
*   **Why**: Allows generating 100 unique swords in 1 second.

### Stage B: The "Pixel Crunch" (Rasterization)
We "take a picture" of the vector at a tiny resolution.
*   **Action**: Render the SVG at 64x64 pixels (standard 16-bit character size).
*   **Technique**: Use "Nearest Neighbor" scaling.
*   **Result**: A blurry or jagged grey shape.

### Stage C: The "Souls" Pass (Palette Injection)
We map grayscale values to a specific "Gothic" palette using Index Mapping.
*   **Mapping Logic**:
    *   Brightness 0-20% -> Deep Black (Void)
    *   Brightness 21-40% -> Dark Swamp Green (Shadow)
    *   Brightness 41-60% -> Rusted Iron (Midtone)
    *   Brightness 80-100% -> Pale Bone (Highlight)
*   **Noise**: Programmatically inject "salt and pepper" noise before indexing to create texture (rust/decay).

### Stage D: Edge Cleanup (Outline Shader)
Standard rasterization leaves "semi-transparent" pixels.
*   **Action**: Check every pixel's alpha channel.
*   **Logic**: `If Alpha > 0.1 then Alpha = 1.0 ELSE Alpha = 0.0`.
*   **Result**: Crisp, hard edges typical of 16-bit games.

## Automated Quality Verification (QA)
We write Unit Tests for Art.

### Test A: Silhouette Readability (The "Squint Test")
*   **Script**: Calculate ratio of "Foreground Pixels" to "Background Pixels".
*   **Fail Condition**: If sprite is >80% solid block or <10% thin lines, it fails.

### Test B: Contrast Ratio (WCAG for Sprites)
*   **Script**: Check luminosity difference between "Highlight" and "Shadow" colors.
*   **Fail Condition**: If contrast is too low (e.g., dark grey on black), auto-brighten highlights.

### Test C: Banding Detection
*   **Script**: Scan for rows of pixels where color changes gradually (1 pixel shift per row).
*   **Fix**: Inject random noise to break up gradients.

## Tech Stack
*   **Generation**: Python (CairoSVG / Pillow) or Node.js (Canvas API).
*   **Styling**: ImageMagick or Python (Pillow/NumPy).
*   **Environment**: Wave Function Collapse (WFC) for dungeons.
