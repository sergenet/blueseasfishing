"""Blue Seas Fishing icon v5 - SIMPLE flat fish.

Minimal, friendly, iconic: rounded oval body, simple fan tail with a notched
trailing edge, one small rounded dorsal fin, one pectoral fin, smiling face.
Orange fish on a deep-blue ocean gradient with a few bubbles.
No sailfish/swordfish features. Output pipeline same as v4.
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
ASSETS = r'C:\blueseasfishing\Assets\android'
DESKTOP = r'C:\Users\Serge\Desktop'

BODY = (255, 145, 48)
BELLY = (255, 208, 140)
FIN = (240, 105, 26)
GILL = (219, 96, 22)
MOUTH = (140, 58, 14)
EYE = (16, 34, 66)
BUBBLE = (150, 212, 248, 210)

# ------------------------------------------------------------------ helpers
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

def quad_bezier(p0, p1, p2, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts

def ell_pts(cx, cy, rx, ry, rot=0.0, n=64):
    r = math.radians(rot)
    cr, sr = math.cos(r), math.sin(r)
    pts = []
    for i in range(n):
        a = math.tau * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    return pts

# fish placement: tiny upward tilt so it feels alive, nudged right/down
TILT = math.radians(-4)
FCX, FCY = 0.50, 0.47
FOX, FOY = 0.025, 0.035

def T(pts):
    ca, sa = math.cos(TILT), math.sin(TILT)
    out = []
    for x, y in pts:
        dx, dy = x - FCX, y - FCY
        out.append(((FOX + FCX + dx * ca - dy * sa) * WW,
                    (FOY + FCY + dx * sa + dy * ca) * HH))
    return out

def P(x, y):
    return T([(x, y)])[0]

# ---------------------------------------------------------------- fish parts
def tail_pts():
    """Fan tail with concave trailing edge, attached behind the body."""
    A = (0.228, 0.432)            # top attach (hidden behind body)
    B = (0.228, 0.568)            # bottom attach (hidden behind body)
    C1 = (0.070, 0.352)           # top corner
    C2 = (0.070, 0.648)           # bottom corner
    N = (0.122, 0.500)            # trailing-edge notch
    pts = quad_bezier(A, (0.128, 0.392), C1, 12)
    pts += quad_bezier(C1, (0.126, 0.428), N, 10)[1:]
    pts += quad_bezier(N, (0.126, 0.572), C2, 10)[1:]
    pts += quad_bezier(C2, (0.128, 0.608), B, 12)[1:]
    return pts

def dorsal_pts():
    """One small rounded hump on the back - NOT a sail."""
    L = (0.372, 0.330)
    Pk = (0.475, 0.200)
    R = (0.588, 0.322)
    return [L] + quad_bezier(L, (0.392, 0.224), Pk, 12)[1:] \
              + quad_bezier(Pk, (0.560, 0.236), R, 12)[1:]

def build_background():
    stops = [
        (0.00, (14, 44, 96)),
        (0.45, (11, 56, 124)),
        (1.00, (6, 24, 62)),
    ]
    bg = vertical_gradient((WW, HH), stops).convert('RGBA')
    radial_glow(bg, WW * 0.52, HH * 0.47, WW * 0.52, (170, 215, 255), 0.16)
    return bg

def build_foreground():
    im = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # fins/tail behind the body
    d.polygon(T(tail_pts()), fill=FIN + (255,))
    d.polygon(T(dorsal_pts()), fill=FIN + (255,))

    # rounded oval body
    d.polygon(T(ell_pts(0.50, 0.47, 0.300, 0.208)), fill=BODY + (255,))

    # lighter belly
    d.polygon(T(ell_pts(0.46, 0.612, 0.190, 0.088)), fill=BELLY + (255,))

    # gill arc
    gp = T(quad_bezier((0.592, 0.425), (0.622, 0.485), (0.590, 0.548), 16))
    d.line(gp, fill=GILL + (255,), width=max(3, int(0.011 * WW)), joint='curve')

    # small pectoral fin on the flank
    d.polygon(T(ell_pts(0.470, 0.580, 0.090, 0.042, rot=-38)), fill=FIN + (255,))

    # eye + highlight
    ex, ey = P(0.655, 0.445)
    er = 0.034 * WW
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=EYE + (255,))
    hx, hy = P(0.644, 0.432)
    hr = 0.012 * WW
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 255, 255, 235))

    # small smile
    mp = T(quad_bezier((0.700, 0.530), (0.735, 0.578), (0.762, 0.548), 16))
    d.line(mp, fill=MOUTH + (255,), width=max(3, int(0.012 * WW)), joint='curve')

    # a few bubbles
    for bx, by, br in [(0.150, 0.235, 0.024), (0.105, 0.315, 0.015), (0.205, 0.165, 0.013)]:
        r = br * WW
        d.ellipse([bx * WW - r, by * HH - r, bx * WW + r, by * HH + r], fill=BUBBLE)

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

def circle_mask(size):
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size - 1, size - 1], fill=255)
    return m

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
        big = full_rgb.resize((s * S, s * S), Image.LANCZOS).convert('RGBA')
        big.putalpha(circle_mask(s * S))
        big.resize((s, s), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_round.png'), 'PNG', optimize=True)

    os.makedirs(STORE, exist_ok=True)
    icon512 = os.path.join(STORE, 'play-icon-512.png')
    full_rgb.resize((512, 512), Image.LANCZOS).save(icon512, 'PNG', optimize=True)

    # preview sheet: square | adaptive circle | round | 48px tile
    prev = Image.new('RGB', (4 * 300 + 50, 300), (24, 24, 28))
    pv1 = full_rgb.resize((300, 300), Image.LANCZOS)
    ap = bg.convert('RGBA'); ap.alpha_composite(fg_adaptive)
    m = circle_mask(W)
    ap.putalpha(m); pv2 = ap.convert('RGB').resize((300, 300), Image.LANCZOS)
    rp = full_rgb.convert('RGBA'); rp.putalpha(m); pv3 = rp.convert('RGB').resize((300, 300), Image.LANCZOS)
    pv4 = full_rgb.resize((48, 48), Image.LANCZOS).resize((300, 300), Image.NEAREST)
    for i, pv in enumerate([pv1, pv2, pv3, pv4]):
        prev.paste(pv, (i * 310 + 5, 0))
    prev_path = os.path.join(ASSETS, 'icon-preview-v5.png')
    prev.save(prev_path)

    # Desktop copies so Serge can actually see them
    os.makedirs(DESKTOP, exist_ok=True)
    prev.save(os.path.join(DESKTOP, 'New-App-Icon-Preview.png'), 'PNG', optimize=True)
    full_rgb.resize((512, 512), Image.LANCZOS).save(os.path.join(DESKTOP, 'New-App-Icon.png'), 'PNG', optimize=True)

    print('icon v5 written')
    print('  store:', icon512)
    print('  preview:', prev_path)
    print('  desktop:', os.path.join(DESKTOP, 'New-App-Icon.png'))

if __name__ == '__main__':
    main()
