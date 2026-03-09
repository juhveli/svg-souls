import json
import os
import math
from PIL import Image

def rebuild_atlas(atlas_json_path, atlas_img_path, sprite_dirs):
    print("Rebuilding sprite atlas...")

    # Collect all sprites
    sprites = []

    # We will also keep existing data if we want, but it's safer to rebuild if we have the source.
    # However, we don't have all source PNGs for the enemies in assets/sprites yet, they might be generated or just placeholders.
    # Let's read the existing atlas, append new ones, and rebuild the image.

    existing_data = {}
    if os.path.exists(atlas_json_path):
        with open(atlas_json_path, 'r') as f:
            existing_data = json.load(f)

    # Load existing atlas image to copy over
    old_img = None
    if os.path.exists(atlas_img_path):
         old_img = Image.open(atlas_img_path).convert("RGBA")

    # We'll just create a new larger atlas, say 1024x1024
    ATLAS_SIZE = 1024
    new_img = Image.new("RGBA", (ATLAS_SIZE, ATLAS_SIZE))

    new_data = {}

    current_x = 0
    current_y = 0
    max_row_height = 0

    # If we have the old image, we can just copy existing entries
    if old_img:
        for name, data in existing_data.items():
            w = data['width']
            h = data['height']

            # calculate pixel coords from u,v
            # The previous python script might have used a different size. Let's assume old img size.
            old_w, old_h = old_img.size
            px0 = int(data['u0'] * old_w)
            py0 = int(data['v0'] * old_h)
            px1 = int(data['u1'] * old_w)
            py1 = int(data['v1'] * old_h)

            # Ensure safe bounds
            px0, py0 = max(0, px0), max(0, py0)
            px1, py1 = min(old_w, px1), min(old_h, py1)

            # Crop region
            region = old_img.crop((px0, py0, px1, py1))

            # Pack
            if current_x + w > ATLAS_SIZE:
                current_x = 0
                current_y += max_row_height + 2 # Add 2px padding
                max_row_height = 0

            if current_y + h > ATLAS_SIZE:
                 print("ERROR: Atlas full!")
                 break

            new_img.paste(region, (current_x, current_y))

            new_data[name] = {
                "index": len(new_data),
                "u0": current_x / ATLAS_SIZE,
                "v0": current_y / ATLAS_SIZE,
                "u1": (current_x + w) / ATLAS_SIZE,
                "v1": (current_y + h) / ATLAS_SIZE,
                "width": w,
                "height": h
            }

            current_x += w + 2
            max_row_height = max(max_row_height, h)

    # Add new sprites
    for d in sprite_dirs:
        if not os.path.exists(d): continue
        for filename in os.listdir(d):
            if filename.endswith(".png"):
                name = os.path.splitext(filename)[0]
                if name in new_data: continue # Skip if already in

                path = os.path.join(d, filename)
                img = Image.open(path).convert("RGBA")
                w, h = img.size

                if current_x + w > ATLAS_SIZE:
                    current_x = 0
                    current_y += max_row_height + 2
                    max_row_height = 0

                if current_y + h > ATLAS_SIZE:
                     print("ERROR: Atlas full while packing new sprites!")
                     break

                new_img.paste(img, (current_x, current_y))

                new_data[name] = {
                    "index": len(new_data),
                    "u0": current_x / ATLAS_SIZE,
                    "v0": current_y / ATLAS_SIZE,
                    "u1": (current_x + w) / ATLAS_SIZE,
                    "v1": (current_y + h) / ATLAS_SIZE,
                    "width": w,
                    "height": h
                }

                current_x += w + 2
                max_row_height = max(max_row_height, h)
                print(f"Added {name} to atlas.")

    new_img.save(atlas_img_path)
    with open(atlas_json_path, 'w') as f:
         json.dump(new_data, f, indent=2)

    print(f"Atlas rebuilt with {len(new_data)} textures.")

if __name__ == "__main__":
    rebuild_atlas(
        "public/assets/sprite_atlas.json",
        "public/assets/sprite_atlas.png",
        ["assets/sprites/isometric"]
    )
