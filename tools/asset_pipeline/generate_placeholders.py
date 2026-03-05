import sys

def create_placeholder_png(filepath, width, height, color):
    import struct
    import zlib

    def make_png(color_bytes):
        width_bytes = struct.pack(">I", 1)
        height_bytes = struct.pack(">I", 1)
        bit_depth = b'\x08'
        color_type = b'\x02' # Truecolor
        comp_method = b'\x00'
        filter_method = b'\x00'
        interlace_method = b'\x00'
        ihdr_data = width_bytes + height_bytes + bit_depth + color_type + comp_method + filter_method + interlace_method
        ihdr_crc = struct.pack(">I", zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
        ihdr = struct.pack(">I", len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc

        idat_data = zlib.compress(b'\x00' + color_bytes)
        idat_crc = struct.pack(">I", zlib.crc32(b'IDAT' + idat_data) & 0xffffffff)
        idat = struct.pack(">I", len(idat_data)) + b'IDAT' + idat_data + idat_crc

        iend_data = b''
        iend_crc = struct.pack(">I", zlib.crc32(b'IEND' + iend_data) & 0xffffffff)
        iend = struct.pack(">I", len(iend_data)) + b'IEND' + iend_data + iend_crc

        png_magic = b'\x89PNG\r\n\x1a\n'

        return png_magic + ihdr + idat + iend

    import os
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(make_png(color))
    print(f"Created placeholder PNG at {filepath}")

create_placeholder_png('assets/sprites/isometric/floor_tile_placeholder.png', 64, 32, b'\x5a\x3a\x2a')
create_placeholder_png('assets/sprites/isometric/character_placeholder.png', 32, 64, b'\x44\xff\xff')
