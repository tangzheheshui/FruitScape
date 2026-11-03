"""Generate simple circular map-marker PNG icons (no external deps, stdlib only)."""
import zlib
import struct
import os


def make_dot(path, size, color, ring=4):
    """Write a filled circle with a white ring as an 8-bit RGBA PNG."""
    w = h = size
    cx = cy = (size - 1) / 2.0
    outer_r = size / 2.0 - 0.5
    inner_r = outer_r - ring
    rows = []
    for y in range(h):
        row = bytearray(b"\x00")  # filter type 0
        for x in range(w):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= inner_r:
                row += bytes((color[0], color[1], color[2], 255))
            elif d <= outer_r:
                row += b"\xff\xff\xff\xff"
            else:
                row += b"\x00\x00\x00\x00"
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path)


def main():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
    orange = (232, 133, 60)   # in-season accent
    grey = (170, 178, 170)    # out-of-season
    make_dot(os.path.join(base, "marker-in.png"), 44, orange, ring=4)
    make_dot(os.path.join(base, "marker-out.png"), 44, grey, ring=4)
    make_dot(os.path.join(base, "marker-focus.png"), 56, orange, ring=4)


if __name__ == "__main__":
    main()
