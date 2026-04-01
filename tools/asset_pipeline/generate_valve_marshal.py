import os

def generate_svg():
    width = 32
    height = 32

    # GLOOM_PALETTE
    PALETTE = {
        "Void": "#050505",
        "DeepShadow": "#0f140f",
        "RustedIron": "#3c281e", # (60, 40, 30)
        "Rust": "#503228",       # (80, 50, 40)
        "Clay": "#644632",       # (100, 70, 50) - Dull Brass Base
        "OldWood": "#785a46",    # (120, 90, 70) - Lighter Brass
        "PaleBone": "#c8c8be",   # Highlight
    }

    rects = []
    pixel_map = {} # (x,y) -> color

    cx, cy = 16, 16
    outer_radius = 14
    inner_radius = 11
    hub_radius = 4

    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = (dx*dx + dy*dy)**0.5

            # 1. The Wheel Rim (Torus)
            if inner_radius <= dist <= outer_radius:
                # Base Metal
                pixel_map[(x,y)] = PALETTE["OldWood"]

                # Shadow on bottom-right (Perspective)
                if dx + dy > 4:
                    pixel_map[(x,y)] = PALETTE["Clay"]

                # Deep Shadow underneath
                if y > cy + 10:
                    pixel_map[(x,y)] = PALETTE["RustedIron"]

                # Highlight top-left
                if dx + dy < -15:
                    pixel_map[(x,y)] = PALETTE["PaleBone"]

                # Rust spots (Deterministic "noise")
                if (x * y * 7) % 19 < 4:
                     pixel_map[(x,y)] = PALETTE["Rust"]

            # 2. The Spokes (Cross)
            # 4 spokes: Horizontal and Vertical
            # Thickness 4px (approx)
            elif dist < inner_radius and dist > hub_radius:
                is_spoke = False
                # Vertical Spoke
                if abs(dx) <= 2:
                    is_spoke = True
                # Horizontal Spoke
                if abs(dy) <= 2:
                    is_spoke = True

                if is_spoke:
                    pixel_map[(x,y)] = PALETTE["Clay"]
                    # Shading
                    if x > cx or y > cy:
                         pixel_map[(x,y)] = PALETTE["RustedIron"]
                    # Rust
                    if (x + y) % 5 == 0:
                        pixel_map[(x,y)] = PALETTE["Rust"]

            # 3. Central Hub
            elif dist <= hub_radius:
                pixel_map[(x,y)] = PALETTE["OldWood"]
                # Hex nut shape hint
                if abs(dx) + abs(dy) < 5:
                     pixel_map[(x,y)] = PALETTE["Clay"]
                # Center indent
                if dist < 2:
                    pixel_map[(x,y)] = PALETTE["DeepShadow"]

    # Convert pixel map to rects
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
    output_path = os.path.join(output_dir, "valve_marshal.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
