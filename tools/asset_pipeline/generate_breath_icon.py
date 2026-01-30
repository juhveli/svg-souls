import os
import sys
import random
import math

# Add the project root to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from tools.asset_pipeline.palette import GLOOM_PALETTE
    from tools.asset_pipeline.blight_filter import apply_decay
except ImportError:
    # Fallback if running directly from folder
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from asset_pipeline.palette import GLOOM_PALETTE
    from asset_pipeline.blight_filter import apply_decay

def generate_svg():
    width = 32
    height = 32

    # Molten Sand Palette (Indices from GLOOM_PALETTE)
    # 5: Rust (80, 50, 40)
    # 6: Clay (100, 70, 50)
    # 7: Old Wood (120, 90, 70)
    # 10: Old Bone (160, 160, 150)
    # 11: Pale Bone (200, 200, 190)

    # Mapping to hex for SVG
    def rgb_to_hex(rgb):
        return '#{:02x}{:02x}{:02x}'.format(*rgb)

    PALETTE = {
        "Rust": rgb_to_hex(GLOOM_PALETTE[5]),
        "Clay": rgb_to_hex(GLOOM_PALETTE[6]),
        "Wood": rgb_to_hex(GLOOM_PALETTE[7]),
        "Bone": rgb_to_hex(GLOOM_PALETTE[10]),
        "Pale": rgb_to_hex(GLOOM_PALETTE[11]),
        "Void": rgb_to_hex(GLOOM_PALETTE[0]),
        "Shadow": rgb_to_hex(GLOOM_PALETTE[1])
    }

    pixel_map = {} # (x,y) -> color

    # Cellular Automata for "Organic Crystal Bubble"
    # Initialize random noise centered
    center_x, center_y = 16, 16

    for y in range(height):
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = (dx*dx + dy*dy)**0.5

            # Base shape: Cluster of bubbles
            # We use multiple centers to simulate fused bubbles

            # Bubble 1 (Main)
            d1 = ((x - 16)**2 + (y - 18)**2)**0.5
            # Bubble 2 (Top Left)
            d2 = ((x - 12)**2 + (y - 12)**2)**0.5
            # Bubble 3 (Top Right)
            d3 = ((x - 20)**2 + (y - 14)**2)**0.5

            # Union of metaballs-ish
            # Simple threshold
            val = 0
            val += 10 / (d1 + 0.1)
            val += 7 / (d2 + 0.1)
            val += 6 / (d3 + 0.1)

            if val > 1.2:
                # Core
                if val > 2.0:
                    pixel_map[(x,y)] = PALETTE["Pale"]
                elif val > 1.6:
                    pixel_map[(x,y)] = PALETTE["Bone"]
                elif val > 1.4:
                    pixel_map[(x,y)] = PALETTE["Wood"]
                else:
                    pixel_map[(x,y)] = PALETTE["Clay"]

            # Add some "Rust" crusted edges or floating particles
            if 0.5 < val <= 0.8:
                if random.random() < 0.3:
                    pixel_map[(x,y)] = PALETTE["Rust"]

    # Apply Decay (The Grit)
    pixel_map = apply_decay(pixel_map, decay_chance=0.05)

    # Convert pixel map to rects
    rects = []

    # Optimization: Group horizontal runs
    for y in range(height):
        current_color = None
        run_start = -1

        for x in range(width):
            color = pixel_map.get((x,y))

            if color != current_color:
                if current_color is not None:
                    # End run
                    w = x - run_start
                    rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')

                current_color = color
                run_start = x

        # End row
        if current_color is not None:
            w = width - run_start
            rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')

    svg_content = f'''<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    {''.join(rects)}
</svg>'''

    output_dir = "assets/sprites/items"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "breath_of_creator.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
