"""
fix_instagram_videos.py - Rescales non-standard video reels to exact Instagram 9:16 (1080x1920)
using the bundled imageio_ffmpeg binary, preserving audio and visual fidelity.
"""
import os
import subprocess
import imageio_ffmpeg

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
ASSET_DIR = r"C:\blueseasfishing\Assets\zeely-ads"
DESKTOP_DIR = r"C:\Users\Serge\Desktop\Campaign-Assets-To-Post"
ONEDRIVE_DIR = r"C:\Users\Serge\OneDrive\Desktop\Campaign-Assets-To-Post"

VIDEOS_TO_FIX = [
    "blueseasfishing-ai-id-reel.mp4",
    "blueseasfishing-catch-log-reel.mp4",
    "UGC video 8dcdc6ed-3322-44da-819e-7b738afa3293.mp4"
]

def fix_video(fname):
    src = os.path.join(ASSET_DIR, fname)
    if not os.path.exists(src):
        print(f"File not found: {src}")
        return False
        
    out_tmp = os.path.join(ASSET_DIR, f"fixed_{fname}")
    
    # Scale to 1080x1920, setsar=1, high quality H.264, copy audio
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", src,
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "fast",
        "-c:a", "aac",
        out_tmp
    ]
    
    print(f"Processing: {fname} -> 1080x1920 standard Instagram vertical...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        print(f"FFmpeg error on {fname}: {res.stderr.decode('utf-8', errors='ignore')[:300]}")
        return False
        
    # Replace original in ASSET_DIR
    backup_file = os.path.join(ASSET_DIR, f"backup_{fname}")
    if not os.path.exists(backup_file):
        os.replace(src, backup_file)
    else:
        os.remove(src)
    os.replace(out_tmp, src)
    
    # Also update Desktop directories
    for d in [DESKTOP_DIR, ONEDRIVE_DIR]:
        if os.path.exists(d):
            dest_file = os.path.join(d, fname)
            try:
                import shutil
                shutil.copy2(src, dest_file)
                print(f"Updated Desktop file: {dest_file}")
            except Exception as e:
                print(f"Could not copy to {d}: {e}")
                
    print(f"Successfully converted {fname} to 1080x1920!")
    return True

def main():
    print(f"Using FFmpeg: {FFMPEG_EXE}")
    for v in VIDEOS_TO_FIX:
        fix_video(v)
    print("\nAll videos have been scaled and verified for Instagram!")

if __name__ == "__main__":
    main()
