import os
import glob
from PIL import Image
import json

def build_atlas(in_dirs, out_image, out_json):
    # Find all PNGs
    images = []
    for d in in_dirs:
        for f in glob.glob(os.path.join(d, "*.png")):
            images.append(f)

    # Sort for deterministic output
    images.sort()

    # Simple packing logic (assume 16x16 or 32x32 max)
    # To keep it simple, let's just make a grid of 16x16 slots. If an image is larger, it will be cropped or scaled,
    # but based on our generation, they are mostly 16x16 or 18x18. Let's use 32x32 slots to be safe.
    slot_size = 32
    columns = 16

    # Calculate required rows
    rows = (len(images) + columns - 1) // columns

    atlas_width = columns * slot_size
    atlas_height = max(32, rows * slot_size)

    atlas = Image.new("RGBA", (atlas_width, atlas_height), (0, 0, 0, 0))

    uv_data = {}

    for i, path in enumerate(images):
        col = i % columns
        row = i // columns

        x = col * slot_size
        y = row * slot_size

        img = Image.open(path).convert("RGBA")

        # Center in slot
        cx = x + (slot_size - img.width) // 2
        cy = y + (slot_size - img.height) // 2

        atlas.paste(img, (cx, cy))

        # Name is filename without extension
        name = os.path.basename(path).replace(".png", "")

        # Calculate UVs (normalized 0.0 to 1.0)
        u0 = cx / atlas_width
        v0 = cy / atlas_height
        u1 = (cx + img.width) / atlas_width
        v1 = (cy + img.height) / atlas_height

        # We assign an index to each texture name so the GPU can look it up in an array or we just pass UV offsets directly.
        # Passing UV offsets directly via instance buffer is easiest.
        uv_data[name] = {
            "index": i, # Optional, if using texture arrays
            "u0": u0,
            "v0": v0,
            "u1": u1,
            "v1": v1,
            "width": img.width,
            "height": img.height
        }

    atlas.save(out_image)
    print(f"Saved Atlas: {out_image} ({atlas_width}x{atlas_height})")

    with open(out_json, "w") as f:
        json.dump(uv_data, f, indent=2)
    print(f"Saved UV Data: {out_json}")

if __name__ == "__main__":
    os.makedirs("public/assets", exist_ok=True)
    build_atlas(
        ["assets/sprites/items", "assets/sprites/entities"],
        "public/assets/sprite_atlas.png",
        "public/assets/sprite_atlas.json"
    )
