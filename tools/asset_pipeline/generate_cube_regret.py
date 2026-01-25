import os
import random

def generate_svg():
    width = 32
    height = 32

    # GLOOM_PALETTE (Hex approximations based on palette.py)
    PALETTE = {
        "Void": "#050505",       # 0
        "DeepShadow": "#0f140f", # 1
        "SwampGreen": "#192319", # 2
        "DarkMoss": "#283228",   # 3
        "RustedIron": "#3c281e", # 4
        "Rust": "#503228",       # 5
        "Clay": "#644632",       # 6
        "OldWood": "#785a46",    # 7
        "ColdStone": "#64646e",  # 8
        "Grey": "#828282",       # 9
        "OldBone": "#a0a096",    # 10
        "PaleBone": "#c8c8be",   # 11
        "BloodDry": "#320a0a",   # 12
        "BloodFresh": "#781414", # 13
        "MagicDark": "#0a1e32",  # 14
        "MagicBright": "#3296c8" # 15
    }

    rects = []
    pixel_map = {}

    # Isometric Cube Logic
    # Center (16, 16)
    # Size roughly 14 wide, 14 high (total)

    # Top Face: Diamond
    # Center (16, 10)
    # Width 14 -> +/- 7
    # Height 7 -> +/- 3.5 (approx 4 steps)

    # Side Faces:
    # Left Face: x < 16, y > top_edge
    # Right Face: x >= 16, y > top_edge

    # Cube Dimensions (in pixels)
    cube_size = 12 # Half-width
    cube_height = 14 # Height of vertical sides

    cx, cy = 16, 24 # Bottom center anchor

    # Simple iso projection check
    # Top face center: (16, 10)

    junk_colors = [
        PALETTE["RustedIron"], PALETTE["RustedIron"], PALETTE["RustedIron"],
        PALETTE["Rust"], PALETTE["Rust"],
        PALETTE["Grey"],
        PALETTE["Clay"],
        PALETTE["OldWood"],
        PALETTE["OldBone"],
        PALETTE["DeepShadow"]
    ]

    random.seed(404) # Seed for reproducibility (404 Not Found - fitting for Glitch/Void/Regret)

    for y in range(height):
        for x in range(width):
            # Isometric Cube Bounds

            # 1. Determine which face we are on (or background)

            # Transform to relative coordinates from center of top face
            # Top Face Center approx (16, 10)
            tx, ty = x - 16, y - 10

            # Top Face (Diamond)
            # abs(tx)/width + abs(ty)/height <= 1
            # width=14, height=7 (approx)
            in_top = (abs(tx) * 1 + abs(ty) * 2) <= 14

            # Left Face
            # x < 16
            # y between top_edge(x) and bottom_edge(x)
            # top_edge(x): y = 10 + (16-x)*0.5
            # bottom_edge(x): y = top_edge + 12 (cube height)

            # Right Face
            # x >= 16
            # top_edge(x): y = 10 + (x-16)*0.5

            color = None

            # Calculations for faces
            slope = 0.5
            dx = x - 16

            top_y_center = 10

            # Top edge of the cube (diamond upper/lower bounds)
            # The "ridge" y at x is: top_y_center + abs(dx)*slope
            # But that's the bottom of the top face.
            # The top of the top face is: top_y_center - abs(dx)*slope

            # Actually, standard iso tile:
            # Center (16, 10)
            # Diamond: |dx|/2 + |dy| <= 7 (approx) -> |dx| + 2|dy| <= 14

            dy_top = y - top_y_center

            is_top_face = (abs(dx) + 2 * abs(dy_top)) <= 14

            # Vertical extents
            # Vertical height of cube = 12

            # Bottom of top face (the "spine"): y = 10 + abs(dx)/2
            spine_y = top_y_center + abs(dx) // 2

            is_side_face = False
            if not is_top_face:
                if y > spine_y and y <= (spine_y + 12):
                     if abs(dx) <= 14: # Width constaint
                         is_side_face = True

            if is_top_face:
                # Top Face: Lighter junk
                base_c = random.choice(junk_colors)
                # Apply slight lighting (lighter)
                if base_c == PALETTE["RustedIron"]: base_c = PALETTE["Rust"]
                elif base_c == PALETTE["Rust"]: base_c = PALETTE["Clay"]
                elif base_c == PALETTE["DeepShadow"]: base_c = PALETTE["RustedIron"]
                color = base_c

                # Add highlights
                if random.random() > 0.9: color = PALETTE["Grey"]

            elif is_side_face:
                if dx < 0:
                    # Left Face (Darker)
                    base_c = random.choice(junk_colors)
                    # Apply shadow
                    if base_c == PALETTE["Grey"]: base_c = PALETTE["ColdStone"]
                    elif base_c == PALETTE["Rust"]: base_c = PALETTE["RustedIron"]
                    elif base_c == PALETTE["RustedIron"]: base_c = PALETTE["DeepShadow"]
                    elif base_c == PALETTE["Clay"]: base_c = PALETTE["RustedIron"]
                    color = base_c
                else:
                    # Right Face (Mid-tone / Shadow)
                    # Slightly darker than top, lighter than left?
                    # Usually Right is Shadow in standard pixel art, Left is Mid.
                    # Let's make Right dark (Shadow), Left mid.

                    # Wait, Cinder rule: "Light hit from top-left?"
                    # If light from top-left:
                    # Top: Brightest
                    # Left: Mid
                    # Right: Darkest

                    base_c = random.choice(junk_colors)
                     # Apply shadow (Deep)
                    if base_c == PALETTE["Grey"]: base_c = PALETTE["ColdStone"]
                    elif base_c == PALETTE["Rust"]: base_c = PALETTE["RustedIron"]
                    elif base_c == PALETTE["RustedIron"]: base_c = PALETTE["DeepShadow"]
                    elif base_c == PALETTE["Clay"]: base_c = PALETTE["RustedIron"]

                    # Make it even darker for Right face
                    if random.random() > 0.5:
                        color = PALETTE["DeepShadow"]
                    else:
                        color = base_c

            # Outline / Cleanup
            # If this pixel is colored, check neighbors to see if it's an edge
            # (Post-processing step usually, but we can do simple logic here)

            if color:
                pixel_map[(x,y)] = color

    # Add Outline (Void)
    outline_pixels = set()
    for (x,y), c in pixel_map.items():
        for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]:
            if (nx, ny) not in pixel_map:
                outline_pixels.add((nx,ny))

    for px, py in outline_pixels:
        if 0 <= px < width and 0 <= py < height:
             pixel_map[(px,py)] = PALETTE["Void"]

    # Generate Rects
    for y in range(height):
        current_color = None
        run_start = -1
        for x in range(width):
            c = pixel_map.get((x,y))
            if c != current_color:
                if current_color:
                    w = x - run_start
                    rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')
                current_color = c
                run_start = x
        if current_color:
            w = width - run_start
            rects.append(f'<rect x="{run_start}" y="{y}" width="{w}" height="1" fill="{current_color}" />')

    svg_content = f'''<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    {''.join(rects)}
</svg>'''

    output_dir = "assets/sprites/items"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "cube_regret.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
