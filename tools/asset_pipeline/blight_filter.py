import random

def apply_decay(pixel_map, decay_chance=0.05):
    """
    Injects 'grit' and decay into the pixel map.

    Args:
        pixel_map: Dictionary {(x, y): hex_color_string}
        decay_chance: Probability (0-1) of a pixel being 'decayed' (removed).

    Returns:
        Modified pixel_map
    """
    keys = list(pixel_map.keys())
    for pos in keys:
        if random.random() < decay_chance:
            # Decay: Remove the pixel (create a hole)
            del pixel_map[pos]

    return pixel_map
