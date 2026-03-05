import os
from PIL import Image, ImageDraw

out_dir = "assets/sprites/entities"
os.makedirs(out_dir, exist_ok=True)

# Generate a 16x16 placeholder block for each missing entity.
# We will use distinct colors to easily identify them.
entities = {
    "player": (100, 200, 255),
    "enemy_serumbot": (200, 100, 50),
    "enemy_crab": (255, 100, 100),
    "enemy_dancer": (255, 255, 255),
    "enemy_mite": (100, 50, 0),
    "enemy_dragon": (150, 50, 50),
    "enemy_wraith": (150, 150, 255),
    "enemy_vine": (50, 200, 50),
    "boss_vitria": (200, 255, 255),
    "enemy_gearkeeper": (200, 150, 50),
    "boss_metronome": (255, 200, 50),
    "enemy_silenceguard": (50, 50, 50),
    "boss_cantor": (30, 30, 50),
    "boss_conductor": (255, 215, 0),
    "boss_paradox": (255, 0, 255),
    "hazard_steam": (200, 200, 200),
    "boss_marshal": (255, 150, 100),
    "boss_librarian": (100, 50, 150),
    "boss_compactor": (100, 100, 100),
    "boss_glassblower": (255, 150, 50),
    "boss_gatekeeper": (50, 150, 255),
    "enemy_mannequin": (200, 220, 255),
    "enemy_drone": (180, 150, 50),
    "enemy_crystal": (150, 255, 255),
    "enemy_bookmimic": (150, 100, 50),
    "default_entity": (255, 0, 0)
}

for name, color in entities.items():
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw a 14x14 box with a 1px border
    draw.rectangle([1, 1, 14, 14], fill=color, outline=(0, 0, 0, 255))

    # Add a small 'eye' or 'front' to show direction
    draw.rectangle([10, 4, 12, 6], fill=(255, 255, 255, 255))
    draw.rectangle([10, 10, 12, 12], fill=(255, 255, 255, 255))

    img.save(os.path.join(out_dir, f"{name}.png"))
    print(f"Generated placeholder entity: {name}.png")
