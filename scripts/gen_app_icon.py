"""生成「时令果册」应用图标（小程序头像/logo），依赖 Pillow。

设计：清新浅绿渐变背景 + 一颗暖橙柑橘(带绿叶) + 底部品牌字，贴合浅绿+暖橙配色。
输出：images/app-icon.png(1024) / app-icon-144.png(144) / app-icon-notext.png(1024 无字版)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 1024
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
FONT_DIR = "C:/Windows/Fonts"

# 配色
GREEN_TOP = (168, 208, 141)
GREEN_BOT = (94, 154, 75)
ORANGE_CENTER = (255, 210, 140)
ORANGE_EDGE = (238, 116, 44)
LEAF_LIGHT = (122, 188, 100)
LEAF_DARK = (58, 122, 50)
STEM = (122, 74, 34)


def vgrad(size, top, bottom):
    w, h = size
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    return img


def radial_rgb(size, center_color, edge_color):
    """满幅径向渐变（中心->边缘），RGB 不带 alpha。"""
    w, h = size
    cx, cy = w / 2, h / 2
    r = max(w, h) / 2
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = math.hypot(x - cx, y - cy) / r
            if t > 1:
                t = 1
            c = tuple(round(center_color[i] + (edge_color[i] - center_color[i]) * t) for i in range(3))
            px[x, y] = c
    return img


def circle_mask(size, aa=2):
    """白色圆形 mask（边缘轻微模糊做抗锯齿），L 模式。"""
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.ellipse([aa, aa, w - aa, h - aa], fill=255)
    return m.filter(ImageFilter.GaussianBlur(aa))


def soft_glow(base, center, radius, alpha):
    """在 base 上叠加一团柔和白光。"""
    side = radius * 2
    g = Image.new("L", (side, side), 0)
    d = ImageDraw.Draw(g)
    d.ellipse([0, 0, side, side], fill=255)
    g = g.filter(ImageFilter.GaussianBlur(radius * 0.5))
    layer = Image.new("RGBA", base.size, (255, 255, 255, 0))
    layer.paste((255, 255, 255, alpha), (int(center[0] - radius), int(center[1] - radius)), g)
    return Image.alpha_composite(base, layer)


def make_leaf(size, light, dark):
    """竖向渐变的椭圆叶片。"""
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        c = tuple(round(light[i] + (dark[i] - light[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c + (255,))
    # 剪成椭圆
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, w, h], fill=255)
    img.putalpha(m)
    return img


def draw_text(img, xy, text, font_path, size, fill=(255, 255, 255, 255), anchor="mm", shadow=True):
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(font_path, size)
    if shadow:
        d.text((xy[0] + 4, xy[1] + 6), text, font=font, fill=(20, 40, 20, 120), anchor=anchor)
    d.text(xy, text, font=font, fill=fill, anchor=anchor)


def build(with_text=True):
    # 背景：浅绿垂直渐变
    img = vgrad((S, S), GREEN_TOP, GREEN_BOT).convert("RGBA")
    # 左上柔光
    img = soft_glow(img, (300, 260), 460, 60)

    # 果实投影
    shadow = Image.new("L", (S, S), 0)
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([272, 660, 752, 780], fill=110)
    shadow = shadow.filter(ImageFilter.GaussianBlur(36))
    dark = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dark.paste((20, 40, 20, 120), (0, 0), shadow)
    img = Image.alpha_composite(img, dark)

    # 果实：暖橙径向渐变圆
    R = 270
    fruit = radial_rgb((R * 2, R * 2), ORANGE_CENTER, ORANGE_EDGE)
    fruit = fruit.convert("RGBA")
    fruit.putalpha(circle_mask((R * 2, R * 2), aa=3))
    img.alpha_composite(fruit, (512 - R, 460 - R))

    # 果实高光
    img = soft_glow(img, (430, 360), 120, 90)

    # 果柄
    d = ImageDraw.Draw(img)
    d.line([(512, 200), (516, 120)], fill=STEM + (255,), width=26)
    d.ellipse([516 - 14, 112 - 14, 516 + 14, 112 + 14], fill=STEM + (255,))

    # 叶片（左右两片）
    leaf_left = make_leaf((190, 92), LEAF_LIGHT, LEAF_DARK).rotate(-38, expand=True, resample=Image.BICUBIC)
    leaf_right = make_leaf((190, 92), LEAF_LIGHT, LEAF_DARK).rotate(38, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(leaf_left, (350 - leaf_left.width // 2, 140 - leaf_left.height // 2))
    img.alpha_composite(leaf_right, (674 - leaf_right.width // 2, 140 - leaf_right.height // 2))

    if with_text:
        draw_text(img, (512, 838), "时令果册", os.path.join(FONT_DIR, "msyhbd.ttc"), 128)
        draw_text(img, (512, 920), "看露天应季水果", os.path.join(FONT_DIR, "msyh.ttc"), 46,
                  fill=(255, 255, 255, 210), shadow=False)

    return img


def main():
    icon = build(with_text=True)
    icon.save(os.path.join(BASE, "app-icon.png"))
    icon.resize((144, 144), Image.LANCZOS).save(os.path.join(BASE, "app-icon-144.png"))

    icon2 = build(with_text=False)
    icon2.save(os.path.join(BASE, "app-icon-notext.png"))

    print("wrote app-icon.png / app-icon-144.png / app-icon-notext.png")


if __name__ == "__main__":
    main()
