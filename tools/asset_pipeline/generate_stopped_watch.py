import sys
import os
import random

# Adjust path to import palette
sys.path.append(os.getcwd())

from tools.asset_pipeline.palette import GLOOM_PALETTE
from tools.asset_pipeline.blight_filter import apply_decay

# Palette Indices
# 0: Void (5, 5, 5)
# 4: Rusted Iron (60, 40, 30) - Outline
# 5: Rust (80, 50, 40) - Rust spots
# 6: Clay (100, 70, 50) - Brass Base
# 7: Old Wood (120, 90, 70) - Brass Highlight
# 10: Old Bone (160, 160, 150) - Face Shadow
# 11: Pale Bone (200, 200, 190) - Face Base

CHAR_MAP = {
    '.': None,
    '#': 4,  # Rusted Iron (Dark Outline)
    'B': 6,  # Clay (Brass Base)
    'b': 7,  # Old Wood (Brass Highlight)
    'F': 11, # Pale Bone (Face)
    'f': 10, # Old Bone (Face Shadow)
    'H': 0,  # Void (Hands)
    'R': 5,  # Rust
}

# 32x32 Grid
WATCH_ART = [
    "................................",
    "................................",
    "...........#####................",
    "..........#bbbbb#...............",
    "..........#bBBBb#...............",
    "..........#BBBBB#...............",
    ".......####BBBBB####............",
    ".....##BBBBBBBBBBBBB##..........",
    "....#bBBBBBBBBBBBBBBBb#.........",
    "...#bBBBBBBBBBBBBBBBBBb#........",
    "..#bBBBB###########BBBBb#.......",
    "..#BBBBB#FFFFFFFFF#BBBBB#.......",
    ".#BBBBBB#FFFFHFFFF#BBBBBB#......",
    ".#BBBBBB#FFFHHHFFF#BBBBBB#......",
    ".#BBBBBB#FFHFFHFFF#BBBBBB#......",
    ".#BBBBBB#FFFFHFFFF#BBBBBB#......",
    ".#BBBBBB#FFFFFFFFF#BBBBBB#......",
    ".#BBBBBB#FFFFFFFFF#BBBBBB#......",
    "..#BBBBB#FFFFFFFFF#BBBBB#.......",
    "..#BBBBB###########BBBBB#.......",
    "...#bBBBBBBBBBBBBBBBBBb#........",
    "....#bBBBBBBBBBBBBBBBb#.........",
    ".....##BBBBBBBBBBBBB##..........",
    ".......####BBBBB####............",
    "...........#####................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]

def generate_svg():
    width = 32
    height = 32
    scale = 16

    pixel_map = {} # (x,y) -> color_index

    for y, row in enumerate(WATCH_ART):
        for x, char in enumerate(row):
            if char in CHAR_MAP and CHAR_MAP[char] is not None:
                color_idx = CHAR_MAP[char]

                # Apply Rust Logic
                # If it's Brass (B or b), small chance to become Rust (5) or Rusted Iron (4)
                if char in ['B', 'b']:
                    if random.random() < 0.15: # 15% rust
                         color_idx = 5 if random.random() > 0.3 else 4

                # If it's Face (F or f), chance to be dirty (Clay or Old Bone)
                if char in ['F']:
                    if random.random() < 0.05:
                        color_idx = 10 # Shadow

                pixel_map[(x,y)] = color_idx

    # Convert pixel_map values to hex string for blight_filter
    hex_map = {}
    for pos, idx in pixel_map.items():
        rgb = GLOOM_PALETTE[idx]
        hex_map[pos] = "#{:02x}{:02x}{:02x}".format(*rgb)

    # Apply blight filter (decay)
    # 2% chance of pixel loss
    decayed_map = apply_decay(hex_map, decay_chance=0.02)

    # Generate SVG
    svg_content = [f'<svg width="{width*scale}" height="{height*scale}" viewBox="0 0 {width*scale} {height*scale}" xmlns="http://www.w3.org/2000/svg">']

    # Sort keys for stable output
    for pos in sorted(decayed_map.keys(), key=lambda k: (k[1], k[0])):
        x, y = pos
        hex_color = decayed_map[pos]
        rect = f'<rect x="{x*scale}" y="{y*scale}" width="{scale}" height="{scale}" fill="{hex_color}" shape-rendering="crispEdges" />'
        svg_content.append(rect)

    svg_content.append('</svg>')
    return "\n".join(svg_content)

if __name__ == "__main__":
    svg = generate_svg()
    output_path = "assets/sprites/items/watch.svg"
    with open(output_path, "w") as f:
        f.write(svg)
    print(f"Generated {output_path}")
