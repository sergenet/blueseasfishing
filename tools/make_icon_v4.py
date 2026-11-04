"""Blue Seas Fishing icon v4 - cartoon fish, procedurally drawn.

Fish built from a parametric body outline (smooth sinusoidal thickness along a
spine) + crescent tail + dorsal/pectoral fins. Ivory fish, amber fins, navy
ocean gradient, warm sun, waves, reflection, sparkles.
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

# ---------------------------------------------------------------- fish shape
def quad_bezier(p0, p1, p2, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts

def body_outline():
    """Smooth cartoon fish body, faces right. Nose at (0.80, 0.415)."""
    n = 48
    x_tail, x_nose = 0.125, 0.80
    yc = 0.415
    upper, lower = [], []
    for i in range(n + 1):
        t = i / n                     # 0 at tail .. 1 at nose
        x = x_tail + (x_nose - x_tail) * t
        # thickness profile: full belly at t~0.32, tapers to point at nose
        h = 0.148 * math.sin(math.pi * (0.10 + 0.90 * t) ** 0.85) ** 1.05
        h += 0.030 * (1 - t)          # keep tail-root thickness
        upper.append((x, yc - h))
        lower.append((x, yc + h))
    # tail crescent (two lobes), attached at both tail-edge points
    tail_top_attach = upper[0]
    tail_bot_attach = lower[0]
    tail = quad_bezier(tail_top_attach, (0.010, 0.255), (0.030, 0.335), 12) \
         + quad_bezier((0.030, 0.335), (0.070, 0.415), (0.030, 0.505), 10) \
         + quad_bezier((0.030, 0.505), (0.010, 0.585), tail_bot_attach, 12)
    outline = [(x_nose, yc)] + upper[1:] + tail + lower[::-1][1:]
    return outline

def dorsal_fin():
    base_l = (0.270, 0.310)
    peak = (0.430, 0.095)
    base_r = (0.585, 0.285)
    top = quad_bezier(base_l, (0.295, 0.195), (0.350, 0.135), 10) \
        + quad_bezier((0.350, 0.135), peak, (0.480, 0.105), 10)[1:] \
        + quad_bezier((0.480, 0.105), (0.550, 0.185), base_r, 10)[1:]
    return [base_l] + top + [base_r, (0.450, 0.295), (0.360, 0.300)]

def pectoral_fin():
    return quad_bezier((0.430, 0.480), (0.455, 0.585), (0.505, 0.625), 12) \
         + quad_bezier((0.505, 0.625), (0.545, 0.585), (0.548, 0.520), 10)[1:] \
         + quad_bezier((0.548, 0.520), (0.520, 0.470), (0.480, 0.455), 8)[1:]

def tail_overlay():
    """Amber inner tail shape drawn over navy tail for two-tone look."""
    return [(0.150, 0.330), (0.062, 0.300), (0.098, 0.415), (0.062, 0.530), (0.150, 0.505)]

def rot(px, py, cx, cy, ang):
    dx, dy = px - cx, py - cy
    ca, sa = math.cos(ang), math.sin(ang)
    return cx + dx * ca - dy * sa, cy + dx * sa + dy * ca

def T(pts, scale, angle, ox, oy):
    cx, cy = 0.42, 0.41
    return [(ox + rot(x, y, cx, cy, angle)[0] * scale,
             oy + rot(x, y, cx, cy, angle)[1] * scale) for x, y in pts]

def build_background():
    stops = [
        (0.00, (6, 14, 36)),
        (0.30, (10, 38, 88)),
        (0.55, (17, 66, 134)),
        (0.80, (28, 108, 178)),
        (1.00, (52, 148, 212)),
    ]
    bg = vertical_gradient((WW, HH), stops).convert('RGBA')
    radial_glow(bg, WW * 0.46, HH * 0.36, WW * 0.50, (255, 180, 80), 0.50)
    radial_glow(bg, WW * 0.46, HH * 0.37, WW * 0.24, (255, 222, 150), 0.55)
    return bg

def build_foreground():
    im = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    scale = WW * 0.92
    angle = math.radians(-6)
    ox, oy = WW * 0.03, HH * 0.115

    SUN = (255, 176, 64)
    SUN_CORE = (255, 216, 130)
    FIN = (235, 108, 38)          # coral fins/tail
    BODY = (255, 243, 222)        # ivory
    BELLY = (255, 252, 244)
    NAVY = (10, 24, 52)
    CYAN = (110, 226, 255)

    # sun (slightly higher + paler so coral fins pop against it)
    sun_c = (WW * 0.50, HH * 0.33)
    sun_r = WW * 0.185
    d.ellipse([sun_c[0] - sun_r, sun_c[1] - sun_r, sun_c[0] + sun_r, sun_c[1] + sun_r], fill=(255, 168, 66) + (255,))
    d.ellipse([sun_c[0] - sun_r * 0.66, sun_c[1] - sun_r * 0.66, sun_c[0] + sun_r * 0.66, sun_c[1] + sun_r * 0.66], fill=(255, 214, 128) + (255,))

    # fins behind body (amber), tail base
    d.polygon(T(dorsal_fin(), scale, angle, ox, oy), fill=FIN + (255,))
    d.polygon(T(pectoral_fin(), scale, angle, ox, oy), fill=FIN + (255,))

    # body (includes navy tail crescent)
    d.polygon(T(body_outline(), scale, angle, ox, oy), fill=BODY + (255,))

    # amber inner tail
    d.polygon(T(tail_overlay(), scale, angle, ox, oy), fill=FIN + (255,))


    # gill arc (soft, short)
    gill = quad_bezier((0.600, 0.370), (0.625, 0.415), (0.600, 0.462), 16)
    gp = T(gill, scale, angle, ox, oy)
    d.line(gp, fill=(226, 178, 118, 255), width=max(3, int(0.005 * WW)), joint='curve')

    # eye
    ex, ey = T([(0.672, 0.388)], scale, angle, ox, oy)[0]
    er = 0.0165 * scale
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=NAVY + (255,))
    wr = er * 0.38
    d.ellipse([ex - er * 0.35, ey - er * 0.45, ex - er * 0.35 + 2 * wr, ey - er * 0.45 + 2 * wr], fill=(255, 255, 255, 230))



    # waves
    wave_layer = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wave_layer)
    sea1, sea2, sea3 = HH * 0.72, HH * 0.795, HH * 0.865
    pts1 = [(x, sea1 + math.sin(x / WW * math.tau * 1.4 + 0.9) * HH * 0.015) for x in range(0, WW + 8, 8)]
    pts2 = [(x, sea2 + math.sin(x / WW * math.tau * 2.0 + 2.6) * HH * 0.019) for x in range(0, WW + 8, 8)]
    pts3 = [(x, sea3 + math.sin(x / WW * math.tau * 2.6 + 4.5) * HH * 0.021) for x in range(0, WW + 8, 8)]
    wd.polygon(pts1 + [(WW, HH), (0, HH)], fill=(14, 46, 96, 190))
    wd.polygon(pts2 + [(WW, HH), (0, HH)], fill=(9, 32, 72, 225))
    wd.polygon(pts3 + [(WW, HH), (0, HH)], fill=(6, 21, 48, 255))
    im.alpha_composite(wave_layer)
    d = ImageDraw.Draw(im)

    # foam crests
    for pts, col in [(pts1, (120, 205, 240, 150)), (pts2, (90, 175, 220, 120)), (pts3, (70, 155, 205, 95))]:
        for i in range(2, len(pts) - 1, 7):
            x, y = pts[i]
            r = WW * 0.0065
            d.ellipse([x - r, y - r * 0.55, x + r, y + r * 0.55], fill=col)

    # sun reflection streaks (soft, few)
    refl = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    rf = ImageDraw.Draw(refl)
    for i in range(10):
        t = i / 9
        y = sea1 + 10 + t * (HH - sea1 - 40)
        wob = math.sin(t * 7.0) * WW * 0.012
        w = WW * 0.045 * (1 - t * 0.45)
        a = int(55 * (1 - t))
        rf.rounded_rectangle([sun_c[0] - w + wob, y, sun_c[0] + w + wob, y + HH * 0.014],
                             radius=HH * 0.007, fill=(255, 205, 115, a))
    refl = refl.filter(ImageFilter.GaussianBlur(4 * S // 2))
    im.alpha_composite(refl)
    d = ImageDraw.Draw(im)

    # sparkles
    for sx, sy, sr in [(0.12, 0.12, 0.011), (0.20, 0.075, 0.006), (0.87, 0.11, 0.009), (0.81, 0.065, 0.005), (0.31, 0.045, 0.005)]:
        cx, cy, r = sx * WW, sy * HH, sr * WW
        d.line([(cx - r, cy), (cx + r, cy)], fill=(185, 232, 255, 190), width=max(2, int(WW * 0.0028)))
        d.line([(cx, cy - r), (cx, cy + r)], fill=(185, 232, 255, 190), width=max(2, int(WW * 0.0028)))
        rr = r * 0.34
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(215, 244, 255, 220))

    # bubbles
    for bx, by, br, ba in [(0.11, 0.27, 0.011, 100), (0.08, 0.21, 0.007, 130), (0.93, 0.58, 0.009, 110)]:
        r = br * WW
        cx, cy = bx * WW, by * HH
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 228, 252, ba), width=max(2, int(WW * 0.0035)))

    return im

def downscale_from_ss(img_ss):
    return img_ss.resize((W, H), Image.LANCZOS)

def add_alpha_margin(fg):
    art = fg.crop(fg.getbbox()) if fg.getbbox() else fg
    target = int(W * 0.84)
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

    prev = Image.new('RGB', (4 * 300 + 50, 300), (24, 24, 28))
    pv1 = full_rgb.resize((300, 300), Image.LANCZOS)
    ap = bg.convert('RGBA'); ap.alpha_composite(fg_adaptive)
    m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).ellipse([0, 0, W - 1, W - 1], fill=255)
    ap.putalpha(m); pv2 = ap.convert('RGB').resize((300, 300), Image.LANCZOS)
    rp = full_rgb.convert('RGBA'); rp.putalpha(m); pv3 = rp.convert('RGB').resize((300, 300), Image.LANCZOS)
    pv4 = full_rgb.resize((48, 48), Image.LANCZOS).resize((300, 300), Image.NEAREST)
    for i, pv in enumerate([pv1, pv2, pv3, pv4]):
        prev.paste(pv, (i * 310 + 5, 0))
    prev.save(r'C:\blueseasfishing\Assets\android\icon-preview-v4.png')
    print('icon v4 written')

if __name__ == '__main__':
    main()
