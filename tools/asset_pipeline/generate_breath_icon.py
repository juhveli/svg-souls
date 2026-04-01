import os
import sys
import math
import random

# Add current directory to path to import local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from blight_filter import apply_decay
except ImportError:
    # Fallback if running from root
    sys.path.append(os.path.join(os.getcwd(), 'tools', 'asset_pipeline'))
    from blight_filter import apply_decay

# Palette derived from palette.py Gloom Palette
PALETTE = {
    "PaleBone": "#c8c8be",  # (200, 200, 190)
    "OldBone": "#a0a096",   # (160, 160, 150)
    "Clay": "#644632",      # (100, 70, 50)
    "Rust": "#503228",      # (80, 50, 40)
    "Void": "#050505",      # (5, 5, 5)
    "MagicDark": "#0a1e32"  # (10, 30, 50)
}

def generate_svg():
    width = 32
    height = 32

    pixel_map = {}

    cx, cy = 16, 16

    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)

            # Logic for sphere
            if dist <= 12.0:
                # Rim
                if dist > 11.0:
                    pixel_map[(x,y)] = PALETTE["OldBone"]
                # Glass Body
                elif dist > 9.0:
                    pixel_map[(x,y)] = PALETTE["PaleBone"]
                # Interior (Molten Sand)
                else:
                    # Swirl pattern
                    # Using a simple sine wave modulated by distance for a "swirl"
                    angle = math.atan2(dy, dx)
                    swirl = math.sin(dist * 0.8 + angle * 3.0)

                    if swirl > 0.0:
                         pixel_map[(x,y)] = PALETTE["Clay"]
                    else:
                         pixel_map[(x,y)] = PALETTE["Rust"]

                # Highlight (Specular) - Top Left
                # Simple 2x2 highlight
                if 11 <= x <= 12 and 11 <= y <= 12:
                    pixel_map[(x,y)] = PALETTE["PaleBone"]

                # Add some "Void" cracks inside?
                # Maybe rely on blight filter for that.

    # Apply Decay
    # "He had no breath left to tell them they were fragile."
    # We apply a small amount of decay to show it's ancient/crystallized.
    pixel_map = apply_decay(pixel_map, decay_chance=0.03)

    # Convert to Rects
    rects = []
    for y in range(height):
        current_color = None
        run_start = -1
        for x in range(width):
            color = pixel_map.get((x,y))
            if color != current_color:
                if current_color is not None:
                    w = x - run_start
                    rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')
                current_color = color
                run_start = x
        if current_color is not None:
            w = width - run_start
            rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')

    svg_content = f'''<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    {''.join(rects)}
</svg>'''

    output_path = "assets/sprites/items/breath_of_creator.svg"
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        f.write(svg_content)
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
