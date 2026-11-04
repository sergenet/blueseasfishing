"""Blue Seas Fishing — iOS App Store icon generator.

Reuses the approved v5 fish art (make_icon_v5.py) and composes it into the
sizes the iOS project needs. App Store icons must be square, full-bleed and
have NO alpha channel — we flatten onto the ocean gradient and save RGB.

Outputs (under ios-project/):
  AppIcon/AppIcon-1024.png                       review/marketing size
  AppIcon/AppIcon-180.png                        home-screen size (reference)
  Assets.xcassets/AppIcon.appiconset/AppIcon.png  the icon Xcode actually uses
  Assets.xcassets/AppIconImage.imageset/AppIconImage.png  in-app About image
  Desktop copy: BlueSeas-iOS-AppIcon.png          so Serge can eyeball it
"""
import os
import sys

from PIL import Image

TOOLS = r'C:\blueseasfishing\tools'
sys.path.insert(0, TOOLS)

import make_icon_v5 as v5  # noqa: E402  (imports the approved v5 geometry)

PROJECT = (r'C:\blueseasfishing\blueseas-fishing-working-website'
           r'\blueseasfishing.com\ios-project')
DESKTOP = r'C:\Users\Serge\Desktop'


def flatten_icon(size: int) -> Image.Image:
    """Compose v5 bg+fg at full resolution, then downscale to `size` RGB."""
    bg = v5.build_background()          # RGBA, full-res gradient + glow
    fg = v5.build_foreground()          # RGBA, full-res fish
    full = bg.copy()
    full.alpha_composite(fg)
    return full.convert('RGB').resize((size, size), Image.LANCZOS)


def main() -> None:
    icon1024 = flatten_icon(1024)
    icon180 = flatten_icon(180)

    appicon_dir = os.path.join(PROJECT, 'AppIcon')
    os.makedirs(appicon_dir, exist_ok=True)
    icon1024.save(os.path.join(appicon_dir, 'AppIcon-1024.png'), 'PNG', optimize=True)
    icon180.save(os.path.join(appicon_dir, 'AppIcon-180.png'), 'PNG', optimize=True)

    # The asset catalog copy Xcode compiles into the app.
    appiconset = os.path.join(PROJECT, 'Assets.xcassets', 'AppIcon.appiconset')
    os.makedirs(appiconset, exist_ok=True)
    icon1024.save(os.path.join(appiconset, 'AppIcon.png'), 'PNG', optimize=True)

    # In-app About screen image (MoreView.swift references "AppIconImage").
    imageset = os.path.join(PROJECT, 'Assets.xcassets', 'AppIconImage.imageset')
    os.makedirs(imageset, exist_ok=True)
    icon180.save(os.path.join(imageset, 'AppIconImage.png'), 'PNG', optimize=True)

    os.makedirs(DESKTOP, exist_ok=True)
    icon1024.save(os.path.join(DESKTOP, 'BlueSeas-iOS-AppIcon.png'), 'PNG', optimize=True)

    for p in [os.path.join(appiconset, 'AppIcon.png'),
              os.path.join(appicon_dir, 'AppIcon-1024.png'),
              os.path.join(imageset, 'AppIconImage.png'),
              os.path.join(DESKTOP, 'BlueSeas-iOS-AppIcon.png')]:
        im = Image.open(p)
        print(f'wrote {p}  {im.size} {im.mode}')


if __name__ == '__main__':
    main()
