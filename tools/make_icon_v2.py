"""Blue Seas Fishing icon v2 - 'Sunset Strike'.

Design: deep navy->ocean gradient, golden sun, leaping sailfish silhouette with
cyan rim-light, stylized waves + foam, bubbles. Drawn at 4x supersampling.

Outputs (into android-project):
  res/drawable/ic_launcher_foreground.png   1080x1080 RGBA (adaptive fg)
  res/drawable/ic_launcher_background.png   1080x1080 RGB  (gradient bg)
  res/mipmap-*/ic_launcher.png              square icons, all densities + 512
  res/mipmap-*/ic_launcher_round.png        circular icons, all densities
  store-assets/play-icon-512.png            Play Store icon
  icon-preview.png                          4-up preview sheet
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

S = 4                      # supersample factor for 1080 canvas
W = H = 1080               # final adaptive canvas
WW, HH = W * S, H * S

ROOT = r'C:\blueseasfishing\blueseas-fishing-working-website\blueseasfishing.com\android-project'
RES = os.path.join(ROOT, 'app', 'src', 'main', 'res')
STORE = os.path.join(ROOT, 'store-assets')

# ---------------------------------------------------------------- helpers
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def vertical_gradient(size, stops):
    """stops: list of (pos 0..1, color)."""
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

def radial_fade(im, cx, cy, r0, r1, color, strength=1.0):
    """Additive-ish soft radial glow composited onto RGBA im."""
    w, h = im.size
    S = 2
    gw, gh = w // S, h // S
    g = Image.new('L', (gw, gh), 0)
    gp = g.load()
    cx, cy, r1, r0 = cx / S, cy / S, r1 / S, r0 / S
    for y in range(gh):
        for x in range(gw):
            d = math.hypot(x - cx, y - cy)
            if d >= r1:
                continue
            t = max(0.0, 1.0 - d / r1)
            t = t ** 2
            gp[x, y] = int(255 * strength * t)
    g = g.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(w // 24))
    glow = Image.new('RGBA', (w, h), color + (0,))
    glow.putalpha(g)
    im.alpha_composite(glow)

# ---------------------------------------------------------------- geometry
def fish_points(scale=1.0, flip_x=False):
    """Sailfish body polygon in unit space (roughly 0..1), bill pointing right.
    Returns list of (x, y) scaled by `scale`, in supersampled px later."""
    pts = [
        (0.06, 0.62),   # tail root bottom
        (0.10, 0.50),   # tail fork bottom tip
        (0.14, 0.60),   # tail root mid
        (0.20, 0.56),   # rear body
        (0.30, 0.48),   # belly rise
        (0.42, 0.43),   # mid belly
        (0.56, 0.40),   # head lower
        (0.66, 0.385),  # jaw
        (0.70, 0.40),   # mouth notch bottom
        (0.685, 0.415), # mouth notch top
        (0.72, 0.415),  # lower bill root
        (0.97, 0.395),  # bill tip
        (0.72, 0.375),  # upper bill root
        (0.69, 0.355),  # head top front
        (0.60, 0.335),  # crown
        (0.50, 0.315),  # sail base mid
        (0.40, 0.30),   # sail base rear
        (0.30, 0.32),   # rear back
        (0.20, 0.40),   # tail base top
        (0.14, 0.38),   # tail fork top tip
        (0.10, 0.44),   # tail root top
        (0.06, 0.50),   # tail center notch
    ]
    out = []
    for x, y in pts:
        if flip_x:
            x = 1 - x
        out.append((x * scale, y * scale))
    return out

def sail_points(scale=1.0):
    """Big dorsal sail polygon (in same unit space as fish)."""
    pts = [
        (0.30, 0.315),  # rear base
        (0.335, 0.13),  # rear spike
        (0.375, 0.155),
        (0.415, 0.10),  # tall spike 2
        (0.455, 0.135),
        (0.50, 0.075),  # tallest spike
        (0.545, 0.135),
        (0.585, 0.10),  # spike 3
        (0.62, 0.155),
        (0.66, 0.20),   # front slope
        (0.685, 0.30),  # meets head
        (0.60, 0.33),
        (0.50, 0.315),
        (0.40, 0.30),
    ]
    return [(x * scale, y * scale) for x, y in pts]

def fin_points(scale=1.0):
    """Pectoral fin."""
    pts = [
        (0.46, 0.46),
        (0.50, 0.56),
        (0.545, 0.60),
        (0.575, 0.565),
        (0.555, 0.50),
        (0.52, 0.455),
    ]
    return [(x * scale, y * scale) for x, y in pts]

# ---------------------------------------------------------------- build bg
def build_background():
    stops = [
        (0.00, (8, 22, 52)),      # near-black navy
        (0.30, (13, 42, 92)),     # deep blue
        (0.55, (20, 78, 148)),    # ocean blue
        (0.78, (35, 120, 190)),   # lighter
        (1.00, (60, 160, 220)),   # horizon glow
    ]
    bg = vertical_gradient((WW, HH), stops).convert('RGBA')
    # sun glow centered upper middle
    radial_fade(bg, WW * 0.5, HH * 0.40, 0, WW * 0.52, (255, 190, 90), 0.55)
    radial_fade(bg, WW * 0.5, HH * 0.42, 0, WW * 0.26, (255, 220, 140), 0.55)
    return bg

# ---------------------------------------------------------------- build fg
def build_foreground():
    im = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    unit = WW  # 1.0 == full width
    fx = WW * 0.015     # fish block left offset
    fy = WW * 0.16      # fish block top offset

    def T(pts):
        return [(fx + x, fy + y) for x, y in pts]

    DARK = (10, 24, 48, 255)
    SAIL = (10, 26, 54, 255)
    CYAN = (110, 230, 255, 255)
    GOLD = (255, 196, 84, 255)
    WHITE = (240, 250, 255, 255)

    # ---- sun disc (behind fish)
    sun_c = (WW * 0.5, HH * 0.40)
    sun_r = WW * 0.155
    d.ellipse([sun_c[0] - sun_r, sun_c[1] - sun_r, sun_c[0] + sun_r, sun_c[1] + sun_r], fill=(255, 176, 64, 255))
    # sun core highlight
    d.ellipse([sun_c[0] - sun_r * 0.62, sun_c[1] - sun_r * 0.62, sun_c[0] + sun_r * 0.62, sun_c[1] + sun_r * 0.62], fill=(255, 214, 120, 255))

    # ---- fish shadow on water (later waves cover partially)
    # ---- sail (behind body)
    d.polygon(T(sail_points(unit)), fill=SAIL)

    # ---- body
    d.polygon(T(fish_points(unit)), fill=DARK)

    # ---- pectoral fin
    d.polygon(T(fin_points(unit)), fill=(13, 34, 66, 255))

    # ---- eye
    ex, ey = fx + 0.630 * unit, fy + 0.365 * unit
    er = 0.016 * unit
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=WHITE)
    d.ellipse([ex - er * 0.45, ey - er * 0.45, ex + er * 0.45, ey + er * 0.45], fill=(6, 14, 30, 255))

    # ---- cyan rim light along back + bill top (polyline)
    rim = [(0.20, 0.40), (0.30, 0.32), (0.40, 0.30), (0.50, 0.315), (0.60, 0.335), (0.69, 0.355), (0.72, 0.375), (0.965, 0.396)]
    rp = [(fx + x * unit, fy + y * unit) for x, y in rim]
    d.line(rp, fill=CYAN, width=int(0.012 * unit), joint='curve')
    # rim glow
    rim_layer = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim_layer)
    rd.line(rp, fill=CYAN, width=int(0.030 * unit), joint='curve')
    rim_layer = rim_layer.filter(ImageFilter.GaussianBlur(6 * S // 2))
    im.alpha_composite(rim_layer)
    d = ImageDraw.Draw(im)
    d.line(rp, fill=CYAN, width=int(0.012 * unit), joint='curve')

    # ---- waves band at bottom
    sea_top = HH * 0.66
    wave_layer = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wave_layer)
    # back wave (translucent deep)
    pts_b = [(x, sea_top + math.sin(x / WW * math.tau * 1.5 + 0.8) * HH * 0.018) for x in range(0, WW + 8, 8)]
    wd.polygon(pts_b + [(WW, HH), (0, HH)], fill=(16, 52, 104, 210))
    # mid wave
    sea_mid = HH * 0.74
    pts_m = [(x, sea_mid + math.sin(x / WW * math.tau * 2.1 + 2.4) * HH * 0.022) for x in range(0, WW + 8, 8)]
    wd.polygon(pts_m + [(WW, HH), (0, HH)], fill=(10, 36, 78, 235))
    # front wave
    sea_front = HH * 0.82
    pts_f = [(x, sea_front + math.sin(x / WW * math.tau * 2.7 + 4.4) * HH * 0.024) for x in range(0, WW + 8, 8)]
    wd.polygon(pts_f + [(WW, HH), (0, HH)], fill=(7, 24, 54, 255))
    im.alpha_composite(wave_layer)
    d = ImageDraw.Draw(im)

    # ---- foam crests on wave tops
    for pts, col in [(pts_b, (120, 200, 235, 160)), (pts_m, (90, 170, 215, 130)), (pts_f, (70, 150, 200, 110))]:
        for i in range(0, len(pts) - 1, 6):
            x, y = pts[i]
            r = WW * 0.008
            d.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=col)

    # ---- moon-style reflection column under sun
    refl = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    rf = ImageDraw.Draw(refl)
    for i in range(26):
        t = i / 25
        y = sea_top + 10 + t * (HH - sea_top - 30)
        wobble = math.sin(t * 9.0) * WW * 0.012
        w = WW * 0.055 * (1 - t * 0.55)
        a = int(90 * (1 - t))
        rf.rounded_rectangle([sun_c[0] - w + wobble, y, sun_c[0] + w + wobble, y + HH * 0.012], radius=HH * 0.006, fill=(255, 200, 110, a))
    refl = refl.filter(ImageFilter.GaussianBlur(2 * S // 2))
    im.alpha_composite(refl)
    d = ImageDraw.Draw(im)

    # ---- bubbles
    bub = [(0.16, 0.30, 0.014, 90), (0.115, 0.24, 0.009, 120), (0.85, 0.62, 0.011, 110),
           (0.90, 0.50, 0.007, 140), (0.80, 0.30, 0.008, 100), (0.24, 0.70, 0.010, 90)]
    for bx, by, br, ba in bub:
        r = br * WW
        cx, cy = bx * WW, by * HH
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 225, 250, ba), width=max(2, int(WW * 0.004)))

    # ---- sparkle stars in upper corners
    for sx, sy, sr in [(0.12, 0.13, 0.012), (0.20, 0.085, 0.007), (0.86, 0.12, 0.010), (0.79, 0.07, 0.006)]:
        cx, cy, r = sx * WW, sy * HH, sr * WW
        d.line([(cx - r, cy), (cx + r, cy)], fill=(190, 235, 255, 200), width=max(2, int(WW * 0.003)))
        d.line([(cx, cy - r), (cx, cy + r)], fill=(190, 235, 255, 200), width=max(2, int(WW * 0.003)))
        rr = r * 0.35
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(220, 245, 255, 230))

    return im

def downscale_from_ss(img_ss):
    return img_ss.resize((W, H), Image.LANCZOS)

def add_alpha_margin(fg):
    """Adaptive-icon foreground: artwork should sit within center ~66dp of 108dp.
    Our art spans nearly full canvas; scale it to ~72% centered."""
    art = fg.crop(fg.getbbox()) if fg.getbbox() else fg
    target = int(W * 0.80)
    ratio = min(target / art.width, target / art.height)
    art = art.resize((int(art.width * ratio), int(art.height * ratio)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(art, ((W - art.width) // 2, (H - art.height) // 2))
    return canvas

# ---------------------------------------------------------------- outputs
def main():
    bg_ss = build_background()
    fg_ss = build_foreground()

    bg = downscale_from_ss(bg_ss).convert('RGB')
    fg = downscale_from_ss(fg_ss)

    fg_adaptive = add_alpha_margin(fg)
    fg_adaptive.save(os.path.join(RES, 'drawable', 'ic_launcher_foreground.png'), 'PNG', optimize=True)
    bg.save(os.path.join(RES, 'drawable', 'ic_launcher_background.png'), 'PNG', optimize=True)

    # full-bleed icon (bg + un-margined art) for legacy mipmaps & store
    full = bg.convert('RGBA')
    full.alpha_composite(fg)
    full_rgb = full.convert('RGB')

    sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for name, s in sizes.items():
        d = os.path.join(RES, 'mipmap-' + name)
        os.makedirs(d, exist_ok=True)
        full_rgb.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'), 'PNG', optimize=True)
        # round: circular mask
        mask = Image.new('L', (s * S, s * S), 0)
        md = ImageDraw.Draw(mask)
        md.ellipse([0, 0, s * S - 1, s * S - 1], fill=255)
        big = full_rgb.resize((s * S, s * S), Image.LANCZOS).convert('RGBA')
        big.putalpha(mask)
        big.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_round.png'), 'PNG', optimize=True)

    os.makedirs(STORE, exist_ok=True)
    full_rgb.resize((512, 512), Image.LANCZOS).save(os.path.join(STORE, 'play-icon-512.png'), 'PNG', optimize=True)

    # preview sheet: icon + adaptive-with-mask + round
    prev = Image.new('RGB', (3 * 320 + 40, 320), (24, 24, 28))
    pv1 = full_rgb.resize((320, 320), Image.LANCZOS)
    # adaptive preview: bg + margined fg in circle
    ap = bg.convert('RGBA')
    ap.alpha_composite(fg_adaptive)
    mask = Image.new('L', (W, W), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, W - 1, W - 1], fill=255)
    ap.putalpha(mask)
    pv2 = ap.convert('RGB').resize((320, 320), Image.LANCZOS)
    mask2 = Image.new('L', (W, W), 0)
    ImageDraw.Draw(mask2).ellipse([0, 0, W - 1, W - 1], fill=255)
    rp = full_rgb.convert('RGBA'); rp.putalpha(mask2)
    pv3 = rp.convert('RGB').resize((320, 320), Image.LANCZOS)
    prev.paste(pv1, (0, 0)); prev.paste(pv2, (340, 0)); prev.paste(pv3, (680, 0))
    prev.save(r'C:\blueseasfishing\Assets\android\icon-preview-v2.png')

    print('icon v2 written')

if __name__ == '__main__':
    main()
