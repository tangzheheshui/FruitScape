"""Generate tabBar icons (5 tabs x normal/selected) as anti-aliased PNGs.

纯标准库（zlib/struct），无第三方依赖。形状用归一化坐标的几何判定绘制，
再用 3x3 超采样做边缘抗锯齿。
"""
import math
import os
import struct
import zlib

GREY = (154, 163, 154)    # 未选中 tab 颜色
ORANGE = (232, 133, 60)   # 选中 tab 颜色
SIZE = 81                 # 微信 tabBar 推荐尺寸


def point_in_poly(x, y, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            xint = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < xint:
                inside = not inside
        j = i
    return inside


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return ((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2) ** 0.5


def dist(px, py, cx, cy):
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def rect(px, py, x0, y0, x1, y1):
    return x0 <= px <= x1 and y0 <= py <= y1


# ---- 形状定义（归一化坐标 0..1）----

def home(x, y):
    roof = point_in_poly(x, y, [(0.5, 0.10), (0.06, 0.50), (0.94, 0.50)])
    body = rect(x, y, 0.20, 0.50, 0.80, 0.86)
    door = rect(x, y, 0.42, 0.62, 0.58, 0.86)
    return (roof or body) and not door


def search(x, y):
    ring = 0.17 <= dist(x, y, 0.42, 0.42) <= 0.27
    handle = seg_dist(x, y, 0.62, 0.62, 0.90, 0.90) <= 0.055
    return ring or handle


def nearby(x, y):
    body = dist(x, y, 0.5, 0.40) <= 0.30
    tri = point_in_poly(x, y, [(0.26, 0.60), (0.74, 0.60), (0.50, 0.90)])
    hole = dist(x, y, 0.5, 0.40) <= 0.11
    return (body or tri) and not hole


def _star_poly(cx, cy, R, r):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = R if i % 2 == 0 else r
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


STAR = _star_poly(0.5, 0.52, 0.36, 0.155)


def favorite(x, y):
    return point_in_poly(x, y, STAR)


def about(x, y):
    ring = 0.30 <= dist(x, y, 0.5, 0.5) <= 0.38
    dot = dist(x, y, 0.5, 0.36) <= 0.07
    bar = rect(x, y, 0.455, 0.50, 0.545, 0.68)
    return ring or dot or bar


def render(path, color, fn):
    sub = 3
    rows = []
    for y in range(SIZE):
        row = bytearray(b"\x00")  # filter type 0
        for x in range(SIZE):
            cnt = 0
            for sy in range(sub):
                for sx in range(sub):
                    nx = (x + (sx + 0.5) / sub) / SIZE
                    ny = (y + (sy + 0.5) / sub) / SIZE
                    if fn(nx, ny):
                        cnt += 1
            alpha = round(255 * cnt / (sub * sub))
            if alpha:
                row += bytes((color[0], color[1], color[2], alpha))
            else:
                row += b"\x00\x00\x00\x00"
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path)


def main():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
    shapes = {
        "home": home,
        "search": search,
        "nearby": nearby,
        "favorite": favorite,
        "about": about,
    }
    for name, fn in shapes.items():
        render(os.path.join(base, "tab-%s.png" % name), GREY, fn)
        render(os.path.join(base, "tab-%s-active.png" % name), ORANGE, fn)


if __name__ == "__main__":
    main()
