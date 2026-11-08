"""
make_profile_icon_fitted.py - Generates circle-safe, perfectly framed profile pictures
for Facebook, Instagram, Twitter/X, and TikTok.
Ensures the fish logo and bubbles fit completely inside any circular avatar mask
without being cropped or cut off.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

S = 4
W = H = 1080
WW, HH = W * S, H * S

BODY = (255, 145, 48)
BELLY = (255, 208, 140)
FIN = (240, 105, 26)
GILL = (219, 96, 22)
MOUTH = (140, 58, 14)
EYE = (16, 34, 66)
BUBBLE = (150, 212, 248, 210)

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
    ca, sa = math.cos(TILT), math.sin(TILT)
    dx, dy = x - FCX, y - FCY
    return ((FOX + FCX + dx * ca - dy * sa) * WW,
            (FOY + FCY + dx * sa + dy * ca) * HH)

def tail_pts():
    t_base_top = (0.24, 0.45)
    t_base_bot = (0.25, 0.53)
    t_top_tip = (0.07, 0.31)
    t_notch = (0.13, 0.49)
    t_bot_tip = (0.08, 0.67)
    pts = []
    pts += quad_bezier(t_base_top, (0.15, 0.36), t_top_tip, 16)
    pts += quad_bezier(t_top_tip, (0.09, 0.41), t_notch, 16)
    pts += quad_bezier(t_notch, (0.11, 0.58), t_bot_tip, 16)
    pts += quad_bezier(t_bot_tip, (0.17, 0.62), t_base_bot, 16)
    return pts

def dorsal_pts():
    d_start = (0.42, 0.28)
    d_peak = (0.49, 0.16)
    d_end = (0.58, 0.29)
    pts = []
    pts += quad_bezier(d_start, (0.44, 0.19), d_peak, 16)
    pts += quad_bezier(d_peak, (0.54, 0.20), d_end, 16)
    return pts

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

    d.polygon(T(tail_pts()), fill=FIN + (255,))
    d.polygon(T(dorsal_pts()), fill=FIN + (255,))
    d.polygon(T(ell_pts(0.50, 0.47, 0.300, 0.208)), fill=BODY + (255,))
    d.polygon(T(ell_pts(0.46, 0.612, 0.190, 0.088)), fill=BELLY + (255,))

    gp = T(quad_bezier((0.592, 0.425), (0.622, 0.485), (0.590, 0.548), 16))
    d.line(gp, fill=GILL + (255,), width=max(3, int(0.011 * WW)), joint='curve')

    d.polygon(T(ell_pts(0.470, 0.580, 0.090, 0.042, rot=-38)), fill=FIN + (255,))

    ex, ey = P(0.655, 0.445)
    er = 0.034 * WW
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=EYE + (255,))
    hx, hy = P(0.644, 0.432)
    hr = 0.012 * WW
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 255, 255, 235))

    mp = T(quad_bezier((0.700, 0.530), (0.735, 0.578), (0.762, 0.548), 16))
    d.line(mp, fill=MOUTH + (255,), width=max(3, int(0.012 * WW)), joint='curve')

    for bx, by, br in [(0.150, 0.235, 0.024), (0.105, 0.315, 0.015), (0.205, 0.165, 0.013)]:
        r = br * WW
        d.ellipse([bx * WW - r, by * HH - r, bx * WW + r, by * HH + r], fill=BUBBLE)

    return im

def main():
    print("Generating circle-safe fitted profile icon...")
    bg = build_background()
    fg = build_foreground()

    # Crop foreground artwork to its true bounds
    bbox = fg.getbbox()
    art = fg.crop(bbox)
    
    # Scale down so it fits comfortably inside Facebook's tight circular mask (44% of canvas)
    target_dim = int(WW * 0.44)
    ratio = min(target_dim / art.width, target_dim / art.height)
    new_w = int(art.width * ratio)
    new_h = int(art.height * ratio)
    art_scaled = art.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Center on canvas
    canvas_fg = Image.new('RGBA', (WW, HH), (0, 0, 0, 0))
    paste_x = (WW - new_w) // 2
    paste_y = (HH - new_h) // 2
    canvas_fg.alpha_composite(art_scaled, (paste_x, paste_y))

    # Combine background and centered, scaled foreground
    full = Image.new('RGBA', (WW, HH))
    full.alpha_composite(bg)
    full.alpha_composite(canvas_fg)

    # Downscale supersampled image to final clean 512x512
    final_512 = full.resize((512, 512), Image.Resampling.LANCZOS).convert('RGB')
    final_1024 = full.resize((1024, 1024), Image.Resampling.LANCZOS).convert('RGB')

    # Destination paths
    targets = [
        r"C:\blueseasfishing\Assets\android\icon-new-512.png",
        r"C:\blueseasfishing\Assets\android\icon-profile-fit.png",
        r"C:\blueseasfishing\Assets\zeely-ads\icon-new-512.png",
        r"C:\blueseasfishing\Assets\zeely-ads\icon-profile-fit.png",
        r"C:\blueseasfishing\control-room\profile-icon.png",
        r"C:\Users\Serge\Desktop\BlueSeas-Profile-Picture-Fitted.png",
        r"C:\Users\Serge\OneDrive\Desktop\BlueSeas-Profile-Picture-Fitted.png"
    ]

    for p in targets:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            final_512.save(p, "PNG", optimize=True)
            print(f"Saved: {p}")
        except Exception as e:
            print(f"Failed {p}: {e}")

    # Also save 1024 version on Desktop
    try:
        final_1024.save(r"C:\Users\Serge\Desktop\BlueSeas-Profile-Picture-1024.png", "PNG", optimize=True)
        final_1024.save(r"C:\Users\Serge\OneDrive\Desktop\BlueSeas-Profile-Picture-1024.png", "PNG", optimize=True)
        print("Saved 1024px version on Desktop.")
    except Exception:
        pass

    print("Circle-safe profile picture generation complete!")

if __name__ == "__main__":
    main()
