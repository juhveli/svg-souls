import sys
import os

# Adjust path to import palette and blight_filter
sys.path.append(os.getcwd())

from tools.asset_pipeline.palette import GLOOM_PALETTE
from tools.asset_pipeline.blight_filter import apply_decay

# Color Map
# 0: Void (5, 5, 5)
# 1: Deep Shadow (15, 20, 15)
# 4: Rusted Iron (60, 40, 30)
# 5: Rust (80, 50, 40)
# 8: Cold Stone (100, 100, 110)
# 14: Magic Dark (10, 30, 50)

CHAR_MAP = {
    '.': None,              # Transparent
    '@': 0,                 # Outline (Void)
    '#': 1,                 # Deep Shadow
    'L': 14,                # Lead Body (Magic Dark)
    'l': 8,                 # Highlight (Cold Stone)
    'S': 4,                 # Seal (Rusted Iron)
    's': 5,                 # Seal Highlight (Rust)
    'x': 1,                 # Inner darkness
}

JAR_ART = [
    "................................",
    "................................",
    "................................",
    "................................",
    "...........@@@@@@...............",
    "..........@sSSssS@..............",
    "..........@SsSSsS@..............",
    "..........@ssssss@..............",
    "..........@@@@@@@@..............",
    ".........@lLLLLLL@..............",
    "........@lLxxxxxxL@.............",
    "........@LxxxxxxxxL@............",
    ".......@lLxxxxxxxxL@............",
    ".......@lLxxxxxxxxL@............",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    ".......@LLxxxxxxxxLL@...........",
    "........@LLxxxxxxLL@............",
    "........@LLxxxxxxLL@............",
    ".........@LLLLLLLL@.............",
    "..........@@@@@@@@..............",
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

    # 1. Build Pixel Map
    # Split into body and outline to protect outline from decay
    body_pixels = {}
    outline_pixels = {}

    for y, row in enumerate(JAR_ART):
        for x, char in enumerate(row):
            if char in CHAR_MAP and CHAR_MAP[char] is not None:
                color_idx = CHAR_MAP[char]
                # Store hex color
                rgb = GLOOM_PALETTE[color_idx]
                hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)

                if char == '@':
                    outline_pixels[(x, y)] = hex_color
                else:
                    body_pixels[(x, y)] = hex_color

    # 2. Apply Blight (Decay)
    # Apply decay only to body, preserving the "Law of the Grid" outline
    body_pixels = apply_decay(body_pixels, decay_chance=0.05)

    # Combine
    final_pixels = {**outline_pixels, **body_pixels}

    # 3. Generate SVG Content
    svg_content = [f'<svg width="{width*scale}" height="{height*scale}" viewBox="0 0 {width*scale} {height*scale}" xmlns="http://www.w3.org/2000/svg">']

    # Sort keys for deterministic output (optional but good for diffs)
    sorted_keys = sorted(final_pixels.keys(), key=lambda k: (k[1], k[0]))

    for (x, y) in sorted_keys:
        color = final_pixels[(x, y)]
        rect = f'<rect x="{x*scale}" y="{y*scale}" width="{scale}" height="{scale}" fill="{color}" shape-rendering="crispEdges" />'
        svg_content.append(rect)

    svg_content.append('</svg>')

    return "\n".join(svg_content)

if __name__ == "__main__":
    svg = generate_svg()
    filepath = "assets/sprites/items/jar_dark.svg"
    with open(filepath, "w") as f:
        f.write(svg)
    print(f"Generated {filepath}")
