import os
import sys
import random

# Ensure we can import blight_filter
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from blight_filter import apply_decay
except ImportError:
    # Fallback if running from a different context
    print("Warning: Could not import blight_filter. Using local fallback.")
    def apply_decay(pixel_map, decay_chance=0.05):
        keys = list(pixel_map.keys())
        for pos in keys:
            if random.random() < decay_chance:
                del pixel_map[pos]
        return pixel_map

def add_outline(pixel_map, outline_color, width=32, height=32):
    """
    Adds a 1-pixel outline around the existing pixels.
    """
    new_pixels = {}
    current_keys = set(pixel_map.keys())

    # Directions: Up, Down, Left, Right
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

    for (x, y) in current_keys:
        # Check neighbors
        for dx, dy in directions:
            nx, ny = x + dx, y + dy

            # Bounds check
            if 0 <= nx < width and 0 <= ny < height:
                # If neighbor is empty, it's an edge
                if (nx, ny) not in current_keys:
                     new_pixels[(nx, ny)] = outline_color

    # Merge new pixels
    pixel_map.update(new_pixels)
    return pixel_map

def generate_svg():
    width = 32
    height = 32

    # Palette (Brass & Rust)
    # Brass: Gold/Yellow-ish
    # Rust: Red/Brown-ish
    PALETTE = {
        "BrassLight": "#d4b483", # Pale Gold
        "BrassMid": "#c7913d",   # Gold/Bronze
        "BrassDark": "#8a6125",  # Dark Bronze
        "Rust": "#8b3a1a",       # Reddish Brown
        "RustDark": "#4a2c1d",   # Dark Brown
        "Void": "#050505"        # Near Black (Outline/Shadow)
    }

    pixel_map = {} # (x,y) -> color

    cx, cy = 16, 16

    # 1. Base Shape Generation
    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = (dx*dx + dy*dy)**0.5

            # Outer Ring (Valve Handle)
            if 12.0 <= dist <= 14.0:
                # Top-left lighting highlight
                if dx < 0 and dy < 0:
                     pixel_map[(x,y)] = PALETTE["BrassLight"]
                elif dx > 0 and dy > 0:
                     pixel_map[(x,y)] = PALETTE["BrassDark"]
                else:
                     pixel_map[(x,y)] = PALETTE["BrassMid"]

            # Spokes (4 cardinal directions, slightly thick)
            elif (abs(dx) <= 1.5 and dist < 12) or (abs(dy) <= 1.5 and dist < 12):
                 # Top/Left highlight on spokes
                 if (abs(dx) <= 1.5 and x < cx) or (abs(dy) <= 1.5 and y < cy):
                      pixel_map[(x,y)] = PALETTE["BrassMid"]
                 else:
                      pixel_map[(x,y)] = PALETTE["BrassDark"]

            # Central Hub
            elif dist <= 4.0:
                pixel_map[(x,y)] = PALETTE["BrassDark"]

    # 2. Detail Pass: Rust & Corrosion
    # "Rusted shut" -> Heavy rust at the center (hub) and joints
    keys = list(pixel_map.keys())
    for (x,y) in keys:
        dx = x - cx
        dy = y - cy
        dist = (dx*dx + dy*dy)**0.5

        # Heavy rust at center
        if dist <= 5.0:
            if random.random() < 0.7:
                 pixel_map[(x,y)] = PALETTE["RustDark"]
            elif random.random() < 0.9:
                 pixel_map[(x,y)] = PALETTE["Rust"]

        # Scattered rust on the ring
        elif dist >= 12.0:
            if random.random() < 0.15:
                pixel_map[(x,y)] = PALETTE["Rust"]
            elif random.random() < 0.05:
                pixel_map[(x,y)] = PALETTE["RustDark"]

        # Rust on spokes
        else:
            if random.random() < 0.3:
                pixel_map[(x,y)] = PALETTE["Rust"]

    # 3. Apply Blight/Decay (The Grit)
    pixel_map = apply_decay(pixel_map, decay_chance=0.08)

    # 4. Apply Outline (The Contrast)
    pixel_map = add_outline(pixel_map, PALETTE["Void"])

    # 5. Convert to Rects (Greedy Meshing)
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

        # End row
        if current_color is not None:
            w = width - run_start
            rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')

    svg_content = f'''<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    {''.join(rects)}
</svg>'''

    output_dir = "assets/sprites/items"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "valve_marshal.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
