import sys
import os

# Adjust path to import palette
sys.path.append(os.getcwd())

from tools.asset_pipeline.palette import GLOOM_PALETTE
import random

# Mapping characters to Palette Colors (Indices)
# GLOOM_PALETTE indices:
# 0: Void (5, 5, 5)
# 1: Deep Shadow (15, 20, 15)
# 4: Rusted Iron (60, 40, 30)
# 5: Rust (80, 50, 40)
# 6: Clay (100, 70, 50)
# 7: Old Wood (120, 90, 70) - Goldish Base
# 8: Cold Stone (100, 100, 110)
# 9: Grey (130, 130, 130)
# 11: Pale Bone (200, 200, 190) - Highlight
# 12: Blood Dry (50, 10, 10)
# 14: Magic Dark (10, 30, 50)

CHAR_MAP = {
    '.': None,              # Transparent
    '#': 9,                 # Glass Outline (Grey)
    'o': 11,                # Glass Highlight (Pale Bone)
    'g': 8,                 # Glass Inner (Cold Stone) - slightly darker
    '~': 7,                 # Liquid Base (Old Wood - Goldish)
    '*': 6,                 # Liquid Highlight (Clay - brighter/warmer)
    'c': 4,                 # Cork (Rusted Iron)
    'C': 5,                 # Cork Highlight (Rust)
    'x': 0,                 # Twitch/Void bits inside liquid
}

# 32x32 Grid
# The Vial Shape:
# A small neck, a bulbous body.
# Liquid level is high.
# "Viscous fluid that twitches".

VIAL_ART = [
    "................................",
    "................................",
    "................................",
    "................................",
    "...........CCCC.................",
    "...........cccc.................",
    "...........cccc.................",
    "..........######................",
    "..........#gooo#................",
    "..........#g~~g#................",
    ".........#gg~~gg#...............",
    ".........#g~~~~g#...............",
    "........#gg~~~~gg#..............",
    "........#g~x~~*~g#..............",
    "........#g~~~~~~g#..............",
    ".......#gg~*~~~~gg#.............",
    ".......#g~~~~x~~~g#.............",
    ".......#g~~~~~~~~g#.............",
    ".......#g~~~~*~~~g#.............",
    ".......#gg~~~~~~gg#.............",
    "........#g~~~~~~g#..............",
    "........#gg~~~~gg#..............",
    ".........#gggggg#...............",
    "..........######................",
    "................................",
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
    scale = 16 # Output size 512x512

    svg_content = [f'<svg width="{width*scale}" height="{height*scale}" viewBox="0 0 {width*scale} {height*scale}" xmlns="http://www.w3.org/2000/svg">']

    # Iterate grid
    for y, row in enumerate(VIAL_ART):
        for x, char in enumerate(row):
            if char in CHAR_MAP and CHAR_MAP[char] is not None:
                color_idx = CHAR_MAP[char]
                # Apply "Blight" (Noise)
                # Slightly vary the color or pick a neighbor color?
                # Actually, for the SVG generation phase, let's keep it clean or apply slight variations.
                # But since we want to output rects with specific hex codes, let's stick to the palette.

                rgb = GLOOM_PALETTE[color_idx]

                # "Blight Filter": Add noise to the color before writing hex
                # But wait, "The Grid is Law".
                # If I add noise here, I am creating more colors than the 16 color palette.
                # The processor pipeline re-maps to palette anyway.
                # But if I want the SVG to be "programmatically perfect", I should probably stick to the palette.
                # However, the prompt says "Don't draw rust; write a script that generates it."
                # Maybe I should randomly swap some pixels with "Rust" or "Void" or "Dirt" colors?

                final_rgb = rgb

                # Simple blight: Randomly darken or rust specific materials
                if char in ['#', 'g'] and random.random() < 0.05:
                    final_rgb = GLOOM_PALETTE[4] # Rust spots on glass/metal

                hex_color = "#{:02x}{:02x}{:02x}".format(*final_rgb)

                rect = f'<rect x="{x*scale}" y="{y*scale}" width="{scale}" height="{scale}" fill="{hex_color}" shape-rendering="crispEdges" />'
                svg_content.append(rect)

    svg_content.append('</svg>')

    return "\n".join(svg_content)

if __name__ == "__main__":
    svg = generate_svg()
    with open("assets/sprites/items/vial.svg", "w") as f:
        f.write(svg)
    print("Generated assets/sprites/items/vial.svg")
