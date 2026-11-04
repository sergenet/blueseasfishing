"""Analyze row-color bands of raw device screenshots to find browser-chrome boundaries."""
from PIL import Image
import numpy as np
import os

SRC = r'C:\blueseasfishing\Assets\android'

def classify_rows(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blue = (b > r + 30) & (b > g + 15) & (b > 80) & (r < 190)
    blue_frac = blue.mean(axis=1)
    mean = a.mean(axis=(1, 2))
    std = a.std(axis=(1, 2))
    return blue_frac, mean, std

def report(name):
    p = os.path.join(SRC, name)
    im = Image.open(p)
    w, h = im.size
    blue_frac, mean, std = classify_rows(im)
    print(f'=== {name} ({w}x{h}) ===')
    # Print a compact profile every 10 rows: blue fraction and mean brightness
    lines = []
    for y in range(0, h, 10):
        lines.append(f'{y:5d} blue={blue_frac[y]:.2f} mean={mean[y]:6.1f} std={std[y]:5.1f}')
    # Find the long dark band (black letterbox) at top/bottom
    dark = mean < 25
    # top dark run
    y0 = 0
    while y0 < h and dark[y0:y0+10].all():
        y0 += 10
    y1 = h - 1
    while y1 > 0 and dark[max(0,y1-9):y1+1].all():
        y1 -= 10
    print(f'approx top-dark ends ~{y0}, bottom-dark starts ~{y1}')
    # Find chrome rows: rows near top with low std (flat bars) - print first 400 and last 400 rows condensed
    print('--- top rows (every 10) ---')
    print('\n'.join(lines[:40]))
    print('--- bottom rows (every 10) ---')
    print('\n'.join(lines[-40:]))

for f in ['iPad identify.PNG', 'iPad identified.PNG', 'iPad fish identification.PNG',
          'Mobile main screen.PNG', 'Mobile identify.PNG', 'Mobile analysis.PNG',
          'Mobile identified.PNG', 'Mobile upload photo.jpg']:
    report(f)
    print()
