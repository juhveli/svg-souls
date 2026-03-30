import os
import sys
import math
import random

# Ensure we can import from the same directory
sys.path.append(os.path.dirname(__file__))

from palette import GLOOM_PALETTE
from blight_filter import apply_decay

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def generate_svg():
    width = 32
    height = 32

    # Map Palette
    c_core = rgb_to_hex(GLOOM_PALETTE[5])    # Rust (Warm core)
    c_body = rgb_to_hex(GLOOM_PALETTE[15])   # Magic Bright (Glass/Breath)
    c_highlight = rgb_to_hex(GLOOM_PALETTE[11]) # Pale Bone (Crystal highlight)
    c_shadow = rgb_to_hex(GLOOM_PALETTE[1])  # Deep Shadow (Depth)
    c_void = rgb_to_hex(GLOOM_PALETTE[0])    # Void (Outline/Contrast)

    pixel_map = {}

    # Blob centers for the swirling cloud
    blobs = [
        {'x': 16, 'y': 16, 'r': 8},
        {'x': 12, 'y': 14, 'r': 5},
        {'x': 20, 'y': 18, 'r': 5},
        {'x': 18, 'y': 12, 'r': 4},
    ]

    for y in range(height):
        for x in range(width):
            # Distance to nearest blob surface
            min_dist = float('inf')

            # Add some noise to coordinates for jaggedness (crystallization)
            nx = x + random.uniform(-0.5, 0.5)
            ny = y + random.uniform(-0.5, 0.5)

            for blob in blobs:
                dist = math.sqrt((nx - blob['x'])**2 + (ny - blob['y'])**2)
                surface_dist = dist - blob['r']
                if surface_dist < min_dist:
                    min_dist = surface_dist

            # Render logic based on distance
            if min_dist < 0: # Inside the composite shape

                # Core logic: Deep inside
                if min_dist < -3:
                    pixel_map[(x, y)] = c_core
                else:
                    pixel_map[(x, y)] = c_body

                # Highlights (Top-Left rule)
                # If we are near the edge AND normal points top-left?
                # Simplified: if we are at the top-left of a pixel block (check neighbors later?)
                # Or just use noise/probability near the "top" of the blobs.

                # Simple lighting:
                # Calculate angle to center (16,16)
                angle = math.atan2(y - 16, x - 16)
                # Top-Left is approx -3pi/4 (-2.35)
                # But individual blobs might override.

                # Let's just sprinkle highlights on the "upper" and "left" parts of the mass
                # If pixel is body color
                if pixel_map.get((x,y)) == c_body:
                     # Check if pixel above or left is empty (outline)
                     # Can't do that easily in one pass without 2 passes.
                     # Heuristic: if x+y is small relative to center?
                     pass

    # Pass 2: Highlights and Outlines
    # We copy the map to avoid modifying while reading (or just be careful)
    # Actually, let's just do a cellular-automata style pass or just iterate

    current_pixels = list(pixel_map.keys())
    for (x,y) in current_pixels:
        color = pixel_map[(x,y)]

        # Highlight Logic: Top-Left edges
        if color == c_body:
            # If top or left is empty, it's an edge facing light
            if (x-1, y) not in pixel_map or (x, y-1) not in pixel_map:
                pixel_map[(x,y)] = c_highlight
            # Also random internal crystallization highlights
            elif random.random() < 0.1:
                pixel_map[(x,y)] = c_highlight

        # Outline logic (optional, Cinder journal mentioned outlines)
        # "The agent tends to forget the 1-pixel black outline"
        # Let's add void pixels AROUND the shape if they are empty

    # Add outlines
    outline_pixels = {}
    for (x,y) in pixel_map:
        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = x+dx, y+dy
            if (nx, ny) not in pixel_map:
                # It's an empty neighbor
                if 0 <= nx < width and 0 <= ny < height:
                    outline_pixels[(nx, ny)] = c_void

    # Merge outlines
    pixel_map.update(outline_pixels)

    # Apply Blight/Decay
    pixel_map = apply_decay(pixel_map, decay_chance=0.05)

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

    output_dir = "assets/sprites/items"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "breath_of_creator.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
