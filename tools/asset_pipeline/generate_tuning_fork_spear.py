import sys
import os
import random

# Adjust path to import palette
sys.path.append(os.getcwd())

from tools.asset_pipeline.palette import GLOOM_PALETTE

# Mapping characters to Palette Colors (Indices)
CHAR_MAP = {
    '.': None,              # Transparent
    '|': 3,                 # Handle (Dark Moss)
    'X': 1,                 # Handle Shadow (Deep Shadow) - wrapping
    'I': 8,                 # Iron Base (Cold Stone)
    'i': 9,                 # Iron Highlight/Edge (Grey)
    'D': 1,                 # Iron Dark/Shadow (Deep Shadow)
    'R': 4,                 # Rust Base (Rusted Iron)
    'r': 5,                 # Rust Highlight (Rust)
    '*': 11,                # Highlight (Pale Bone)
    'v': 9,                 # Vibration line (Grey) - floating
}

# 32x32 Grid
# The Tuning Fork Spear Shape:
# Vertical orientation.
# Long handle, splitting into a U-shape.
# "Heavy, dull iron".
# "Vibrates violently".

SPEAR_ART = [
    "................................",
    "...........v.......v............",
    "..........v.r.....r.v...........",
    "..........R.I.....I.R...........", # Tips rusted
    "..........R.I.....I.R...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........I.I.....I.I...........",
    "..........i.I.....I.i...........",
    "...........iI.....Ii............",
    "............iIIIIIi.............", # Base of fork
    ".............iiIii..............",
    "..............IDI...............", # Shaft connection
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    "..............|X|...............",
    ".............D|X|D..............", # Pommel
    "..............DDD...............",
]

def generate_svg():
    width = 32
    height = 32
    scale = 16 # Output size 512x512

    svg_content = [f'<svg width="{width*scale}" height="{height*scale}" viewBox="0 0 {width*scale} {height*scale}" xmlns="http://www.w3.org/2000/svg">']

    # Iterate grid
    for y, row in enumerate(SPEAR_ART):
        for x, char in enumerate(row):
            if char in CHAR_MAP and CHAR_MAP[char] is not None:
                color_idx = CHAR_MAP[char]
                rgb = GLOOM_PALETTE[color_idx]

                # Blight Filter: Automate the Grit
                # Randomly rust the Iron parts
                if char in ['I', 'i'] and random.random() < 0.15:
                     # 15% chance to rust iron
                     rust_color_idx = 4 if random.random() < 0.7 else 5
                     rgb = GLOOM_PALETTE[rust_color_idx]

                # Randomly darken handle parts
                if char == '|' and random.random() < 0.1:
                    rgb = GLOOM_PALETTE[7] # Old Wood variation

                hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)

                rect = f'<rect x="{x*scale}" y="{y*scale}" width="{scale}" height="{scale}" fill="{hex_color}" shape-rendering="crispEdges" />'
                svg_content.append(rect)

    svg_content.append('</svg>')

    return "\n".join(svg_content)

if __name__ == "__main__":
    svg = generate_svg()
    # Ensure directory exists
    os.makedirs("assets/sprites/items", exist_ok=True)

    filepath = "assets/sprites/items/tuning_fork_spear.svg"
    with open(filepath, "w") as f:
        f.write(svg)
    print(f"Generated {filepath}")
