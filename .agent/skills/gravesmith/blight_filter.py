import random
import re

class BlightFilter:
    def __init__(self, decay_level=0.5):
        self.decay_level = decay_level
        # The "Souls" Palette
        self.palette = {
            "rust": "#8b4513",
            "blood": "#4a0404",
            "void": "#1a1a1a",
            "bone": "#d2b48c"
        }

    def inject_noise(self, svg_content):
        """Adds 1x1 'Grit' rectangles to simulate decay and texture."""
        noise_count = int(100 * self.decay_level)
        grit_elements = []
        
        for _ in range(noise_count):
            # Random coordinates within a standard 32x32 viewbox
            x, y = random.randint(0, 31), random.randint(0, 31)
            color = random.choice([self.palette["rust"], self.palette["void"]])
            # Create a 1x1 pixel rect
            grit_elements.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{color}" opacity="0.4" />')
        
        return svg_content.replace('</svg>', '\n'.join(grit_elements) + '</svg>')

    def apply_directional_shadow(self, svg_content):
        """Applies a 'stark' shadow layer by shifting a copy of the group."""
        # This simulates the Zelda-view light source without using heavy filters
        # shadow_layer = '<g transform="translate(1, 1)" opacity="0.5" fill="#000000" filter="url(#pixelate)">'
        # Logic to wrap existing paths into a shadow group would go here
        return svg_content # Simplified for this example

def apply_filter(input_svg, decay):
    filter_engine = BlightFilter(decay_level=decay)
    dirty_svg = filter_engine.inject_noise(input_svg)
    return dirty_svg
