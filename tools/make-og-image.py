"""
Build NexusCut's 1200x630 Open Graph card.

Every share of nexuscut.io rendered a blank large card because no page set
og:image, while twitter:card claimed summary_large_image. This produces the one
asset those tags point at.

Run:  python tools/make-og-image.py <path-to-logo.jpg> <out.png>
"""

import sys
from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 630


def build(logo_path: str, out_path: str) -> None:
    logo = Image.open(logo_path).convert("RGBA")

    # Match the card background to the logo's own dark navy so the mark looks
    # native rather than pasted onto a different shade. The literal corner is
    # white padding around the rounded square, so sample the darkest common
    # colour instead - that is the mark's real background.
    from collections import Counter

    px = logo.convert("RGB")
    dark = Counter()
    for gy in range(0, px.height, 4):
        for gx in range(0, px.width, 4):
            p = px.getpixel((gx, gy))
            if p[0] + p[1] + p[2] < 220:  # ignore white padding and light glow
                dark[p] += 1
    base = dark.most_common(1)[0][0] if dark else (10, 10, 40)

    card = Image.new("RGB", (W, H), base)

    # Soft radial glow behind the mark: a blurred ellipse, scaled up, added in
    # screen-ish fashion. Keeps the flat background from looking dead.
    glow = Image.new("RGB", (W, H), base)
    g = ImageDraw.Draw(glow)
    cx, cy = W // 2, H // 2
    for r in range(300, 60, -12):
        t = 1 - (r - 60) / 240
        g.ellipse(
            [cx - r * 1.6, cy - r, cx + r * 1.6, cy + r],
            fill=(
                min(255, base[0] + int(10 * t)),
                min(255, base[1] + int(14 * t)),
                min(255, base[2] + int(46 * t)),
            ),
        )
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    card = Image.blend(card, glow, 0.85)

    # Paste the logo as a rounded-square badge, source of truth for the brand.
    size = 360
    mark = logo.resize((size, size), Image.LANCZOS)
    radius = int(size * 0.22)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

    x, y = (W - size) // 2, (H - size) // 2
    card.paste(mark.convert("RGB"), (x, y), mask)

    # One-pixel inner ring reads as intentional framing at small preview sizes.
    ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle(
        [x, y, x + size - 1, y + size - 1], radius=radius, outline=(120, 190, 255, 46), width=2
    )
    card = Image.alpha_composite(card.convert("RGBA"), ring).convert("RGB")

    card.save(out_path, "PNG", optimize=True)
    print(f"wrote {out_path} {card.size[0]}x{card.size[1]} bg={base}")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
