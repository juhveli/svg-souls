import os
import random
import math
import blight_filter

def generate_svg():
    width = 32
    height = 32

    # GLOOM_PALETTE subsets for "Molten Sand"
    PALETTE = {
        "Void": "#050505",
        "Rust": "#503228",      # (80, 50, 40)
        "Clay": "#644632",      # (100, 70, 50)
        "OldWood": "#785a46",   # (120, 90, 70)
        "OldBone": "#a0a096",   # (160, 160, 150)
        "PaleBone": "#c8c8be"   # (200, 200, 190)
    }

    pixel_map = {}

    # Center of mass for the breath cloud
    cx, cy = 16, 16

    # Generate a few "lobes" or bubbles for the breath
    lobes = [
        # (x, y, radius, color_key)
        (16, 16, 6.0, "Clay"),
        (12, 14, 4.0, "Clay"),
        (20, 18, 4.0, "Clay"),
        (16, 10, 3.5, "OldWood"),
        (16, 22, 3.5, "OldWood"),
        (10, 18, 3.0, "OldWood"),
        (22, 14, 3.0, "OldWood"),
    ]

    # Fill base shape
    for y in range(height):
        for x in range(width):
            # Check if inside any lobe
            inside_any = False
            color = None

            # Prioritize "hotter" colors (Clay) over Cooler (OldWood) if overlapping?
            # Actually, let's just draw them.

            min_dist_normalized = float('inf')

            for lx, ly, lr, lcolor in lobes:
                dx = x - lx
                dy = y - ly
                dist = math.sqrt(dx*dx + dy*dy)

                if dist <= lr:
                    inside_any = True
                    # Simple layering: later lobes overwrite earlier ones?
                    # Or maybe distance based.
                    # Let's use the color of the lobe we are "deepest" in or just the one we are in.
                    color = PALETTE[lcolor]

            if inside_any:
                pixel_map[(x,y)] = color

    # Add a core "hot" spot (Rust) inside the Clay areas
    for y in range(height):
        for x in range(width):
            if pixel_map.get((x,y)) == PALETTE["Clay"]:
                # Distance from center
                dx = x - cx
                dy = y - cy
                dist = math.sqrt(dx*dx + dy*dy)
                if dist < 3.5:
                     pixel_map[(x,y)] = PALETTE["Rust"]

    # Add "Crystallized" highlights (PaleBone / OldBone)
    # Highlight top-left of the lobes
    for lx, ly, lr, lcolor in lobes:
        # Highlight spot roughly at top-left
        hx = int(lx - lr * 0.4)
        hy = int(ly - lr * 0.4)

        if (hx, hy) in pixel_map:
             pixel_map[(hx, hy)] = PALETTE["PaleBone"]
        if (hx+1, hy) in pixel_map:
             pixel_map[(hx+1, hy)] = PALETTE["PaleBone"]
        if (hx, hy+1) in pixel_map:
             pixel_map[(hx, hy+1)] = PALETTE["OldBone"]


    # Apply Blight Filter (Decay)
    pixel_map = blight_filter.apply_decay(pixel_map, decay_chance=0.05)

    # Convert to Rects
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
