import os
from PIL import Image, ImageDraw, ImageFont

W = 1284
H = 2778

im = Image.new('RGB', (W, H), '#F4F8FB')
draw = ImageDraw.Draw(im)

def get_font(name, size, bold=False):
    suffix = 'b' if bold else ''
    font_path = f'C:/Windows/Fonts/{name}{suffix}.ttf'
    if not os.path.exists(font_path):
        font_path = f'C:/Windows/Fonts/{name}.ttf'
    return ImageFont.truetype(font_path, size)

font_status = get_font('segoeui', 42, bold=True)
font_title = get_font('segoeui', 56, bold=True)
font_pill = get_font('segoeui', 34, bold=True)
font_card_eyebrow = get_font('segoeui', 34, bold=True)
font_card_h2 = get_font('segoeui', 50, bold=True)
font_body = get_font('segoeui', 38, bold=False)
font_benefit = get_font('segoeui', 36, bold=False)
font_plan_title = get_font('segoeui', 44, bold=True)
font_plan_sub = get_font('segoeui', 34, bold=False)
font_plan_price = get_font('segoeui', 46, bold=True)
font_btn = get_font('segoeui', 40, bold=True)
font_legal = get_font('segoeui', 30, bold=False)
font_legal_link = get_font('segoeui', 34, bold=True)
font_tab_icon = ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf', 52)
font_tab_label = get_font('segoeui', 30, bold=True)

# 1. Status Bar
draw.rectangle([(0, 0), (W, 140)], fill='#0B1F3E')
draw.text((80, 50), "9:41", font=font_status, fill='#FFFFFF')
draw.text((W - 280, 50), "5G  100%", font=font_status, fill='#FFFFFF')

# 2. Header
draw.rectangle([(0, 140), (W, 280)], fill='#0B1F3E')
draw.text((60, 180), "Blue Seas Fishing", font=font_title, fill='#FFFFFF')

# Pill button in header
pill_x1, pill_y1, pill_x2, pill_y2 = W - 410, 175, W - 60, 245
draw.rounded_rectangle([(pill_x1, pill_y1), (pill_x2, pill_y2)], radius=35, fill='#FF9130')
draw.text((pill_x1 + 35, pill_y1 + 14), "Upgrade · Premium", font=font_pill, fill='#0B1F3E')

# 3. Card Container
card_x1, card_y1, card_x2, card_y2 = 45, 330, W - 45, 2520
draw.rounded_rectangle([(card_x1, card_y1), (card_x2, card_y2)], radius=40, fill='#FFFFFF', outline='#D8E2EA', width=3)

# Card Content
pad_x = card_x1 + 55
y = card_y1 + 55

draw.text((pad_x, y), "BLUE SEAS PREMIUM", font=font_card_eyebrow, fill='#FF9130')
y += 60

draw.text((pad_x, y), "Unlock Unlimited AI Fish ID\n& Destination Trip Plans", font=font_card_h2, fill='#1D3446', spacing=14)
y += 160

body_lines = [
    "Free users get 3 AI fish identifications per day plus full offline",
    "access to 548 species profiles. Upgrade via App Store for unlimited",
    "daily AI identifications and seasonal destination trip plans."
]
for line in body_lines:
    draw.text((pad_x, y), line, font=font_body, fill='#5A7184')
    y += 54
y += 20

# Benefit rows with drawn green check circles
benefits = [
    "Unlimited AI fish photo identifications (no daily cap)",
    "Multi-fish destination trip plans with seasonal bait checklists",
    "Full offline database of 548 species & 20 comparison guides",
    "Cancel anytime in your App Store account settings"
]
for b in benefits:
    # draw green check circle
    cx, cy = pad_x + 18, y + 20
    draw.ellipse([(cx - 16, cy - 16), (cx + 16, cy + 16)], fill='#15803D')
    # white checkmark lines
    draw.line([(cx - 8, cy), (cx - 2, cy + 6)], fill='#FFFFFF', width=3)
    draw.line([(cx - 2, cy + 6), (cx + 8, cy - 6)], fill='#FFFFFF', width=3)

    draw.text((pad_x + 55, y), b, font=font_benefit, fill='#1D3446')
    y += 75
y += 25

# Plan 1: Monthly
p1_h = 160
p1_box = [(pad_x, y), (card_x2 - 55, y + p1_h)]
draw.rounded_rectangle(p1_box, radius=28, fill='#0B1F3E')
draw.text((pad_x + 40, y + 30), "Blue Seas Premium · Monthly", font=font_plan_title, fill='#FFFFFF')
draw.text((pad_x + 40, y + 92), "Unlimited AI fish identifications & trip plans", font=font_plan_sub, fill='#CBD5E1')
draw.text((card_x2 - 340, y + 54), "$7.99 / mo", font=font_plan_price, fill='#FF9130')
y += p1_h + 35

# Plan 2: Yearly
p2_h = 160
p2_box = [(pad_x, y), (card_x2 - 55, y + p2_h)]
draw.rounded_rectangle(p2_box, radius=28, fill='#0B1F3E')
draw.text((pad_x + 40, y + 30), "Blue Seas Premium · Yearly", font=font_plan_title, fill='#FFFFFF')
draw.text((pad_x + 40, y + 92), "Full year of unlimited AI fish IDs & plans (save 37%)", font=font_plan_sub, fill='#CBD5E1')
draw.text((card_x2 - 340, y + 54), "$59.99 / yr", font=font_plan_price, fill='#FF9130')
y += p2_h + 40

# Secondary Button (Restore)
btn_h = 125
btn_box = [(pad_x, y), (card_x2 - 55, y + btn_h)]
draw.rounded_rectangle(btn_box, radius=28, fill='#EEF4F8', outline='#D8E2EA', width=2)
draw.text((pad_x + 280, y + 38), "Restore App Store Purchase", font=font_btn, fill='#0B387C')
y += btn_h + 30

# Manage Subscriptions Link
draw.text((pad_x + 295, y), "Manage subscriptions in App Store", font=font_plan_sub, fill='#0B387C')
y += 75

# Legal disclosure
legal_lines = [
    "Blue Seas Premium Monthly and Yearly are auto-renewing subscriptions.",
    "Payment is charged to your App Store account at confirmation of purchase and",
    "renews automatically unless cancelled at least 24 hours before the end of the",
    "current period. Manage or cancel anytime in your App Store account settings."
]
for line in legal_lines:
    draw.text((pad_x + 30, y), line, font=font_legal, fill='#5A7184')
    y += 44
y += 20

# EULA & Privacy Policy links
draw.text((pad_x + 310, y), "Terms of Use (EULA)", font=font_legal_link, fill='#0B387C')
draw.text((pad_x + 650, y), "·", font=font_legal_link, fill='#5A7184')
draw.text((pad_x + 685, y), "Privacy Policy", font=font_legal_link, fill='#0B387C')

# 4. Tab Bar at bottom
tab_y = H - 220
draw.rectangle([(0, tab_y), (W, H)], fill='#FFFFFF', outline='#D8E2EA', width=2)

tabs = [
    ("📷", "Identify", False),
    ("🐟", "Species", False),
    ("⚖️", "Compare", False),
    ("📍", "Destinations", False),
    ("⭐", "Premium", True),
]

tab_w = W // len(tabs)
for i, (icon, label, active) in enumerate(tabs):
    tx = i * tab_w + (tab_w // 2)
    color = '#FF9130' if active else '#5A7184'
    draw.text((tx - 26, tab_y + 35), icon, font=font_tab_icon, fill=color)
    draw.text((tx - 40, tab_y + 115), label, font=font_tab_label, fill=color)

out_path = 'C:/blueseasfishing/Assets/ios/bsf-iap-review-screenshot.png'
im.save(out_path, 'PNG')
print(f"Generated {out_path} ({W}x{H}) successfully!")
