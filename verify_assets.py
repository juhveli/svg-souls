import re
import sys
import xml.etree.ElementTree as ET

def verify_file(filepath):
    print(f"Verifying {filepath}...")
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        sys.exit(1)

    # Regex to find BOT_SVG or similar constants
    # Looking for const [NAME] = `...`;
    matches = re.findall(r'const\s+(\w+_SVG)\s*=\s*`([^`]+)`', content, re.DOTALL)

    if not matches:
        print("No SVG constants found.")
        return

    for name, svg_content in matches:
        print(f"Checking {name}...")
        # Wrap in a root element because the constant might be a list of elements or a <g>
        # If it's just <g>...</g> it's fine. If it's multiple elements, we need a root.
        wrapped_svg = f"<root>{svg_content}</root>"

        try:
            root = ET.fromstring(wrapped_svg)
        except ET.ParseError as e:
            print(f"  ❌ XML Parse Error: {e}")
            sys.exit(1)

        errors = 0
        for elem in root.iter():
            # Check rects
            if elem.tag == 'rect':
                for attr in ['x', 'y', 'width', 'height']:
                    val = elem.get(attr)
                    if val:
                        try:
                            fval = float(val)
                            if not fval.is_integer():
                                print(f"  ❌ Non-integer {attr} in rect: {val}")
                                errors += 1
                        except ValueError:
                            pass # might be variable or %

            # Check circles (cx, cy, r)
            if elem.tag == 'circle':
                 for attr in ['cx', 'cy', 'r']:
                    val = elem.get(attr)
                    if val:
                        try:
                            fval = float(val)
                            if not fval.is_integer():
                                print(f"  ❌ Non-integer {attr} in circle: {val}")
                                errors += 1
                        except ValueError:
                            pass

            # Check lines (x1, y1, x2, y2)
            if elem.tag == 'line':
                 for attr in ['x1', 'y1', 'x2', 'y2']:
                    val = elem.get(attr)
                    if val:
                        try:
                            fval = float(val)
                            if not fval.is_integer():
                                print(f"  ❌ Non-integer {attr} in line: {val}")
                                errors += 1
                        except ValueError:
                            pass

        if errors == 0:
            print(f"  ✅ {name} passed grid check.")
        else:
            print(f"  ❌ {name} failed with {errors} errors.")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_assets.py <filepath>")
        sys.exit(1)

    verify_file(sys.argv[1])
