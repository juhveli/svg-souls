import os

def generate_svg():
    width = 32
    height = 32

    # Palette Hex Codes (matching palette.py roughly)
    # Magic Bright: #3296c8 (50, 150, 200)
    # Magic Dark: #0a1e32 (10, 30, 50)
    # Cold Stone: #64646e (100, 100, 110)
    # Void: #050505 (5, 5, 5)

    PALETTE = {
        "MagicBright": "#3296c8",
        "MagicDark": "#0a1e32",
        "ColdStone": "#64646e",
        "Void": "#050505",
        "DeepShadow": "#0f140f"
    }

    rects = []

    # 1. Background (Void)
    # rects.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="{PALETTE["Void"]}" />')

    # 2. The Lens Frame (Cold Stone)
    # Circle approximation using rects
    # Center 16, 16. Radius ~12

    # Frame Outer
    frame_pixels = [
        (12, 4, 8, 2), (10, 6, 12, 2), (8, 8, 16, 16), (10, 24, 12, 2), (12, 26, 8, 2)
    ]
    # Simplify: Just drawing a pixel art eye/lens

    pixel_map = {} # (x,y) -> color

    cx, cy = 16, 16
    radius = 12

    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = (dx*dx + dy*dy)**0.5

            # Frame
            if 10.0 <= dist <= 12.0:
                pixel_map[(x,y)] = PALETTE["ColdStone"]

            # Inner Void/Glass
            elif dist < 10.0:
                # Gradient-ish
                if dist < 4.0:
                    pixel_map[(x,y)] = PALETTE["MagicBright"] # Pupil/Core
                else:
                    pixel_map[(x,y)] = PALETTE["MagicDark"] # Iris/Glass

            # Tendrils/Spikes (Magic Bright tips)
            # 4 cardinal directions
            if (abs(dx) < 2 and abs(dy) > 12 and abs(dy) < 15) or \
               (abs(dy) < 2 and abs(dx) > 12 and abs(dx) < 15):
                pixel_map[(x,y)] = PALETTE["MagicBright"]

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
    output_path = os.path.join(output_dir, "gatekeeper_lens.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
