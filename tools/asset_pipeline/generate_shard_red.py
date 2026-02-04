import sys
import os
import random

# Adjust path to import palette and blight_filter
sys.path.append(os.getcwd())

from tools.asset_pipeline.palette import GLOOM_PALETTE
from tools.asset_pipeline.blight_filter import apply_decay

# Palette Indices
VOID = 0
BLOOD_DRY = 12
BLOOD_FRESH = 13
RUST = 5
PALE_BONE = 11

def sign(p1, p2, p3):
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

def point_in_triangle(pt, v1, v2, v3):
    d1 = sign(pt, v1, v2)
    d2 = sign(pt, v2, v3)
    d3 = sign(pt, v3, v1)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)

def draw_triangle(grid, v1, v2, v3, color_idx):
    min_x = int(max(0, min(v1[0], v2[0], v3[0])))
    max_x = int(min(31, max(v1[0], v2[0], v3[0])))
    min_y = int(max(0, min(v1[1], v2[1], v3[1])))
    max_y = int(min(31, max(v1[1], v2[1], v3[1])))

    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if point_in_triangle((x, y), v1, v2, v3):
                grid[(x, y)] = color_idx

def generate_shard():
    grid = {} # (x,y) -> color_index

    # 1. Base Shapes (Blood Fresh)
    # Main spike
    draw_triangle(grid, (10, 28), (22, 28), (16, 2), BLOOD_FRESH)
    # Left jagged piece
    draw_triangle(grid, (8, 28), (14, 28), (6, 16), BLOOD_FRESH)
    # Right jagged piece
    draw_triangle(grid, (18, 28), (24, 28), (26, 18), BLOOD_FRESH)

    # 2. Shading (Blood Dry) - Right side of shapes
    # Split the main spike?
    # Let's just overlay a shadow triangle on the right half
    draw_triangle(grid, (16, 28), (22, 28), (16, 2), BLOOD_DRY)
    draw_triangle(grid, (18, 28), (24, 28), (26, 18), BLOOD_DRY) # Right piece is mostly shadow

    # 3. Highlights (Pale Bone) - Top edges / Tips
    # Tip of main spike
    grid[(16, 2)] = PALE_BONE
    grid[(16, 3)] = PALE_BONE
    grid[(15, 4)] = PALE_BONE

    # Left edge highlight
    for i in range(5):
        grid[(15 - i, 5 + i*3)] = PALE_BONE

    # Tip of left shard
    grid[(6, 16)] = PALE_BONE

    # Random glimmer
    grid[(18, 12)] = PALE_BONE

    # 4. Apply Decay (Blight Filter)
    # Convert grid to format expected by apply_decay: {(x,y): hex_string}?
    # Wait, apply_decay expects hex strings?
    # Let's check blight_filter.py again.
    # Yes: "Modified pixel_map ... pixel_map: Dictionary {(x, y): hex_color_string}"

    # So I need to convert my indices to hex first.
    pixel_map = {}
    for pos, idx in grid.items():
        rgb = GLOOM_PALETTE[idx]
        pixel_map[pos] = "#{:02x}{:02x}{:02x}".format(*rgb)

    # Apply decay
    # Increasing decay slightly because it's a "Shard of Panic" - should look fractured
    pixel_map = apply_decay(pixel_map, decay_chance=0.08)

    # 5. Add Outline (Void)
    # We add the outline AFTER decay to ensure the decayed shape is outlined?
    # Or should the outline also be decayed?
    # "The agent tends to forget the 1-pixel black outline... Manually inject an outline_pass"
    # Usually outline encloses the visible pixels.

    final_grid = pixel_map.copy()

    # Find outline positions
    outline_positions = set()
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    for (x, y) in pixel_map.keys():
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if (nx, ny) not in pixel_map:
                outline_positions.add((nx, ny))

    # Apply outline color (Void)
    void_hex = "#{:02x}{:02x}{:02x}".format(*GLOOM_PALETTE[VOID])
    for pos in outline_positions:
        final_grid[pos] = void_hex

    return final_grid

def export_svg(pixel_map, filepath):
    width = 32
    height = 32
    scale = 16

    svg_content = [f'<svg width="{width*scale}" height="{height*scale}" viewBox="0 0 {width*scale} {height*scale}" xmlns="http://www.w3.org/2000/svg">']

    # Background rect? No, transparency is key.

    for (x, y), color in pixel_map.items():
        rect = f'<rect x="{x*scale}" y="{y*scale}" width="{scale}" height="{scale}" fill="{color}" shape-rendering="crispEdges" />'
        svg_content.append(rect)

    svg_content.append('</svg>')

    with open(filepath, "w") as f:
        f.write("\n".join(svg_content))
    print(f"Generated {filepath}")

if __name__ == "__main__":
    pixels = generate_shard()
    export_svg(pixels, "assets/sprites/items/shard_red.svg")
