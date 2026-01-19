import math

# The "Gloom" Palette (16 colors)
# Format: (R, G, B)
GLOOM_PALETTE = [
    (5, 5, 5),       # 0: Void
    (15, 20, 15),    # 1: Deep Shadow
    (25, 35, 25),    # 2: Swamp Green
    (40, 50, 40),    # 3: Dark Moss
    (60, 40, 30),    # 4: Rusted Iron
    (80, 50, 40),    # 5: Rust
    (100, 70, 50),   # 6: Clay
    (120, 90, 70),   # 7: Old Wood
    (100, 100, 110), # 8: Cold Stone
    (130, 130, 130), # 9: Grey
    (160, 160, 150), # 10: Old Bone
    (200, 200, 190), # 11: Pale Bone (Highlight)
    (50, 10, 10),    # 12: Blood Dry
    (120, 20, 20),   # 13: Blood Fresh
    (10, 30, 50),    # 14: Magic Dark
    (50, 150, 200)   # 15: Magic Bright
]

def get_nearest_color(rgb):
    """
    Finds the nearest color in the GLOOM_PALETTE for a given (r, g, b) tuple.
    """
    r, g, b = rgb
    min_dist = float('inf')
    best_color = GLOOM_PALETTE[0]

    for pr, pg, pb in GLOOM_PALETTE:
        # Euclidean distance
        dist = (int(r) - int(pr))**2 + (int(g) - int(pg))**2 + (int(b) - int(pb))**2
        if dist < min_dist:
            min_dist = dist
            best_color = (pr, pg, pb)

    return best_color

def get_palette_image_data():
    """
    Returns a flat list of palette data suitable for Pillow's putpalette.
    Pillow expects [r,g,b, r,g,b, ...] for 256 colors.
    We fill the first 16, then repeat the last one or fill with black.
    """
    data = []
    for c in GLOOM_PALETTE:
        data.extend(c)

    # Fill remainder to 256 colors (768 integers)
    while len(data) < 768:
        data.extend((0, 0, 0))

    return data
