import os
import sys

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
    # 0: Void, 1: Deep Shadow, 10: Old Bone, 11: Pale Bone
    c_void = rgb_to_hex(GLOOM_PALETTE[0])
    c_shadow = rgb_to_hex(GLOOM_PALETTE[1])
    c_bone = rgb_to_hex(GLOOM_PALETTE[10])
    c_pale_bone = rgb_to_hex(GLOOM_PALETTE[11])

    pixel_map = {}

    # Draw Quill
    # Diagonal from top-right to bottom-left

    # Spine (Stem)
    length_spine = 20
    start_x = 24
    start_y = 6

    for i in range(length_spine):
        x = start_x - i
        y = start_y + i
        if 0 <= x < width and 0 <= y < height:
            pixel_map[(x, y)] = c_pale_bone
            if x-1 >= 0:
                pixel_map[(x-1, y)] = c_bone

    # Feather Barbs
    # Growing out from spine to the left (mostly)
    for i in range(2, length_spine - 4): # Leave handle free at bottom
        spine_x = start_x - i
        spine_y = start_y + i

        # Barb length varies
        barb_len = 5 + (i % 3)
        if i < 5: barb_len -= 2 # Taper top

        for j in range(1, barb_len):
            bx = spine_x - j - 1
            by = spine_y
            # Angle barbs slightly up? No, keep simple horizontal for pixel grid readability
            if 0 <= bx < width:
                pixel_map[(bx, by)] = c_bone

    # Ink Tip (The very bottom of the quill)
    # The quill is a pen, so the tip is the writing point.
    # The bottom of the spine.
    tip_start = length_spine - 5
    for i in range(tip_start, length_spine):
        x = start_x - i
        y = start_y + i

        # Overwrite with ink colors
        if (x, y) in pixel_map:
            pixel_map[(x, y)] = c_void
        if (x-1, y) in pixel_map:
            pixel_map[(x-1, y)] = c_shadow

    # Apply Blight/Decay
    pixel_map = apply_decay(pixel_map, decay_chance=0.08)

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
    output_path = os.path.join(output_dir, "quill_archivist.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
