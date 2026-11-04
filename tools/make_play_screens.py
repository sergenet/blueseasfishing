"""Crop browser-chrome out of device screenshots and produce Play-ready assets.

Play Console rules (phone & tablet screenshots):
  - PNG/JPEG, min side >= 320px, max side <= 3840px, max side <= 2x min side.
Crops chosen from row-profile analysis (tools/analyze_screens.py).
"""
from PIL import Image
import os

SRC = r'C:\blueseasfishing\Assets\android'
OUT = os.path.join(SRC, 'play-upload')
os.makedirs(OUT, exist_ok=True)

# name -> (source file, crop box (l, t, r, b), out base name, exact target (w,h) or None)
JOBS = [
    # iPads 2048x1536: content starts ~384 (chrome 0-345, white pad 350-390).
    # Crop to 2048x1126, then stretch ~2% to exact 16:9 = 2048x1152.
    ('tab-1-identify.png',  'iPad identify.PNG',              (0, 384, 2048, 1510), (2048, 1152)),
    ('tab-2-identified.png','iPad identified.PNG',            (0, 384, 2048, 1510), (2048, 1152)),
    ('tab-3-database.png',  'iPad fish identification.PNG',   (0, 384, 2048, 1510), (2048, 1152)),
    # Mobiles 1179x2556: chrome ends ~230; bottom: home-indicator bar ~2440-2556.
    # Crop y 230-2437 -> 1179x2207, then squash ~5% to exact 9:16 = 1179x2096.
    ('phone-1-main.png',    'Mobile main screen.PNG',         (0, 340, 1179, 2437), (1179, 2096)),
    ('phone-2-identify.png','Mobile identify.PNG',            (0, 230, 1179, 2437), (1179, 2096)),
    ('phone-3-analysis.png','Mobile analysis.PNG',            (0, 380, 1179, 2437), (1179, 2096)),
    ('phone-4-identified.png','Mobile identified.PNG',        (0, 230, 1179, 2437), (1179, 2096)),
    # Older 1080x2408 shot: blue Safari bar 0-66, page from ~70.
    # Crop y 70-2077 -> 1080x2007, then squash ~4.5% to exact 9:16 = 1080x1920.
    ('phone-5-upload.png',  'Mobile upload photo.jpg',        (0, 70, 1080, 2077), (1080, 1920)),
]

for out_name, src_name, box, target in JOBS:
    im = Image.open(os.path.join(SRC, src_name)).convert('RGB')
    c = im.crop(box)
    if target and c.size != target:
        c = c.resize(target, Image.LANCZOS)
    dst = os.path.join(OUT, out_name)
    c.save(dst, 'PNG', optimize=True)
    w, h = c.size
    print(f'{out_name}: {w}x{h}  ratio={w/h:.3f}  {os.path.getsize(dst)//1024}KB')

# Contact sheet of results for visual verification
from PIL import ImageDraw
files = [j[0] for j in JOBS]
cell_w, cell_h, label_h = 300, 480, 26
cols = 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell_w, rows * (cell_h + label_h)), (30, 30, 30))
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(OUT, f))
    im.thumbnail((cell_w - 8, cell_h - 8))
    x = (i % cols) * cell_w
    y = (i // cols) * (cell_h + label_h)
    sheet.paste(im, (x + 4, y + label_h + 2))
    draw.text((x + 6, y + 6), f'{i+1}. {f}', fill=(255, 255, 100))
sheet.save(os.path.join(OUT, '_result_sheet.png'))
print('result sheet saved:', sheet.size)
