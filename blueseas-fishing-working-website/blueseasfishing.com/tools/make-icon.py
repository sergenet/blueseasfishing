#!/usr/bin/env python3
"""
make-icon.py — Blue Seas Fishing app/store icon generator (2026-09-27).

Design: white geometric fish locked in cyan camera-viewfinder brackets with a
scan line — reads as "AI identifies fish from your camera" at any size, and
stands out from the usual realistic-fish-on-blue app icons.

Outputs:
  android-project/store-assets/play-icon-512.png          (Play listing icon)
  android-project/app/src/main/res/mipmap-*/ic_launcher.png + _round.png  (legacy, Android 7)
  android-project/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml + _round.xml (adaptive)
  android-project/app/src/main/res/drawable/ic_launcher_foreground.png    (adaptive fg)
  android-project/app/src/main/res/values/ic_launcher_background.xml      (adaptive bg color)
"""
from PIL import Image, ImageDraw, ImageFilter
import os

# The Android app project was separated from the website tree on 2026-10-14
# (it used to live inside the web root and shipped with every deploy).
ANDROID_PROJECT = r"C:/Projects/BlueSeasFishing-App/android-project"
RES = os.path.join(ANDROID_PROJECT, "app", "src", "main", "res")
STORE = os.path.join(ANDROID_PROJECT, "store-assets")

NAVY = (10, 27, 61)        # deep navy
BLUE = (29, 78, 216)       # brand blue #1D4ED8
CYAN = (34, 211, 238)      # #22D3EE viewfinder / scan
WHITE = (255, 255, 255)
INK = (8, 20, 44)          # fish eye

S = 2048  # master canvas

# ---------- background: diagonal navy->blue gradient + soft center glow ----------
g = Image.new("RGB", (64, 64))
gp = g.load()
for y in range(64):
    for x in range(64):
        t = (x + y) / 126.0
        gp[x, y] = (
            int(NAVY[0] + (BLUE[0] - NAVY[0]) * t),
            int(NAVY[1] + (BLUE[1] - NAVY[1]) * t),
            int(NAVY[2] + (BLUE[2] - NAVY[2]) * t),
        )
img = g.resize((S, S), Image.LANCZOS).convert("RGB")

glow = Image.new("L", (S, S), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse((1024 - 700, 1024 - 700, 1024 + 700, 1024 + 700), fill=70)
glow = glow.filter(ImageFilter.GaussianBlur(180))
img = Image.composite(Image.new("RGB", (S, S), (46, 107, 255)), img, glow)

d = ImageDraw.Draw(img)

# ---------- viewfinder brackets (cyan, rounded) ----------
def bracket(x, y, sx, sy, t, L, r):
    # horizontal arm, vertical arm; (sx,sy) is direction of the corner
    if sx > 0:
        hx0, hx1 = x, x + L
    else:
        hx0, hx1 = x - L, x
    if sy > 0:
        vy0, vy1 = y, y + L
    else:
        vy0, vy1 = y - L, y
    d.rounded_rectangle((hx0, y - t // 2, hx1, y + t // 2), radius=r, fill=CYAN)
    d.rounded_rectangle((x - t // 2, vy0, x + t // 2, vy1), radius=r, fill=CYAN)

t, L, r = 66, 290, 32
bracket(500, 500, +1, +1, t, L, r)
bracket(1548, 500, -1, +1, t, L, r)
bracket(500, 1548, +1, -1, t, L, r)
bracket(1548, 1548, -1, -1, t, L, r)

# ---------- fish (white, geometric, faces left) ----------
# body
d.ellipse((590, 784, 1390, 1264), fill=WHITE)
# tail (classic V)
d.polygon([(1330, 1024), (1590, 862), (1590, 1186)], fill=WHITE)
# dorsal fin
d.polygon([(880, 812), (1050, 716), (1170, 812)], fill=WHITE)
# eye
d.ellipse((700 - 40, 962 - 40, 700 + 40, 962 + 40), fill=INK)

# ---------- scan line (over the fish: "being scanned") ----------
scan = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(scan)
sd.rounded_rectangle((540, 990, 1600, 1042), radius=26, fill=CYAN + (95,))     # soft band
sd.rounded_rectangle((540, 1008, 1600, 1024), radius=8, fill=CYAN + (235,))    # bright core
img = Image.alpha_composite(img.convert("RGBA"), scan).convert("RGB")
d = ImageDraw.Draw(img)

# ---------- exports ----------
def down(size):
    return img.resize((size, size), Image.BILINEAR)

os.makedirs(STORE, exist_ok=True)
p512 = down(512)
p512.save(os.path.join(STORE, "play-icon-512.png"), optimize=True)
print("play-icon-512.png:", os.path.getsize(os.path.join(STORE, "play-icon-512.png")), "bytes", flush=True)

DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for name, size in DENSITIES.items():
    folder = os.path.join(RES, "mipmap-" + name)
    os.makedirs(folder, exist_ok=True)
    down(size).save(os.path.join(folder, "ic_launcher.png"), optimize=True)
    # round: circular mask drawn directly at final size
    sq = down(size).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size - 1, size - 1), fill=255)
    rnd = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rnd.paste(sq, (0, 0), mask)
    rnd.save(os.path.join(folder, "ic_launcher_round.png"), optimize=True)
    print("mipmap-" + name, "done", flush=True)
print("mipmaps written", flush=True)

# adaptive icon: foreground with safe-zone content on transparent, bg color resource
fg = down(864).convert("RGBA")
mask2 = Image.new("L", (864, 864), 0)
m2 = ImageDraw.Draw(mask2)
m2.ellipse((int(864 * 0.185), int(864 * 0.185), int(864 * 0.815), int(864 * 0.815)), fill=255)
fg.putalpha(mask2)
dr = os.path.join(RES, "drawable")
os.makedirs(dr, exist_ok=True)
fg.save(os.path.join(dr, "ic_launcher_foreground.png"), optimize=True)

v26 = os.path.join(RES, "mipmap-anydpi-v26")
os.makedirs(v26, exist_ok=True)
ADAPT = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n</adaptive-icon>\n'
for fn in ("ic_launcher.xml", "ic_launcher_round.xml"):
    with open(os.path.join(v26, fn), "w", newline="\n") as f:
        f.write(ADAPT)
with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w", newline="\n") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A1B3D</color>\n</resources>\n')
print("adaptive icon files written")
print("DONE")
