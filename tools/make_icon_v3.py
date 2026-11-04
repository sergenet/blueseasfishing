"""Blue Seas Fishing icon v3 - 'Marlin at Dusk' (redesigned fish).

Light ivory/gold sailfish silhouette against deep ocean gradient + warm sun.
Fixed proportions: long thick bill, crescent tail, tall sweeping sail.
Outputs same files as v2 (overwrites).
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

S = 4
W = H = 1080
WW, HH = W * S, H * S

ROOT = r'C:\blueseasfishing\blueseas-fishing-working-website\blueseasfishing.com\android-project'
RES = os.path.join(ROOT, 'app', 'src', 'main', 'res')
STORE = os.path.join(ROOT, 'store-assets')

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def vertical_gradient(size, stops):
    w, h = size
    im = Image.new('RGB', (1, h))
    px = im.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                tt = (t - p0) / max(1e-6, (p1 - p0))
                px[0, y] = lerp(c0, c1, tt)
                break
        else:
            px[0, y] = stops[-1][1]
    return im.resize((w, h), Image.BILINEAR)

def radial_glow(im, cx, cy, r1, color, strength=1.0):
    w, h = im.size
    D = 2
    gw, gh = w // D, h // D
    g = Image.new('L', (gw, gh), 0)
    gp = g.load()
    cx, cy, r1 = cx / D, cy / D, r1 / D
    for y in range(gh):
        for x in range(gw):
            d = math.hypot(x - cx, y - cy)
            if d >= r1:
                continue
            t = max(0.0, 1.0 - d / r1) ** 2
            gp[x, y] = int(255 * strength * t)
    g = g.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(w // 22))
    glow = Image.new('RGBA', (w, h), color + (0,))
    glow.putalpha(g)
    im.alpha_composite(glow)

# ------------------------------------------------------------------ fish
# Unit space: fish faces RIGHT, spans x 0.05..1.02, y 0.05..0.62
BODY = [
    (1.020, 0.470),              # bill tip (top edge)
    (0.860, 0.452),
    (0.775, 0.438),              # bill base top
    (0.700, 0.408),              # head top
    (0.610, 0.382),
    (0.500, 0.366),
    (0.390, 0.368),
    (0.290, 0.388),
    (0.210, 0.415),              # tail base top
    (0.165, 0.435),
    (0.062, 0.372),              # tail top tip
    (0.130, 0.487),              # tail fork center
    (0.062, 0.605),              # tail bottom tip
    (0.165, 0.520),              # tail base bottom
    (0.215, 0.512),
    (0.290, 0.520),
    (0.390, 0.528),
    (0.490, 0.528),
    (0.570, 0.518),
    (0.640, 0.495),              # head lower
    (0.700, 0.472),              # jaw
    (0.775, 0.462),              # bill base bottom
    (0.860, 0.468),
    (1.020, 0.483),              # bill tip (bottom edge)
]
SAIL = [
    (0.225, 0.415),              # rear base (on back)
    (0.255, 0.310),
    (0.285, 0.170),
    (0.325, 0.235),
    (0.375, 0.105),
    (0.425, 0.200),
    (0.480, 0.070),
    (0.535, 0.185),
    (0.580, 0.140),
    (0.625, 0.250),
    (0.660, 0.330),
    (0.672, 0.385),              # front base near head top
    (0.610, 0.382),
    (0.500, 0.366),
    (0.390, 0.368),
    (0.290, 0.388),
]
PECTIONAL = [
    (0.470, 0.515),
    (0.505, 0.620),
    (0.548, 0.655),
    (0.572, 0.605),
    (0.545, 0.525),
]
ANAL_FIN = [
    (0.230, 0.512),
    (0.268, 0.600),
    (0.300, 0.515),
]

def rot(px, py, cx, cy, ang):
    dx, dy = px - cx, py - cy
    ca, sa = math.cos(ang), math.sin(ang)
    return cx + dx * ca - dy * sa, cy + dx * sa + dy * ca

def transform(pts, scale, angle, ox, oy):
    cx, cy = 0.55, 0.36  # rotate about fish visual center
    out = []
    for x, y in pts:
        rx, ry = rot(x, y, cx, cy, angle)
        out.append((ox + rx * scale, oy + ry * scale))
    return out

def build_background():
    stops = [
        (0.00, (6, 14, 36)),
        (0.30, (10, 38, 88)),
        (0.55, (17, 66, 134)),
        (0.80, (28, 108, 178)),
        (1.00, (52, 148, 212)),
    ]
    bg = vertical_gradient((WW, HH), stops).convert('RGBA')
    radial_glow(bg, WW * 0.44, HH * 0.34, WW * 0.50, (255, 180, 80), 0.50)
    radial_glow(bg, WW * 0.44, HH * 0.35, WW * 0.24, (255, 222, 150), 0.55)
    return bg

def build_foreground():
    im = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    scale = WW * 0.88
    angle = math.radians(-8)
    ox, oy = WW * 0.02, HH * 0.10

    SUN = (255, 176, 64)
    SUN_CORE = (255, 216, 130)
    SAIL_C = (244, 164, 62)       # amber sail
    BODY_C = (255, 240, 214)      # ivory body
    FIN_C = (240, 190, 100)
    NAVY = (10, 24, 52)
    CYAN = (110, 226, 255)

    sun_c = (WW * 0.47, HH * 0.36)
    sun_r = WW * 0.175
    d.ellipse([sun_c[0] - sun_r, sun_c[1] - sun_r, sun_c[0] + sun_r, sun_c[1] + sun_r], fill=SUN + (255,))
    d.ellipse([sun_c[0] - sun_r * 0.66, sun_c[1] - sun_r * 0.66, sun_c[0] + sun_r * 0.66, sun_c[1] + sun_r * 0.66], fill=SUN_CORE + (255,))

    # fins behind body
    d.polygon(transform(PECTIONAL, scale, angle, ox, oy), fill=FIN_C + (255,))
    d.polygon(transform(ANAL_FIN, scale, angle, ox, oy), fill=FIN_C + (255,))
    # sail behind body
    d.polygon(transform(SAIL, scale, angle, ox, oy), fill=SAIL_C + (255,))
    # body on top
    d.polygon(transform(BODY, scale, angle, ox, oy), fill=BODY_C + (255,))

    # eye
    ex, ey = transform([(0.662, 0.428)], scale, angle, ox, oy)[0]
    er = 0.0135 * scale
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=NAVY + (255,))

    # body shading stripe (subtle cool line along belly)
    belly = [(0.30, 0.512), (0.42, 0.522), (0.54, 0.512)]
    bp = transform([(x, y + 0.004) for x, y in belly], scale, angle, ox, oy)
    d.line(bp, fill=(255, 255, 255, 0), width=1)

    # cyan rim on the back + bill top
    rim = [(0.215, 0.415), (0.29, 0.388), (0.39, 0.368), (0.50, 0.366), (0.61, 0.382), (0.70, 0.408), (0.775, 0.438), (1.015, 0.471)]
    rp = transform(rim, scale, angle, ox, oy)
    rim_layer = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim_layer)
    rd.line(rp, fill=CYAN + (255,), width=int(0.020 * WW), joint='curve')
    rim_layer = rim_layer.filter(ImageFilter.GaussianBlur(5 * S // 2))
    im.alpha_composite(rim_layer)
    d = ImageDraw.Draw(im)
    d.line(rp, fill=CYAN + (255,), width=int(0.008 * WW), joint='curve')

    # speed lines behind tail
    for i, (x0, y0, x1, y1, wd_, al) in enumerate([
        (0.02, 0.34, 0.16, 0.36, 0.006, 150),
        (0.00, 0.46, 0.13, 0.47, 0.005, 120),
        (0.03, 0.58, 0.17, 0.575, 0.006, 150),
    ]):
        p1 = transform([(x0, y0)], scale, angle, ox, oy)[0]
        p2 = transform([(x1, y1)], scale, angle, ox, oy)[0]
        d.line([p1, p2], fill=(140, 225, 250, al), width=int(wd_ * WW))

    # waves
    wave_layer = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wave_layer)
    sea1, sea2, sea3 = HH * 0.70, HH * 0.78, HH * 0.855
    pts1 = [(x, sea1 + math.sin(x / WW * math.tau * 1.4 + 0.9) * HH * 0.016) for x in range(0, WW + 8, 8)]
    pts2 = [(x, sea2 + math.sin(x / WW * math.tau * 2.0 + 2.6) * HH * 0.020) for x in range(0, WW + 8, 8)]
    pts3 = [(x, sea3 + math.sin(x / WW * math.tau * 2.6 + 4.5) * HH * 0.022) for x in range(0, WW + 8, 8)]
    wd.polygon(pts1 + [(WW, HH), (0, HH)], fill=(14, 46, 96, 200))
    wd.polygon(pts2 + [(WW, HH), (0, HH)], fill=(9, 32, 72, 230))
    wd.polygon(pts3 + [(WW, HH), (0, HH)], fill=(6, 21, 48, 255))
    im.alpha_composite(wave_layer)
    d = ImageDraw.Draw(im)

    # foam crests
    for pts, col in [(pts1, (120, 205, 240, 150)), (pts2, (90, 175, 220, 120)), (pts3, (70, 155, 205, 95))]:
        for i in range(2, len(pts) - 1, 7):
            x, y = pts[i]
            r = WW * 0.007
            d.ellipse([x - r, y - r * 0.55, x + r, y + r * 0.55], fill=col)

    # sun reflection streaks
    refl = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    rf = ImageDraw.Draw(refl)
    for i in range(22):
        t = i / 21
        y = sea1 + 8 + t * (HH - sea1 - 34)
        wob = math.sin(t * 8.5) * WW * 0.010
        w = WW * 0.050 * (1 - t * 0.5)
        a = int(85 * (1 - t))
        rf.rounded_rectangle([sun_c[0] - w + wob, y, sun_c[0] + w + wob, y + HH * 0.011],
                             radius=HH * 0.005, fill=(255, 205, 115, a))
    refl = refl.filter(ImageFilter.GaussianBlur(2 * S // 2))
    im.alpha_composite(refl)
    d = ImageDraw.Draw(im)

    # sparkles
    for sx, sy, sr in [(0.13, 0.12, 0.011), (0.21, 0.075, 0.006), (0.855, 0.11, 0.009), (0.79, 0.065, 0.005), (0.30, 0.045, 0.005)]:
        cx, cy, r = sx * WW, sy * HH, sr * WW
        d.line([(cx - r, cy), (cx + r, cy)], fill=(185, 232, 255, 190), width=max(2, int(WW * 0.0028)))
        d.line([(cx, cy - r), (cx, cy + r)], fill=(185, 232, 255, 190), width=max(2, int(WW * 0.0028)))
        rr = r * 0.34
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(215, 244, 255, 220))

    # bubbles
    for bx, by, br, ba in [(0.12, 0.28, 0.012, 100), (0.085, 0.22, 0.008, 130), (0.93, 0.60, 0.010, 110), (0.955, 0.52, 0.006, 140)]:
        r = br * WW
        cx, cy = bx * WW, by * HH
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 228, 252, ba), width=max(2, int(WW * 0.0035)))

    return im

def downscale_from_ss(img_ss):
    return img_ss.resize((W, H), Image.LANCZOS)

def add_alpha_margin(fg):
    art = fg.crop(fg.getbbox()) if fg.getbbox() else fg
    target = int(W * 0.82)
    ratio = min(target / art.width, target / art.height)
    art = art.resize((int(art.width * ratio), int(art.height * ratio)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(art, ((W - art.width) // 2, (H - art.height) // 2))
    return canvas

def main():
    bg = downscale_from_ss(build_background()).convert('RGB')
    fg = downscale_from_ss(build_foreground())
    fg_adaptive = add_alpha_margin(fg)

    fg_adaptive.save(os.path.join(RES, 'drawable', 'ic_launcher_foreground.png'), 'PNG', optimize=True)
    bg.save(os.path.join(RES, 'drawable', 'ic_launcher_background.png'), 'PNG', optimize=True)

    full = bg.convert('RGBA')
    full.alpha_composite(fg)
    full_rgb = full.convert('RGB')

    sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for name, s in sizes.items():
        d = os.path.join(RES, 'mipmap-' + name)
        os.makedirs(d, exist_ok=True)
        full_rgb.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'), 'PNG', optimize=True)
        mask = Image.new('L', (s * S, s * S), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, s * S - 1, s * S - 1], fill=255)
        big = full_rgb.resize((s * S, s * S), Image.LANCZOS).convert('RGBA')
        big.putalpha(mask)
        big.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_round.png'), 'PNG', optimize=True)

    os.makedirs(STORE, exist_ok=True)
    full_rgb.resize((512, 512), Image.LANCZOS).save(os.path.join(STORE, 'play-icon-512.png'), 'PNG', optimize=True)

    # preview: square 512, adaptive-circle, round, tiny 48px
    prev = Image.new('RGB', (4 * 300 + 50, 300), (24, 24, 28))
    pv1 = full_rgb.resize((300, 300), Image.LANCZOS)
    ap = bg.convert('RGBA'); ap.alpha_composite(fg_adaptive)
    m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).ellipse([0, 0, W - 1, W - 1], fill=255)
    ap.putalpha(m); pv2 = ap.convert('RGB').resize((300, 300), Image.LANCZOS)
    rp = full_rgb.convert('RGBA'); rp.putalpha(m); pv3 = rp.convert('RGB').resize((300, 300), Image.LANCZOS)
    pv4 = full_rgb.resize((48, 48), Image.LANCZOS).resize((300, 300), Image.NEAREST)
    for i, pv in enumerate([pv1, pv2, pv3, pv4]):
        prev.paste(pv, (i * 310 + 5, 0))
    prev.save(r'C:\blueseasfishing\Assets\android\icon-preview-v3.png')
    print('icon v3 written')

if __name__ == '__main__':
    main()
