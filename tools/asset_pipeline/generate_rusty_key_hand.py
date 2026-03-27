import os
import random
from blight_filter import apply_decay

def generate_svg():
    width = 32
    height = 32

    # Gloom Palette Hex Codes
    PALETTE = {
        "Void": "#050505",
        "DeepShadow": "#0f140f",
        "RustedIron": "#3c281e",
        "Rust": "#503228",
        "OldBone": "#a0a096",
        "Clay": "#644632", # 100, 70, 50
        "BloodDry": "#320a0a" # 50, 10, 10
    }

    pixel_map = {} # (x,y) -> hex_color

    # Draw the Key-Hand
    # Logic:
    # - Wrist/Forearm is the "Bow" (Handle) of the key.
    # - The Hand is the "Shoulder".
    # - The Fingers are fused to form the "Bit" (Teeth).

    # 1. The Bow (Severed Wrist/Forearm bone)
    # Location: Left side (x: 4-12, y: 14-18)
    # Shape: Cylinder with ragged end

    for x in range(4, 14):
        for y in range(14, 19):
            pixel_map[(x,y)] = PALETTE["OldBone"]

            # Shading on bottom
            if y == 18:
                pixel_map[(x,y)] = PALETTE["DeepShadow"]
            elif y == 17:
                pixel_map[(x,y)] = PALETTE["RustedIron"] # Shadow/Dirt

    # Ragged bone end (Left)
    for y in range(14, 19):
        if y % 2 == 0:
            pixel_map[(3,y)] = PALETTE["BloodDry"] # Marrow/Dried Blood

    # 2. The Shoulder (Mechanical Palm/Knuckles)
    # Location: Center (x: 14-20, y: 12-20)
    # Shape: Blocky, rusted metal

    for x in range(14, 21):
        for y in range(12, 21):
            pixel_map[(x,y)] = PALETTE["RustedIron"]

            # Highlight/Rust patches
            if (x + y) % 3 == 0:
                pixel_map[(x,y)] = PALETTE["Rust"]

            # Outline/Shadow
            if y == 20 or y == 12:
                 pixel_map[(x,y)] = PALETTE["DeepShadow"]

    # 3. The Bit (Fused Fingers)
    # Location: Right side (x: 21-28)
    # Shape: Extended fingers forming key teeth

    # Finger 1 (Top)
    for x in range(21, 28):
        pixel_map[(x, 13)] = PALETTE["OldBone"]
        pixel_map[(x, 14)] = PALETTE["RustedIron"]

    # Finger 2 (Middle - Recessed bit)
    for x in range(21, 25): # Shorter
        pixel_map[(x, 16)] = PALETTE["OldBone"]
        pixel_map[(x, 17)] = PALETTE["RustedIron"]

    # Finger 3 (Bottom)
    for x in range(21, 28):
        pixel_map[(x, 19)] = PALETTE["OldBone"]
        pixel_map[(x, 20)] = PALETTE["RustedIron"]

    # 4. Decay & Grit
    pixel_map = apply_decay(pixel_map, decay_chance=0.05)

    # Convert pixel map to rects
    rects = []

    # Background (optional, usually transparent for items, but let's check)
    # Existing generated items seem to not have a bg rect.

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
    output_path = os.path.join(output_dir, "rusty_key_hand.svg")

    with open(output_path, "w") as f:
        f.write(svg_content)

    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_svg()
