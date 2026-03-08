import os
import sys
import urllib.request
import zipfile
from PIL import Image, ImageDraw
import blight_filter
from palette import GLOOM_PALETTE, get_nearest_color

def main():
    print("--- Isometric Asset Pipeline Initialization ---")

    # 1. Paths
    raw_dir = "assets/sprites/raw"
    processed_dir = "assets/sprites/isometric"
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    # 2. Download raw assets (Kenney Isometric Dungeon Pack - CC0)
    zip_url = "https://kenney.nl/content/3-assets/111-isometric-dungeon-tiles/isometric-dungeon-tiles.zip"
    zip_path = os.path.join(raw_dir, "isometric_dungeon.zip")
    extract_path = os.path.join(raw_dir, "isometric_dungeon")

    print(f"Downloading assets from {zip_url}...")
    try:
        req = urllib.request.Request(zip_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            out_file.write(response.read())

        print("Extracting assets...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        target_tile = os.path.join(extract_path, "Isometric Dungeon Tiles", "PNG", "Default size", "tile_half.png")
        if not os.path.exists(target_tile):
            target_tile = None
    except Exception as e:
        print(f"Failed to download/extract from Kenney.nl: {e}")
        print("Fallback: Using simple programmatic placeholder generation for tiles.")
        target_tile = None

    # 3. Process the asset (Blight Filter)
    floor_out = os.path.join(processed_dir, "floor_tile_placeholder.png")

    if target_tile and os.path.exists(target_tile):
        print(f"Applying Blight Filter to {target_tile}...")
        img = Image.open(target_tile).convert("RGBA")

        aspect = img.height / img.width
        img = img.resize((64, int(64 * aspect)), Image.Resampling.NEAREST)

        pixels = img.load()
        import random
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, a = pixels[x, y]
                if a > 0:
                    gray = int(r * 0.3 + g * 0.59 + b * 0.11)

                    if gray < 80:
                        c = GLOOM_PALETTE[0] # Void
                    elif gray < 160:
                        c = GLOOM_PALETTE[1] # Deep Shadow
                    else:
                        c = GLOOM_PALETTE[8] # Cold Stone

                    if random.random() < 0.1:
                        c = GLOOM_PALETTE[5] # Rust
                    elif random.random() < 0.05:
                        c = GLOOM_PALETTE[12] # Blood Dry

                    pixels[x, y] = (c[0], c[1], c[2], a)

        img.save(floor_out)
        print(f"Saved processed tile to {floor_out}")

    else:
        print("Generating programmatic fallback tile...")
        img = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)

        diamond = [(32, 0), (64, 16), (32, 32), (0, 16)]

        base_color = GLOOM_PALETTE[8] # Cold Stone
        d.polygon(diamond, fill=base_color + (255,))

        pixels = img.load()
        import random
        for y in range(32):
            for x in range(64):
                if pixels[x, y][3] > 0:
                    if random.random() < 0.1:
                        c = GLOOM_PALETTE[5] # Rust
                        pixels[x, y] = (c[0], c[1], c[2], 255)
                    elif random.random() < 0.05:
                        pixels[x, y] = (0, 0, 0, 0) # Decay hole

        img.save(floor_out)
        print(f"Saved fallback tile to {floor_out}")

    char_out = os.path.join(processed_dir, "character_placeholder.png")
    print("Generating programmatic character placeholder...")
    img = Image.new("RGBA", (32, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    c_color = GLOOM_PALETTE[15] # Magic Bright
    d.ellipse([(8, 48), (24, 60)], fill=c_color+(255,))
    d.rectangle([(8, 16), (24, 54)], fill=c_color+(255,))
    d.ellipse([(8, 10), (24, 22)], fill=c_color+(255,))

    img.save(char_out)
    print(f"Saved character placeholder to {char_out}")

    print("\n--- NEXT STEPS FOR ASSET DEVELOPMENT ---")
    print("TODO: Use assets from https://opengameart.org/content/isometric-rpg for further development for the real assets.")
    print("TODO: Expand this script to parse a spritesheet JSON and apply specific filters (like Verdigris for Glass Gardens).")
    print("TODO: Run `python tools/asset_pipeline/build_atlas.py` to pack the new assets.")

if __name__ == "__main__":
    main()
